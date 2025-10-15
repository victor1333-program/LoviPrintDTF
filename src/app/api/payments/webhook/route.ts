import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Leer configuración de Stripe desde la base de datos
    const [testModeSettings, secretKeyTest, secretKeyLive, webhookSecretSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'stripe_test_mode' } }),
      prisma.setting.findUnique({ where: { key: 'stripe_secret_key_test' } }),
      prisma.setting.findUnique({ where: { key: 'stripe_secret_key_live' } }),
      prisma.setting.findUnique({ where: { key: 'stripe_webhook_secret' } }),
    ])

    const isTestMode = testModeSettings?.value === 'true'
    const stripeSecretKey = isTestMode ? secretKeyTest?.value : secretKeyLive?.value
    const webhookSecret = webhookSecretSetting?.value

    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe no está configurado correctamente' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Manejar el evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Obtener metadata del pedido
        const orderId = session.metadata?.orderId
        const orderNumber = session.metadata?.orderNumber

        if (!orderId) {
          console.error('No orderId in session metadata')
          break
        }

        // Obtener el pedido con información del usuario y productos
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        })

        if (!order) {
          console.error(`Order ${orderId} not found`)
          break
        }

        // Actualizar el estado del pedido
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            stripePaymentId: session.id,
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        })

        // Crear historial
        await prisma.orderStatusHistory.create({
          data: {
            orderId: orderId,
            status: 'CONFIRMED',
            notes: 'Pago confirmado vía Stripe',
          },
        })

        // Crear bonos si el pedido contiene productos de tipo VOUCHER
        if (updatedOrder.userId) {
          for (const item of updatedOrder.items) {
            if (item.product.productType === 'VOUCHER') {
              // Obtener la plantilla del voucher para conocer los metros
              const voucherTemplate = await prisma.voucher.findFirst({
                where: {
                  productId: item.product.id,
                  isTemplate: true,
                },
              })

              if (voucherTemplate) {
                // Generar código único para el bono
                const voucherCode = `BONO-${updatedOrder.orderNumber}-${Date.now().toString(36).toUpperCase()}`

                // Crear el bono asignado al usuario
                await prisma.voucher.create({
                  data: {
                    code: voucherCode,
                    name: item.product.name,
                    slug: `${item.product.slug}-${Date.now()}`,
                    description: item.product.description,
                    imageUrl: item.product.imageUrl,
                    price: item.unitPrice,
                    productId: item.product.id,
                    userId: updatedOrder.userId,
                    type: 'METERS',
                    initialMeters: voucherTemplate.initialMeters,
                    remainingMeters: voucherTemplate.initialMeters,
                    initialShipments: voucherTemplate.initialShipments || 2,
                    remainingShipments: voucherTemplate.remainingShipments || 2,
                    expiresAt: voucherTemplate.expiresAt,
                    isActive: true,
                    isTemplate: false, // Es un bono asignado, no una plantilla
                  },
                })

                console.log(`Created voucher ${voucherCode} for user ${updatedOrder.userId} from order ${updatedOrder.orderNumber}`)
              } else {
                console.error(`No voucher template found for product ${item.product.id}`)
              }
            }
          }
        }

        // Si el pedido tiene un userId, otorgar puntos de fidelidad
        if (order.userId) {
          const { calculatePointsEarned, calculateTier } = await import('@/lib/loyalty')

          // Obtener el usuario para calcular el nuevo totalSpent
          const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: { totalSpent: true },
          })

          // Obtener o crear registro de loyalty points
          let loyaltyRecord = await prisma.loyaltyPoints.findUnique({
            where: { userId: order.userId },
          })

          if (!loyaltyRecord) {
            loyaltyRecord = await prisma.loyaltyPoints.create({
              data: {
                userId: order.userId,
                totalPoints: 0,
                availablePoints: 0,
                lifetimePoints: 0,
                tier: 'BRONZE',
              },
            })
          }

          // Detectar si es compra de bono para aplicar bonus del 25%
          const isVoucherPurchase = order.items.some(
            item => item.product.productType === 'VOUCHER'
          )

          // Calcular puntos ganados basado en el tier actual
          const amountSpent = parseFloat(order.totalPrice.toString())
          const pointsEarned = calculatePointsEarned(amountSpent, loyaltyRecord.tier, isVoucherPurchase)

          // Calcular nuevo total gastado y tier basado en EUROS, no puntos
          const currentTotalSpent = user ? parseFloat(user.totalSpent.toString()) : 0
          const newTotalSpent = currentTotalSpent + amountSpent
          const newTier = calculateTier(newTotalSpent)

          // Actualizar loyalty points
          await prisma.loyaltyPoints.update({
            where: { id: loyaltyRecord.id },
            data: {
              availablePoints: { increment: pointsEarned },
              totalPoints: { increment: pointsEarned },
              lifetimePoints: { increment: pointsEarned }, // lifetimePoints debe ser puntos, no euros
              tier: newTier,
            },
          })

          // Actualizar users table también
          await prisma.user.update({
            where: { id: order.userId },
            data: {
              loyaltyPoints: { increment: pointsEarned },
              totalSpent: { increment: amountSpent },
              loyaltyTier: newTier,
            },
          })

          // Actualizar el pedido con los puntos ganados y flag de voucher
          await prisma.order.update({
            where: { id: order.id },
            data: {
              pointsEarned: pointsEarned,
              isVoucherPurchase: isVoucherPurchase,
            },
          })

          // Crear transacción de puntos
          await prisma.pointTransaction.create({
            data: {
              pointsId: loyaltyRecord.id,
              points: pointsEarned,
              type: 'earned',
              description: `Puntos ganados por pedido ${orderNumber} (${amountSpent.toFixed(2)}€)${isVoucherPurchase ? ' - Bono +25%' : ''}`,
              orderId: order.id,
            },
          })

          console.log(`Awarded ${pointsEarned} points to user for order ${orderNumber}${isVoucherPurchase ? ' (Voucher bonus +25% applied)' : ''}`)
        }

        console.log(`Payment confirmed for order ${orderNumber}`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'FAILED',
            },
          })

          await prisma.orderStatusHistory.create({
            data: {
              orderId: orderId,
              status: 'PENDING',
              notes: 'Sesión de pago expirada',
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
