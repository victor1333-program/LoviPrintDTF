import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    const event = await constructWebhookEvent(body, signature)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Manejar diferentes eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const orderId = session.metadata?.orderId

        if (orderId) {
          // Actualizar estado del pedido
          const order = await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              stripePaymentId: session.payment_intent,
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          })

          // Crear historial de estado
          await prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: 'CONFIRMED',
              notes: 'Pago confirmado por Stripe',
            },
          })

          // Crear bonos si el pedido contiene productos de tipo VOUCHER
          for (const item of order.items) {
            if (item.product.productType === 'VOUCHER' && order.userId) {
              // Obtener la plantilla del voucher para conocer los metros
              const voucherTemplate = await prisma.voucher.findFirst({
                where: {
                  productId: item.product.id,
                  isTemplate: true,
                },
              })

              if (voucherTemplate) {
                // Generar código único para el bono
                const voucherCode = `BONO-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`

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
                    userId: order.userId,
                    type: 'METERS',
                    initialMeters: voucherTemplate.initialMeters,
                    remainingMeters: voucherTemplate.initialMeters,
                    initialShipments: 2, // Incluye 2 envíos gratis por defecto
                    remainingShipments: 2,
                    expiresAt: null, // Sin fecha de caducidad
                    isActive: true,
                    isTemplate: false, // Es un bono asignado, no una plantilla
                  },
                })
              }
            }
          }

          // Enviar emails
          await sendOrderConfirmationEmail(order)
          await sendAdminOrderNotification(order)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        const orderId = paymentIntent.metadata?.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              stripePaymentId: paymentIntent.id,
            },
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any
        const orderId = paymentIntent.metadata?.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'FAILED',
              stripePaymentId: paymentIntent.id,
            },
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as any
        const paymentIntentId = charge.payment_intent

        if (paymentIntentId) {
          const order = await prisma.order.findFirst({
            where: { stripePaymentId: paymentIntentId },
          })

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'REFUNDED',
                status: 'CANCELLED',
              },
            })

            await prisma.orderStatusHistory.create({
              data: {
                orderId: order.id,
                status: 'CANCELLED',
                notes: 'Reembolso procesado',
              },
            })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error in webhook route:', error)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    )
  }
}
