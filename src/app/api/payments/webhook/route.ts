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

        // Obtener metadata del pedido o presupuesto
        const orderId = session.metadata?.orderId
        const orderNumber = session.metadata?.orderNumber
        const quoteId = session.metadata?.quoteId

        // ===== MANEJO DE PAGOS DE PRESUPUESTOS =====
        if (quoteId) {
          console.log(`Processing quote payment: ${quoteId}`)

          try {
            // 1. Actualizar presupuesto a PAID
            const quote = await prisma.quote.update({
              where: { id: quoteId },
              data: {
                status: 'PAID',
                stripePaymentId: session.payment_intent as string,
              },
              include: {
                user: true,
              },
            })

            console.log(`Quote ${quote.quoteNumber} marked as PAID`)

            // 2. Convertir automáticamente a Order
            const { generateOrderNumber } = await import('@/lib/utils')

            const dtfProduct = await prisma.product.findFirst({
              where: { productType: 'DTF_TEXTILE', isActive: true },
            })

            if (!dtfProduct) {
              throw new Error('DTF product not found')
            }

            const newOrderNumber = generateOrderNumber(false)

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

            // Crear Order en transacción
            const newOrder = await prisma.$transaction(async (tx) => {
              const createdOrder = await tx.order.create({
                data: {
                  orderNumber: newOrderNumber,
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
                  taxExempt: quote.taxExempt || false,
                  status: 'CONFIRMED',
                  paymentStatus: 'PAID',
                  paymentMethod: 'STRIPE',
                  stripePaymentId: session.payment_intent as string,
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
                  orderId: createdOrder.id,
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
                  orderId: createdOrder.id,
                  status: 'CONFIRMED',
                  notes: `Pedido creado desde presupuesto ${quote.quoteNumber} - Pago confirmado via Stripe`,
                },
              })

              // Actualizar Quote con orderId
              await tx.quote.update({
                where: { id: quoteId },
                data: {
                  orderId: createdOrder.id,
                  convertedAt: new Date(),
                },
              })

              // Actualizar usuario si existe (puntos y tier)
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
                        description: `Puntos ganados por pedido ${newOrderNumber} (desde presupuesto ${quote.quoteNumber})`,
                        orderId: createdOrder.id,
                      },
                    })
                  }
                }
              }

              return createdOrder
            })

            console.log(`Quote ${quote.quoteNumber} converted to order ${newOrder.orderNumber}`)

            // Obtener el pedido completo con items para emails
            const orderWithItems = await prisma.order.findUnique({
              where: { id: newOrder.id },
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
                shippingMethod: true,
              },
            })

            // Enviar emails
            if (orderWithItems) {
              const { sendOrderConfirmationEmail, sendAdminOrderNotification } = await import('@/lib/email')

              sendOrderConfirmationEmail(orderWithItems).catch(err =>
                console.error('Error sending order confirmation email from quote:', err)
              )
              sendAdminOrderNotification(orderWithItems).catch(err =>
                console.error('Error sending admin notification email from quote:', err)
              )

              // Generar factura
              const orderTotal = parseFloat(orderWithItems.totalPrice.toString())
              if (orderTotal > 0) {
                const { createInvoiceForOrder } = await import('@/lib/invoice')
                createInvoiceForOrder(orderWithItems.id).catch(err =>
                  console.error('Error generating invoice for quote order:', err)
                )
              }
            }

            console.log(`Payment confirmed for quote ${quote.quoteNumber} -> order ${newOrder.orderNumber}`)

          } catch (error) {
            console.error('Error processing quote payment:', error)
          }

          // Salir del case, no procesar como order normal
          break
        }

        // ===== MANEJO DE PAGOS DE PEDIDOS NORMALES =====
        if (!orderId) {
          console.error('No orderId or quoteId in session metadata')
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

        // Si el pedido no tiene userId, buscar usuario por email y asociarlo
        let userIdToUse = order.userId
        if (!userIdToUse && order.customerEmail) {
          const user = await prisma.user.findUnique({
            where: { email: order.customerEmail }
          })

          if (user) {
            userIdToUse = user.id
            console.log(`Associating order ${order.orderNumber} to user ${user.id} (${user.email})`)
          }
        }

        // Actualizar el estado del pedido (y asociar usuario si se encontró)
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            stripePaymentId: session.id,
            ...(userIdToUse && !order.userId ? { userId: userIdToUse } : {}),
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

        // Crear bonos si el pedido contiene items con voucherTemplateId en customizations
        let createdVouchers: any[] = []
        if (userIdToUse) {
          for (const item of updatedOrder.items) {
            const customizations = item.customizations as any
            const voucherTemplateId = customizations?.voucherTemplateId

            if (voucherTemplateId) {
              // Obtener la plantilla del voucher
              const voucherTemplate = await prisma.voucher.findUnique({
                where: {
                  id: voucherTemplateId,
                },
              })

              if (voucherTemplate && voucherTemplate.isTemplate) {
                // Generar código único para el bono
                const voucherCode = `BONO-${updatedOrder.orderNumber}-${Date.now().toString(36).toUpperCase()}`

                // Crear el bono asignado al usuario
                const newVoucher = await prisma.voucher.create({
                  data: {
                    code: voucherCode,
                    name: voucherTemplate.name,
                    slug: `${voucherTemplate.slug}-${Date.now()}`,
                    description: voucherTemplate.description,
                    imageUrl: voucherTemplate.imageUrl,
                    price: item.unitPrice,
                    productId: voucherTemplate.productId, // El producto vinculado (Transfer DTF)
                    userId: userIdToUse,
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
                console.log(`Created voucher ${voucherCode} for user ${userIdToUse} from order ${updatedOrder.orderNumber}`)
              } else {
                console.error(`No voucher template found with id ${voucherTemplateId}`)
              }
            }
          }
        }

        // Descontar bonos de metros si el pedido los usa (parcial o totalmente)
        let voucherIdToAssociate: string | null = null
        const isUsingMeterVouchers = updatedOrder.notes?.includes('bonos de metros')

        if (isUsingMeterVouchers && userIdToUse) {
          // Calcular metros necesarios desde los items
          let metersNeeded = 0
          for (const item of updatedOrder.items) {
            if (item.product.productType === 'DTF_TEXTILE') {
              metersNeeded += parseFloat(item.quantity.toString())
            }
          }

          if (metersNeeded > 0) {
            console.log(`Deducting ${metersNeeded} meters from user ${userIdToUse} vouchers for paid order`)

            // Buscar bonos del usuario usando FIFO
            const vouchers = await prisma.voucher.findMany({
              where: {
                userId: userIdToUse,
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

                  console.log(`Deducted ${metersToDeduct}m and ${shipmentsToDeduct} shipment(s) from voucher ${voucher.code}`)
                }
              }

              // Asociar el primer bono usado al pedido
              if (voucherIdToAssociate && !updatedOrder.voucherId) {
                await prisma.order.update({
                  where: { id: updatedOrder.id },
                  data: { voucherId: voucherIdToAssociate }
                })
              }
            }
          }
        }

        // Si el pedido tiene un userId, otorgar puntos de fidelidad
        if (userIdToUse) {
          const { awardLoyaltyPointsForOrder } = await import('@/lib/loyalty')

          // Detectar si es compra de bono para aplicar bonus del 25%
          const isVoucherPurchase = order.items.some(item => {
            const customizations = item.customizations as any
            return !!customizations?.voucherTemplateId
          })

          // Otorgar puntos usando la función compartida
          const { pointsEarned } = await awardLoyaltyPointsForOrder(
            prisma,
            userIdToUse,
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

        // Enviar email específico según el tipo de pedido
        const { sendVoucherPurchaseEmail, sendAdminOrderNotification } = await import('@/lib/email')

        if (createdVouchers.length > 0) {
          // Es una compra de bono - enviar email especial de activación
          for (const voucher of createdVouchers) {
            sendVoucherPurchaseEmail(updatedOrder, voucher).catch(err =>
              console.error('Error sending voucher purchase email:', err)
            )
          }
        }

        // Enviar email de notificación al admin ahora que el pago está confirmado
        sendAdminOrderNotification(updatedOrder).catch(err =>
          console.error('Error sending admin notification:', err)
        )

        // Generar factura automáticamente (solo si el total > 0€)
        const orderTotal = parseFloat(updatedOrder.totalPrice.toString())
        if (orderTotal > 0) {
          const { createInvoiceForOrder } = await import('@/lib/invoice')
          createInvoiceForOrder(updatedOrder.id).catch(err =>
            console.error('Error generating invoice:', err)
          )
        } else {
          console.log(`Skipping invoice generation for free order ${updatedOrder.orderNumber} (total: ${orderTotal}€)`)
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
