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
      apiVersion: '2025-09-30.clover',
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
          const { awardLoyaltyPointsForOrder } = await import('@/lib/loyalty')

          // Detectar si es compra de bono para aplicar bonus del 25%
          const isVoucherPurchase = order.items.some(
            item => item.product.productType === 'VOUCHER'
          )

          // Otorgar puntos usando la función compartida
          const { pointsEarned } = await awardLoyaltyPointsForOrder(
            prisma,
            order.userId,
            order.id,
            orderNumber || order.id,
            parseFloat(order.totalPrice.toString()),
            isVoucherPurchase
          )

          // Actualizar el pedido con los puntos ganados y flag de voucher
          await prisma.order.update({
            where: { id: order.id },
            data: {
              pointsEarned: pointsEarned,
              isVoucherPurchase: isVoucherPurchase,
            },
          })

          console.log(`Awarded ${pointsEarned} points to user for order ${orderNumber}${isVoucherPurchase ? ' (Voucher bonus +25% applied)' : ''}`)
        }

        // Enviar email de notificación al admin ahora que el pago está confirmado
        const { sendAdminOrderNotification } = await import('@/lib/email')
        sendAdminOrderNotification(updatedOrder).catch(err =>
          console.error('Error sending admin notification:', err)
        )

        // Generar factura automáticamente
        const { createInvoiceForOrder } = await import('@/lib/invoice')
        createInvoiceForOrder(updatedOrder.id).catch(err =>
          console.error('Error generating invoice:', err)
        )

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
