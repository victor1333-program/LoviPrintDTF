import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateOrderNumber } from '@/lib/utils'
import { validatePointsUsage } from '@/lib/loyalty'
import { logger } from '@/lib/logger'
import { createCheckoutOrderSchema, createRegularOrderSchema } from '@/lib/validations/schemas'
import { z } from 'zod'
import { sanitizeFileName } from '@/lib/file-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Parsear body para detectar formato
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      )
    }

    // Detectar formato del pedido (nuevo formato desde checkout o antiguo formato)
    const isCheckoutFormat = body.metersOrdered !== undefined

    // Validar según formato
    if (isCheckoutFormat) {
      const validation = createCheckoutOrderSchema.safeParse(body)
      if (!validation.success) {
        const errors = validation.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }))
        logger.warn('Checkout order validation error', { context: { errors } })
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        )
      }
    } else {
      const validation = createRegularOrderSchema.safeParse(body)
      if (!validation.success) {
        const errors = validation.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }))
        logger.warn('Regular order validation error', { context: { errors } })
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        )
      }
    }

    let orderData

    if (isCheckoutFormat) {
      // Nuevo formato desde checkout (DTF)
      let {
        name,
        email,
        phone,
        company,
        taxId,
        isProfessional,
        metersOrdered,
        pricePerMeter,
        subtotal,
        discountAmount,
        taxAmount,
        shippingCost,
        totalPrice,
        designFileUrl,
        designFileName,
        voucherCode,
        discountCodeId,
        shippingMethodId,
        notes,
        shippingAddress,
        saveProfile,
        saveAddress,
      } = body

      // Sanitizar nombre de archivo si existe
      if (designFileName) {
        try {
          designFileName = sanitizeFileName(designFileName)
        } catch (error) {
          logger.error('File name sanitization failed in order (checkout format)', error)
          return NextResponse.json(
            { error: 'Nombre de archivo inválido' },
            { status: 400 }
          )
        }
      }

      // Validaciones básicas
      if (!name || !email || !phone || !metersOrdered || !designFileUrl) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        )
      }

      // Si el usuario está autenticado y saveProfile es true, actualizar su perfil
      if (session?.user && saveProfile) {
        await prisma.user.update({
          where: { email: session.user.email! },
          data: {
            name,
            phone,
            company: company || null,
            taxId: taxId || null,
            isProfessional: isProfessional || false,
          },
        })
      }

      // Si el usuario está autenticado y saveAddress es true, guardar la dirección
      if (session?.user && saveAddress) {
        const userEmail = session.user.email!
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true }
        })

        if (user) {
          // Verificar si es la primera dirección del usuario
          const addressCount = await prisma.address.count({
            where: { userId: user.id }
          })

          const isFirstAddress = addressCount === 0

          await prisma.address.create({
            data: {
              userId: user.id,
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state || '',
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country || 'España',
              isDefault: isFirstAddress, // Primera dirección se marca como predeterminada
            },
          })
        }
      }

      // Generar número de orden
      const orderNumber = generateOrderNumber(false)

      // Buscar el producto DTF Textil por tipo
      const dtfProduct = await prisma.product.findFirst({
        where: { productType: 'DTF_TEXTILE' }
      })

      if (!dtfProduct) {
        return NextResponse.json(
          { error: 'Producto DTF no encontrado. Contacta al administrador.' },
          { status: 500 }
        )
      }

      // Si usó un bono de metros, el pedido se marca como pagado
      const isPaidWithVoucher = !!voucherCode
      const orderStatus = isPaidWithVoucher ? 'CONFIRMED' : 'PENDING'
      const paymentStatus = isPaidWithVoucher ? 'PAID' : 'PENDING'

      // Crear el pedido
      orderData = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            userId: session?.user?.id || null,
            voucherId: discountCodeId || null,
            shippingMethodId: shippingMethodId || null,
            subtotal: parseFloat(subtotal.toString()),
            discountAmount: parseFloat((discountAmount || 0).toString()),
            taxAmount: parseFloat(taxAmount.toString()),
            shippingCost: parseFloat(shippingCost.toString()),
            totalPrice: parseFloat(totalPrice.toString()),
            shippingAddress: {
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state || '',
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country || 'España',
            },
            notes: voucherCode ? `Pagado con bono: ${voucherCode}` : (notes || null),
            status: orderStatus,
            paymentStatus: paymentStatus,
            items: {
              create: [{
                productId: dtfProduct.id,
                productName: `Impresión DTF - ${metersOrdered}m`,
                quantity: parseFloat(metersOrdered.toString()),
                unitPrice: parseFloat(pricePerMeter.toString()),
                subtotal: parseFloat(subtotal.toString()),
                fileUrl: designFileUrl,
                fileName: designFileName,
                fileMetadata: Prisma.JsonNull,
                customizations: Prisma.JsonNull,
              }]
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

        // Si usó bono de metros, descontarlos
        if (voucherCode && session?.user) {
          const voucher = await tx.voucher.findFirst({
            where: {
              code: voucherCode,
              userId: session.user.id,
              isActive: true,
              type: 'METERS',
            }
          })

          if (voucher) {
            const currentRemaining = parseFloat(voucher.remainingMeters.toString())
            const newRemaining = currentRemaining - parseFloat(metersOrdered.toString())

            await tx.voucher.update({
              where: { id: voucher.id },
              data: {
                remainingMeters: newRemaining,
                usageCount: { increment: 1 },
                isActive: newRemaining > 0
              }
            })
          }
        }

        return order
      })

      // Crear historial de estado
      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderData.id,
          status: orderStatus,
          notes: isPaidWithVoucher ? `Pedido pagado con bono: ${voucherCode}` : 'Pedido creado',
        },
      })

    } else {
      // Formato antiguo (productos regulares)
      let {
        customerName,
        customerEmail,
        customerPhone,
        items,
        subtotal,
        discountAmount,
        taxAmount,
        shippingCost,
        totalPrice,
        shippingAddress,
        notes,
        voucherId,
        shippingMethodId,
        pointsUsed = 0,
        pointsDiscount = 0,
        useMeterVouchers = false,
        meterVouchersInfo = null
      } = body

      // Sanitizar nombres de archivo en los items
      if (items && Array.isArray(items)) {
        items = items.map((item: any) => {
          if (item.fileName) {
            try {
              item.fileName = sanitizeFileName(item.fileName)
            } catch (error) {
              logger.error('File name sanitization failed in order item (regular format)', {
                context: { originalFileName: item.fileName, error }
              })
              // Usar nombre genérico si falla la sanitización
              item.fileName = 'file'
            }
          }
          return item
        })
      }

      // Validaciones básicas
      if (!customerName || !customerEmail || !items || items.length === 0) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        )
      }

      // Detectar si algún item es un bono (por customizations.voucherTemplateId)
      const isVoucherOrder = items.some((item: any) => {
        const customizations = item.customizations
        return !!customizations?.voucherTemplateId
      })

      let userId: string | undefined

      // Si se están usando puntos, validar
      if (pointsUsed > 0) {
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Debes estar autenticado para usar puntos' },
            { status: 401 }
          )
        }

        userId = session.user.id

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

      const orderNumber = generateOrderNumber(isVoucherOrder)

      // Usar una transacción para crear el pedido
      orderData = await prisma.$transaction(async (tx) => {
        const isPaidWithVouchers = useMeterVouchers && meterVouchersInfo
        // IMPORTANTE: Los pedidos con bonos se crean como PENDING para que el usuario pueda revisar
        // Se confirmarán cuando el usuario haga clic en "Confirmar Pedido"
        const orderStatus = 'PENDING'
        const paymentStatus = 'PENDING'

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerName,
            customerEmail,
            customerPhone: customerPhone || null,
            userId: userId || null,
            voucherId: voucherId || null,
            shippingMethodId: shippingMethodId || null,
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
              create: items.map((item: any) => {
                // Si el item es un bono, usar el nombre del bono en lugar del producto
                const isVoucher = item.customizations?.voucherTemplateId
                const displayName = isVoucher
                  ? (item.customizations?.voucherName || item.productName)
                  : item.productName

                return {
                  productId: item.productId,
                  productName: displayName,
                  quantity: parseFloat(item.quantity),
                  unitPrice: parseFloat(item.unitPrice),
                  subtotal: parseFloat(item.subtotal),
                  fileUrl: item.fileUrl || null,
                  fileName: item.fileName || null,
                  fileMetadata: item.fileMetadata || null,
                  customizations: item.customizations || null,
                }
              })
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

          let loyaltyRecord = await tx.loyaltyPoints.findUnique({
            where: { userId: userId }
          })

          if (!loyaltyRecord) {
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

          await tx.loyaltyPoints.update({
            where: { id: loyaltyRecord.id },
            data: {
              availablePoints: {
                decrement: pointsUsed
              }
            }
          })

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

        // NOTA: Los bonos de metros NO se descuentan aquí
        // Se descuentan cuando el usuario confirma el pedido en /api/orders/confirm-free
        // Esto permite al usuario revisar el pedido antes de confirmar

        // Guardar información del bono en el pedido para uso posterior
        if (useMeterVouchers && meterVouchersInfo) {
          // Asociar el primer bono al pedido para referencia
          const firstVoucherId = meterVouchersInfo.voucherIds?.[0]
          if (firstVoucherId) {
            await tx.order.update({
              where: { id: newOrder.id },
              data: {
                voucherId: firstVoucherId
              }
            })
          }
        }

        return newOrder
      })

      // Crear historial de estado
      const historyNotes = useMeterVouchers
        ? `Pedido creado. Pendiente de confirmación para usar bonos de metros (${meterVouchersInfo?.metersNeeded} metros)`
        : 'Pedido creado'

      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderData.id,
          status: 'PENDING',
          notes: historyNotes,
        },
      })
    }

    // IMPORTANTE: NO enviar emails aquí, se enviarán desde el webhook de Stripe
    // cuando se confirme el pago exitoso. Esto evita:
    // - Emails duplicados
    // - Confusión al usuario (recibir "Pedido Confirmado" antes de pagar)
    // - Emails a pedidos abandonados (si el usuario no completa el pago)
    //
    // Todos los emails (confirmación de pedido, activación de bonos, notificación admin)
    // se envían desde /api/stripe/webhook después de checkout.session.completed

    return NextResponse.json(orderData, { status: 201 })

  } catch (error) {
    logger.error('Error creating order', error)
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
          invoice: true,
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
          invoice: true,
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
          invoice: true,
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
          invoice: true,
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
    logger.error('Error fetching orders', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}
