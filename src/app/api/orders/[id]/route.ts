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

    // Try to find by database ID first, then by orderNumber
    let order = await prisma.order.findUnique({
      where: {
        id: id
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

    // If not found by ID, try by orderNumber
    if (!order) {
      order = await prisma.order.findUnique({
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
    }

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
    const { status, paymentStatus, paymentMethod, adminNotes, trackingNumber, notes } = body

    const updateData: any = {}

    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (paymentMethod) updateData.paymentMethod = paymentMethod
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (notes !== undefined) updateData.notes = notes

    // Obtener el pedido actual antes de actualizarlo
    // Try by database ID first, then by orderNumber
    let currentOrder = await prisma.order.findUnique({
      where: { id: id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
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

    // If not found by ID, try by orderNumber
    if (!currentOrder) {
      currentOrder = await prisma.order.findUnique({
        where: { orderNumber: id },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
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
    }

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar orden usando transacción para manejar puntos
    const order = await prisma.$transaction(async (tx) => {
      // Actualizar la orden using the database ID
      const updatedOrder = await tx.order.update({
        where: { id: currentOrder.id },
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

      // Si el pedido está pagado y tiene usuario, asignar puntos
      // Esto cubre tanto cambios a DELIVERED como cambios manuales de estado con pago confirmado
      const finalPaymentStatus = paymentStatus || currentOrder.paymentStatus
      const finalStatus = status || currentOrder.status

      const shouldAwardPoints = (
        currentOrder.userId &&
        currentOrder.pointsEarned === 0 && // Solo si no se han asignado puntos antes
        finalPaymentStatus === 'PAID' && // El pago debe estar confirmado
        (
          // El estado debe ser READY, SHIPPED o DELIVERED
          ['READY', 'SHIPPED', 'DELIVERED'].includes(finalStatus)
        )
      )

      if (shouldAwardPoints) {
        const user = await tx.user.findUnique({
          where: { id: currentOrder.userId! }, // Ya verificamos que userId existe en shouldAwardPoints
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
            where: { id: currentOrder.userId! },
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

          // Obtener o crear LoyaltyPoints
          let loyaltyPoints = await tx.loyaltyPoints.findUnique({
            where: { userId: currentOrder.userId! }
          })

          if (!loyaltyPoints) {
            loyaltyPoints = await tx.loyaltyPoints.create({
              data: {
                userId: currentOrder.userId!,
                totalPoints: pointsEarned,
                availablePoints: pointsEarned,
                lifetimePoints: pointsEarned,
                tier: newTier
              }
            })
          } else {
            await tx.loyaltyPoints.update({
              where: { id: loyaltyPoints.id },
              data: {
                totalPoints: { increment: pointsEarned },
                availablePoints: { increment: pointsEarned },
                lifetimePoints: { increment: pointsEarned },
                tier: newTier
              }
            })
          }

          // Crear registro en historial de puntos
          await tx.pointTransaction.create({
            data: {
              pointsId: loyaltyPoints.id,
              points: pointsEarned,
              type: 'earned',
              description: `Puntos ganados por pedido completado ${updatedOrder.orderNumber}${isVoucherPurchase ? ' (Bono +25%)' : ''}`,
              orderId: currentOrder.id
            }
          })
        }
      }

      return updatedOrder
    })

    // Si cambió el estado, crear historial y enviar email
    const statusChanged = status && status !== currentOrder.status
    const trackingNumberUpdated = trackingNumber !== undefined && trackingNumber !== '' && trackingNumber !== order.trackingNumber
    const isShipped = status === 'SHIPPED' || (order.status === 'SHIPPED' && !status)

    if (statusChanged) {
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
    // Si el pedido está en estado SHIPPED y se actualiza el número de seguimiento
    else if (isShipped && trackingNumberUpdated) {
      // Enviar email con el número de seguimiento actualizado
      sendOrderStatusUpdateEmail(order, order.status).catch(err =>
        console.error('Error sending tracking number update email:', err)
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
