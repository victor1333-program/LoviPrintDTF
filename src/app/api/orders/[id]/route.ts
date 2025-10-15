import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusUpdateEmail, sendAdminOrderNotification } from '@/lib/email'
import { calculatePointsEarned, calculateTier } from '@/lib/loyalty'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        shipment: {
          include: {
            trackingEvents: {
              orderBy: {
                eventDate: 'desc'
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)

  } catch (error) {
    console.error('Error al obtener pedido:', error)
    return NextResponse.json(
      { error: 'Error al obtener el pedido' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, paymentStatus, adminNotes, trackingNumber, notes } = body

    const updateData: any = {}

    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (notes !== undefined) updateData.notes = notes

    // Obtener el pedido actual antes de actualizarlo
    const currentOrder = await prisma.order.findUnique({
      where: { orderNumber: id },
      select: {
        id: true,
        status: true,
        userId: true,
        totalPrice: true,
        pointsEarned: true,
        isVoucherPurchase: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar orden usando transacción para manejar puntos
    const order = await prisma.$transaction(async (tx) => {
      // Actualizar la orden
      const updatedOrder = await tx.order.update({
        where: { orderNumber: id },
        data: updateData,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      })

      // Si el estado cambió a COMPLETED y tiene usuario, asignar puntos
      if (
        status === 'COMPLETED' &&
        currentOrder.status !== 'COMPLETED' &&
        currentOrder.userId &&
        currentOrder.pointsEarned === 0 // Solo si no se han asignado puntos antes
      ) {
        const user = await tx.user.findUnique({
          where: { id: currentOrder.userId },
          select: { loyaltyTier: true, totalSpent: true }
        })

        if (user) {
          // Determinar si es compra de bono (voucher)
          const isVoucherPurchase = currentOrder.items.some(
            item => item.product.productType === 'VOUCHER'
          )

          // Calcular puntos ganados
          const pointsEarned = calculatePointsEarned(
            parseFloat(currentOrder.totalPrice.toString()),
            user.loyaltyTier,
            isVoucherPurchase
          )

          // Actualizar totalSpent del usuario
          const newTotalSpent = parseFloat(user.totalSpent.toString()) +
                               parseFloat(currentOrder.totalPrice.toString())

          // Calcular nuevo tier basado en totalSpent actualizado
          const newTier = calculateTier(newTotalSpent)

          // Actualizar usuario con puntos, totalSpent y tier
          await tx.user.update({
            where: { id: currentOrder.userId },
            data: {
              loyaltyPoints: {
                increment: pointsEarned
              },
              totalSpent: newTotalSpent,
              loyaltyTier: newTier
            }
          })

          // Actualizar pedido con puntos ganados y flag de voucher
          await tx.order.update({
            where: { id: currentOrder.id },
            data: {
              pointsEarned: pointsEarned,
              isVoucherPurchase: isVoucherPurchase
            }
          })

          // Crear registro en historial de puntos
          await tx.loyaltyPoints.create({
            data: {
              userId: currentOrder.userId,
              points: pointsEarned,
              type: 'EARNED',
              description: `Puntos ganados por pedido completado ${id}${isVoucherPurchase ? ' (Bono +25%)' : ''}`,
              orderId: currentOrder.id
            }
          })
        }
      }

      return updatedOrder
    })

    // Si cambió el estado, crear historial y enviar email
    if (status && status !== currentOrder.status) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: status,
          notes: adminNotes || `Estado cambiado a ${status}`,
        },
      })

      // Enviar email al cliente (en background)
      sendOrderStatusUpdateEmail(order, status).catch(err =>
        console.error('Error sending status update email:', err)
      )

      // Notificar al admin también (en background)
      sendAdminOrderNotification(order).catch(err =>
        console.error('Error sending admin notification:', err)
      )
    }

    return NextResponse.json(order)

  } catch (error) {
    console.error('Error al actualizar pedido:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    )
  }
}
