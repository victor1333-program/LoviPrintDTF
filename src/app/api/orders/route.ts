import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'
import { validatePointsUsage } from '@/lib/loyalty'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const {
      customerName,
      customerEmail,
      customerPhone,
      items, // Array de { productId, quantity, unitPrice, subtotal, fileUrl, fileName, fileMetadata }
      subtotal,
      discountAmount,
      taxAmount,
      shippingCost,
      totalPrice,
      shippingAddress,
      notes,
      voucherId,
      pointsUsed = 0,
      pointsDiscount = 0,
      useMeterVouchers = false,
      meterVouchersInfo = null
    } = body

    // Validaciones básicas
    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Si se están usando puntos, validar
    let userId: string | undefined
    if (pointsUsed > 0) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Debes estar autenticado para usar puntos' },
          { status: 401 }
        )
      }

      userId = session.user.id

      // Obtener datos del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Validar que tiene suficientes puntos
      const validation = validatePointsUsage(
        pointsUsed,
        user.loyaltyPoints,
        parseFloat(subtotal)
      )

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Verificar si algún producto es un bono (VOUCHER)
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productType: true }
    })

    const isVoucherOrder = products.some(p => p.productType === 'VOUCHER')

    // Generar número de orden único (con prefijo BONO si es un bono)
    const orderNumber = generateOrderNumber(isVoucherOrder)

    // Usar una transacción para crear el pedido y actualizar puntos
    const order = await prisma.$transaction(async (tx) => {
      // Si usa bonos de metros, el pedido se considera pagado
      const isPaidWithVouchers = useMeterVouchers && meterVouchersInfo
      const orderStatus = isPaidWithVouchers ? 'CONFIRMED' : 'PENDING'
      const paymentStatus = isPaidWithVouchers ? 'PAID' : 'PENDING'

      // Crear el pedido con items
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          userId: userId || null,
          voucherId: voucherId || null,
          subtotal: parseFloat(subtotal),
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount: parseFloat(taxAmount),
          shippingCost: parseFloat(shippingCost),
          totalPrice: parseFloat(totalPrice),
          shippingAddress: shippingAddress || null,
          notes: useMeterVouchers ? `Pagado con bonos de metros (${meterVouchersInfo?.metersNeeded} metros)` : notes || null,
          status: orderStatus,
          paymentStatus: paymentStatus,
          pointsUsed: pointsUsed,
          pointsDiscount: parseFloat(pointsDiscount || 0),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              subtotal: parseFloat(item.subtotal),
              fileUrl: item.fileUrl || null,
              fileName: item.fileName || null,
              fileMetadata: item.fileMetadata || null,
              customizations: item.customizations || null,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Si se usaron puntos, descontarlos del usuario
      if (pointsUsed > 0 && userId) {
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              decrement: pointsUsed
            }
          }
        })

        // Obtener o crear el registro de LoyaltyPoints del usuario
        let loyaltyRecord = await tx.loyaltyPoints.findUnique({
          where: { userId: userId }
        })

        if (!loyaltyRecord) {
          // Crear si no existe
          loyaltyRecord = await tx.loyaltyPoints.create({
            data: {
              userId: userId,
              totalPoints: 0,
              availablePoints: 0,
              lifetimePoints: 0,
              tier: 'BRONZE'
            }
          })
        }

        // Actualizar puntos disponibles
        await tx.loyaltyPoints.update({
          where: { id: loyaltyRecord.id },
          data: {
            availablePoints: {
              decrement: pointsUsed
            }
          }
        })

        // Crear transacción en el historial
        await tx.pointTransaction.create({
          data: {
            pointsId: loyaltyRecord.id,
            points: -pointsUsed,
            type: 'redeemed',
            description: `Puntos canjeados en pedido ${orderNumber}`,
            orderId: newOrder.id
          }
        })
      }

      // Si se usaron bonos de metros, descontarlos usando FIFO
      if (useMeterVouchers && meterVouchersInfo && userId) {
        const { metersNeeded, voucherIds } = meterVouchersInfo

        // Obtener los bonos ordenados por antigüedad (FIFO)
        const vouchers = await tx.voucher.findMany({
          where: {
            id: { in: voucherIds },
            userId: userId,
            isActive: true,
            type: 'METERS',
            remainingMeters: { gt: 0 }
          },
          orderBy: {
            createdAt: 'asc' // Los más antiguos primero (FIFO)
          }
        })

        let metersRemaining = metersNeeded

        for (const voucher of vouchers) {
          if (metersRemaining <= 0) break

          const currentRemaining = parseFloat(voucher.remainingMeters.toString())
          const metersToDeduct = Math.min(metersRemaining, currentRemaining)
          const newRemaining = currentRemaining - metersToDeduct

          // Actualizar el bono
          await tx.voucher.update({
            where: { id: voucher.id },
            data: {
              remainingMeters: newRemaining,
              usageCount: { increment: 1 },
              // Si se queda sin metros, desactivar
              isActive: newRemaining > 0
            }
          })

          metersRemaining -= metersToDeduct

          console.log(`Descontados ${metersToDeduct} metros del bono ${voucher.code}. Restantes: ${newRemaining}`)
        }

        if (metersRemaining > 0) {
          throw new Error(`No hay suficientes metros en los bonos. Faltan ${metersRemaining} metros`)
        }

        console.log(`✓ Pedido ${orderNumber} pagado completamente con bonos de metros`)
      }

      return newOrder
    })

    // Crear historial de estado
    const historyNotes = useMeterVouchers
      ? `Pedido creado y pagado con bonos de metros (${meterVouchersInfo?.metersNeeded} metros)`
      : 'Pedido creado'

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: useMeterVouchers ? 'CONFIRMED' : 'PENDING',
        notes: historyNotes,
      },
    })

    // Enviar emails (no esperar, hacer en background)
    sendOrderConfirmationEmail(order).catch(err =>
      console.error('Error sending confirmation email:', err)
    )
    sendAdminOrderNotification(order).catch(err =>
      console.error('Error sending admin notification:', err)
    )

    return NextResponse.json(order, { status: 201 })

  } catch (error) {
    console.error('Error al crear pedido:', error)
    return NextResponse.json(
      { error: 'Error al crear el pedido' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const all = searchParams.get('all')
    const orderNumber = searchParams.get('orderNumber')

    // Si buscan por orderNumber, devolver un pedido específico
    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json(order)
    }

    let orders

    // Admin puede ver todos los pedidos
    if (all === 'true' && session?.user?.role === 'ADMIN') {
      orders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        },
      })
    } else if (email) {
      // Obtener pedidos de un cliente específico
      orders = await prisma.order.findMany({
        where: {
          customerEmail: email
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (session?.user?.email) {
      // Usuario autenticado ve sus propios pedidos
      orders = await prisma.order.findMany({
        where: {
          customerEmail: session.user.email
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(orders)

  } catch (error) {
    console.error('Error al obtener pedidos:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}
