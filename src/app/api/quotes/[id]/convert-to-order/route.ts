import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * POST /api/quotes/[id]/convert-to-order
 * Convierte un presupuesto pagado en un pedido oficial
 * Solo admin puede realizar esta acción
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const quoteId = id

    // 1. Verificar que el presupuesto existe y está pagado
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        user: true,
        shippingMethod: true,
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    if (quote.status !== 'PAID') {
      return NextResponse.json(
        { error: 'El presupuesto debe estar pagado para convertirlo a pedido' },
        { status: 400 }
      )
    }

    if (quote.orderId) {
      return NextResponse.json(
        { error: 'Este presupuesto ya fue convertido a pedido' },
        { status: 400 }
      )
    }

    if (!quote.estimatedMeters || !quote.estimatedTotal) {
      return NextResponse.json(
        { error: 'El presupuesto no tiene valores calculados' },
        { status: 400 }
      )
    }

    // 2. Buscar el producto DTF
    const dtfProduct = await prisma.product.findFirst({
      where: { productType: 'DTF_TEXTILE', isActive: true },
    })

    if (!dtfProduct) {
      return NextResponse.json(
        { error: 'Producto DTF no encontrado' },
        { status: 500 }
      )
    }

    // 3. Generar número de pedido
    const orderNumber = generateOrderNumber(false)

    // 4. Calcular puntos de fidelización si el usuario está registrado
    let pointsEarned = 0
    let loyaltyTier = 'BRONZE'

    if (quote.userId) {
      const user = await prisma.user.findUnique({
        where: { id: quote.userId },
        select: {
          loyaltyTier: true,
          totalSpent: true,
        },
      })

      if (user) {
        loyaltyTier = user.loyaltyTier

        // Calcular puntos según tier
        const pointMultipliers: Record<string, number> = {
          BRONZE: 1.0,
          SILVER: 1.25,
          GOLD: 1.5,
          PLATINUM: 2.0,
        }

        const multiplier = pointMultipliers[loyaltyTier] || 1.0
        const pointsPerEuro = 1 // 1 punto por euro gastado (configurable)

        pointsEarned = Math.floor(Number(quote.estimatedTotal) * pointsPerEuro * multiplier)
      }
    }

    // 5. Crear el pedido en una transacción
    const order = await prisma.$transaction(async (tx) => {
      // Crear Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: quote.userId,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          shippingMethodId: quote.shippingMethodId,
          subtotal: Number(quote.subtotal),
          discountAmount: 0,
          taxAmount: Number(quote.taxAmount),
          shippingCost: Number(quote.shippingCost || 0),
          totalPrice: Number(quote.estimatedTotal),
          metersOrdered: Number(quote.estimatedMeters),
          pricePerMeter: Number(quote.pricePerMeter),
          designFileUrl: quote.designFileUrl,
          designFileName: quote.designFileName,
          pointsEarned,
          pointsUsed: 0,
          pointsDiscount: 0,
          status: 'CONFIRMED', // Pedido confirmado porque ya está pagado
          paymentStatus: 'PAID',
          paymentMethod: quote.paymentMethod || 'MANUAL',
          stripePaymentId: quote.stripePaymentId,
          notes: quote.customerNotes,
          adminNotes: quote.adminNotes,
          shippingAddress: quote.shippingAddress as any,
        },
      })

      // Crear OrderItem para los metros de DTF
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: dtfProduct.id,
          productName: `Impresión DTF - ${quote.estimatedMeters}m`,
          quantity: Number(quote.estimatedMeters),
          unitPrice: Number(quote.pricePerMeter),
          subtotal: Number(quote.subtotal),
          fileUrl: quote.designFileUrl,
          fileName: quote.designFileName,
          fileMetadata: (quote.fileMetadata || null) as any,
          customizations: {
            cutting: quote.needsCutting,
            cuttingPrice: quote.cuttingPrice ? Number(quote.cuttingPrice) : null,
            layout: quote.needsLayout,
            layoutPrice: quote.layoutPrice ? Number(quote.layoutPrice) : null,
            priority: quote.isPriority,
            priorityPrice: quote.priorityPrice ? Number(quote.priorityPrice) : null,
          },
        },
      })

      // Crear historial de estado inicial
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'CONFIRMED',
          notes: `Pedido creado desde presupuesto ${quote.quoteNumber}`,
          createdBy: session.user.id,
        },
      })

      // Actualizar Quote con el orderId
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          orderId: newOrder.id,
          convertedAt: new Date(),
        },
      })

      // Si hay usuario, actualizar sus puntos y total gastado
      if (quote.userId && pointsEarned > 0) {
        const currentUser = await tx.user.findUnique({
          where: { id: quote.userId },
          select: {
            loyaltyPoints: true,
            totalSpent: true,
          },
        })

        if (currentUser) {
          const newTotalSpent = Number(currentUser.totalSpent) + Number(quote.estimatedTotal)
          const newLoyaltyPoints = currentUser.loyaltyPoints + pointsEarned

          // Determinar nuevo tier según gasto total
          let newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE'
          if (newTotalSpent >= 1000) newTier = 'PLATINUM'
          else if (newTotalSpent >= 500) newTier = 'GOLD'
          else if (newTotalSpent >= 200) newTier = 'SILVER'

          await tx.user.update({
            where: { id: quote.userId },
            data: {
              loyaltyPoints: newLoyaltyPoints,
              totalSpent: newTotalSpent,
              loyaltyTier: newTier,
            },
          })

          // Registrar transacción de puntos si existe LoyaltyPoints
          const loyaltyRecord = await tx.loyaltyPoints.findUnique({
            where: { userId: quote.userId },
          })

          if (loyaltyRecord) {
            await tx.loyaltyPoints.update({
              where: { userId: quote.userId },
              data: {
                totalPoints: { increment: pointsEarned },
                availablePoints: { increment: pointsEarned },
                lifetimePoints: { increment: pointsEarned },
                tier: newTier,
              },
            })

            await tx.pointTransaction.create({
              data: {
                pointsId: loyaltyRecord.id,
                points: pointsEarned,
                type: 'earned',
                description: `Puntos ganados por pedido ${orderNumber} (desde presupuesto ${quote.quoteNumber})`,
                orderId: newOrder.id,
              },
            })
          }
        }
      }

      return newOrder
    })

    // 6. TODO: Generar factura automáticamente
    // TODO: Enviar emails (confirmación al cliente, notificación a admin)

    return NextResponse.json({
      success: true,
      message: 'Presupuesto convertido a pedido exitosamente',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPrice: order.totalPrice,
      },
      pointsEarned,
    })
  } catch (error) {
    console.error('Error converting quote to order:', error)
    return NextResponse.json(
      {
        error: 'Error al convertir presupuesto a pedido',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
