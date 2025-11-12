import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'
import { paymentLogger } from '@/lib/logger'

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
        const quoteId = session.metadata?.quoteId

        // ===== MANEJO DE PAGOS DE PRESUPUESTOS =====
        if (quoteId) {
          paymentLogger.info(`Processing quote payment: ${quoteId}`)

          try {
            // 1. Actualizar presupuesto a PAID
            const quote = await prisma.quote.update({
              where: { id: quoteId },
              data: {
                status: 'PAID',
                stripePaymentId: session.payment_intent,
              },
              include: {
                user: true,
              },
            })

            paymentLogger.info(`Quote ${quote.quoteNumber} marked as PAID`)

            // 2. Convertir automáticamente a Order (importar la lógica de conversión)
            const { generateOrderNumber } = await import('@/lib/utils')

            const dtfProduct = await prisma.product.findFirst({
              where: { productType: 'DTF_TEXTILE', isActive: true },
            })

            if (!dtfProduct) {
              throw new Error('DTF product not found')
            }

            const orderNumber = generateOrderNumber(false)

            // Calcular puntos de fidelización
            let pointsEarned = 0
            if (quote.userId && quote.user) {
              const user = quote.user
              const pointMultipliers: Record<string, number> = {
                BRONZE: 1.0,
                SILVER: 1.25,
                GOLD: 1.5,
                PLATINUM: 2.0,
              }
              const multiplier = pointMultipliers[user.loyaltyTier] || 1.0
              pointsEarned = Math.floor(Number(quote.estimatedTotal) * multiplier)
            }

            // Crear Order
            const order = await prisma.$transaction(async (tx) => {
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
                  status: 'CONFIRMED',
                  paymentStatus: 'PAID',
                  paymentMethod: 'STRIPE',
                  stripePaymentId: session.payment_intent,
                  notes: quote.customerNotes,
                  adminNotes: quote.adminNotes,
                  shippingAddress: quote.shippingAddress as any,
                },
                include: {
                  items: {
                    include: {
                      product: true,
                    },
                  },
                },
              })

              // Crear OrderItem
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
                  fileMetadata: quote.fileMetadata as any,
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

              // Crear historial de estado
              await tx.orderStatusHistory.create({
                data: {
                  orderId: newOrder.id,
                  status: 'CONFIRMED',
                  notes: `Pedido creado desde presupuesto ${quote.quoteNumber} - Pago confirmado`,
                },
              })

              // Actualizar Quote con orderId
              await tx.quote.update({
                where: { id: quoteId },
                data: {
                  orderId: newOrder.id,
                  convertedAt: new Date(),
                },
              })

              // Actualizar usuario si existe
              if (quote.userId && pointsEarned > 0) {
                const currentUser = await tx.user.findUnique({
                  where: { id: quote.userId },
                  select: { loyaltyPoints: true, totalSpent: true },
                })

                if (currentUser) {
                  const newTotalSpent = Number(currentUser.totalSpent) + Number(quote.estimatedTotal)
                  const newLoyaltyPoints = currentUser.loyaltyPoints + pointsEarned

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

            paymentLogger.info(`Quote ${quote.quoteNumber} converted to order ${order.orderNumber}`)

            // Enviar emails
            await sendOrderConfirmationEmail(order).catch(err =>
              paymentLogger.error('Error sending order confirmation email from quote', err)
            )
            await sendAdminOrderNotification(order).catch(err =>
              paymentLogger.error('Error sending admin notification email from quote', err)
            )

          } catch (error) {
            paymentLogger.error('Error processing quote payment', error)
            // No fallar el webhook, solo registrar el error
          }

          // Salir del case, no procesar como order normal
          break
        }

        // ===== MANEJO DE PAGOS DE PEDIDOS NORMALES =====
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

          // Crear bonos si el pedido contiene productos VOUCHER
          const createdVouchers: any[] = []
          for (const item of order.items) {
            // Detectar bonos de dos formas:
            // 1. Por productType === 'VOUCHER' (método robusto)
            // 2. Por customizations.voucherTemplateId (compatibilidad hacia atrás)
            const isVoucherProduct = item.product.productType === 'VOUCHER'
            const customizations = item.customizations as any
            const voucherTemplateId = customizations?.voucherTemplateId

            if ((isVoucherProduct || voucherTemplateId) && order.userId) {
              let voucherTemplate = null

              // Buscar plantilla del voucher
              if (voucherTemplateId) {
                // Método 1: Por ID directo en customizations
                voucherTemplate = await prisma.voucher.findUnique({
                  where: { id: voucherTemplateId },
                })
              } else if (isVoucherProduct) {
                // Método 2: Por productId (productos de tipo VOUCHER)
                voucherTemplate = await prisma.voucher.findFirst({
                  where: {
                    productId: item.product.id,
                    isTemplate: true,
                  },
                })
              }

              if (voucherTemplate && voucherTemplate.isTemplate) {
                // Generar código único para el bono (el orderNumber ya tiene el prefijo BONO-)
                const voucherCode = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`

                // Crear el bono asignado al usuario
                const newVoucher = await prisma.voucher.create({
                  data: {
                    code: voucherCode,
                    name: voucherTemplate.name,
                    slug: `${voucherTemplate.slug}-${Date.now()}`,
                    description: voucherTemplate.description,
                    imageUrl: voucherTemplate.imageUrl,
                    price: item.unitPrice,
                    productId: voucherTemplate.productId,
                    userId: order.userId,
                    type: 'METERS',
                    initialMeters: voucherTemplate.initialMeters,
                    remainingMeters: voucherTemplate.initialMeters,
                    initialShipments: voucherTemplate.initialShipments,
                    remainingShipments: voucherTemplate.initialShipments,
                    expiresAt: null, // Sin fecha de caducidad
                    isActive: true,
                    isTemplate: false, // Es un bono asignado, no una plantilla
                  },
                })

                createdVouchers.push(newVoucher)
              }
            }
          }

        // Descontar bonos de metros si el pedido los usa (parcial o totalmente)
        let voucherIdToAssociate: string | null = null
        const isUsingMeterVouchers = order.notes?.includes('bonos de metros')

        if (isUsingMeterVouchers && order.userId) {
          // Calcular metros necesarios desde los items
          let metersNeeded = 0
          for (const item of order.items) {
            if (item.product.productType === 'DTF_TEXTILE') {
              metersNeeded += parseFloat(item.quantity.toString())
            }
          }

          if (metersNeeded > 0) {
            paymentLogger.info(`Deducting ${metersNeeded} meters from user ${order.userId} vouchers for Stripe paid order`)

            // Buscar bonos del usuario usando FIFO
            const vouchers = await prisma.voucher.findMany({
              where: {
                userId: order.userId,
                isActive: true,
                type: 'METERS',
                remainingMeters: { gt: 0 }
              },
              orderBy: {
                createdAt: 'asc'
              }
            })

            if (vouchers.length > 0) {
              let metersRemaining = metersNeeded
              let shipmentsNeeded = 1 // Cada pedido consume 1 envío

              for (const voucher of vouchers) {
                if (metersRemaining <= 0 && shipmentsNeeded <= 0) break

                // Guardar el primer bono usado para asociarlo al pedido
                if (!voucherIdToAssociate) {
                  voucherIdToAssociate = voucher.id
                }

                const currentRemainingMeters = parseFloat(voucher.remainingMeters.toString())
                const currentRemainingShipments = voucher.remainingShipments || 0

                let metersToDeduct = 0
                let shipmentsToDeduct = 0

                // Descontar metros si quedan
                if (metersRemaining > 0 && currentRemainingMeters > 0) {
                  metersToDeduct = Math.min(metersRemaining, currentRemainingMeters)
                  metersRemaining -= metersToDeduct
                }

                // Descontar envíos si quedan (IMPORTANTE: se descuenta incluso si se usa parcialmente)
                if (shipmentsNeeded > 0 && currentRemainingShipments > 0) {
                  shipmentsToDeduct = Math.min(shipmentsNeeded, currentRemainingShipments)
                  shipmentsNeeded -= shipmentsToDeduct
                }

                // Actualizar bono
                if (metersToDeduct > 0 || shipmentsToDeduct > 0) {
                  const newRemainingMeters = currentRemainingMeters - metersToDeduct
                  const newRemainingShipments = currentRemainingShipments - shipmentsToDeduct

                  await prisma.voucher.update({
                    where: { id: voucher.id },
                    data: {
                      remainingMeters: newRemainingMeters,
                      remainingShipments: newRemainingShipments,
                      usageCount: { increment: 1 },
                      isActive: newRemainingMeters > 0 || newRemainingShipments > 0
                    }
                  })

                  paymentLogger.info(`Deducted ${metersToDeduct}m and ${shipmentsToDeduct} shipment(s) from voucher ${voucher.code}`)
                }
              }

              // Asociar el primer bono usado al pedido
              if (voucherIdToAssociate && !order.voucherId) {
                await prisma.order.update({
                  where: { id: order.id },
                  data: { voucherId: voucherIdToAssociate }
                })
              }
            }
          }
        }

          // Enviar emails según el tipo de pedido
          if (createdVouchers.length > 0) {
            // Es una compra de bono - enviar email especial de activación
            const { sendVoucherPurchaseEmail } = await import('@/lib/email')
            for (const voucher of createdVouchers) {
              await sendVoucherPurchaseEmail(order, voucher).catch(err =>
                paymentLogger.error('Error sending voucher purchase email', err)
              )
            }
          } else {
            // Es un pedido normal - enviar email de confirmación estándar
            await sendOrderConfirmationEmail(order).catch(err =>
              paymentLogger.error('Error sending order confirmation email', err)
            )
          }

          // Notificar al admin de todos los pedidos pagados
          await sendAdminOrderNotification(order).catch(err =>
            paymentLogger.error('Error sending admin notification email', err)
          )
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
    paymentLogger.error('Error in webhook route', error)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    )
  }
}
