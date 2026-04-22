import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateOrderNumber } from '@/lib/utils'
import { validatePointsUsage } from '@/lib/loyalty'
import { logger } from '@/lib/logger'
import { createCheckoutOrderSchema, createRegularOrderSchema, normalizePhone } from '@/lib/validations/schemas'
import { z } from 'zod'
import { sanitizeFileName } from '@/lib/file-utils'
import { getRateLimitIdentifier, applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

/**
 * Resuelve el userId para una orden. Si hay sesión, devuelve su id.
 * Si no hay sesión, busca/crea un User con isGuest=true por email.
 * Devuelve { userId, isGuest, blocked } — blocked es un mensaje de error si no se permite.
 */
async function resolveOrderUser(
  sessionUserId: string | undefined,
  customerEmail: string,
  customerName: string,
  customerPhone: string | undefined | null
): Promise<{ userId: string; isGuest: boolean; error?: string }> {
  if (sessionUserId) {
    return { userId: sessionUserId, isGuest: false }
  }

  const normalizedEmail = customerEmail.toLowerCase().trim()
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, isGuest: true, password: true },
  })

  if (existing) {
    // Si el email tiene cuenta real, pedir login
    if (!existing.isGuest && existing.password) {
      return {
        userId: '',
        isGuest: false,
        error: 'Este email ya tiene una cuenta. Inicia sesión para continuar.',
      }
    }
    return { userId: existing.id, isGuest: true }
  }

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: customerName,
      phone: customerPhone || null,
      isGuest: true,
      role: 'CUSTOMER',
    },
    select: { id: true },
  })
  return { userId: created.id, isGuest: true }
}

function generateTrackingToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Aplicar rate limiting para creación de pedidos
    const identifier = getRateLimitIdentifier(request, session?.user?.id)
    const rateLimit = applyRateLimit(identifier, RATE_LIMIT_CONFIGS.public)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados pedidos. Por favor, espera un momento.' },
        { status: 429, headers: rateLimit.headers }
      )
    }

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

      // Normalizar teléfono (añadir +34 si es español sin prefijo)
      phone = normalizePhone(phone)

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

      // Guests no pueden pagar con bonos (no tienen bonos asignados)
      if (!session?.user && voucherCode) {
        return NextResponse.json(
          { error: 'Debes iniciar sesión para usar un bono' },
          { status: 401 }
        )
      }

      // Resolver usuario (crear guest si no hay sesión)
      const userResolution = await resolveOrderUser(
        session?.user?.id,
        email,
        name,
        phone
      )
      if (userResolution.error) {
        return NextResponse.json(
          { error: userResolution.error, requiresLogin: true },
          { status: 409 }
        )
      }
      const trackingToken = generateTrackingToken()

      // Crear el pedido
      orderData = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            userId: userResolution.userId,
            isGuestOrder: userResolution.isGuest,
            trackingToken,
            voucherId: null, // Los bonos se manejan por separado
            discountCodeId: discountCodeId || null,
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

        // Si usó código de descuento, incrementar contador de uso
        if (discountCodeId) {
          await tx.discountCode.update({
            where: { id: discountCodeId },
            data: {
              usageCount: { increment: 1 }
            }
          })

          // Crear registro de uso del código de descuento
          await tx.discountCodeUsage.create({
            data: {
              discountCodeId: discountCodeId,
              userId: userResolution.userId,
              orderId: order.id,
              discountAmount: parseFloat((discountAmount || 0).toString())
            }
          })
        }

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

      // Normalizar teléfono si está presente
      if (customerPhone) {
        customerPhone = normalizePhone(customerPhone)
      }

      // Detectar si algún item es un bono (por customizations.voucherTemplateId)
      const isVoucherOrder = items.some((item: any) => {
        const customizations = item.customizations
        return !!customizations?.voucherTemplateId
      })

      // Los bonos requieren cuenta real (no invitado)
      if (isVoucherOrder && !session?.user?.id) {
        return NextResponse.json(
          { error: 'Debes tener una cuenta para comprar bonos. Inicia sesión o regístrate.', requiresLogin: true },
          { status: 401 }
        )
      }

      // Usar bonos de metros también requiere sesión
      if (useMeterVouchers && !session?.user?.id) {
        return NextResponse.json(
          { error: 'Debes iniciar sesión para usar bonos de metros', requiresLogin: true },
          { status: 401 }
        )
      }

      // Resolver usuario (crear guest si no hay sesión)
      const userResolution = await resolveOrderUser(
        session?.user?.id,
        customerEmail,
        customerName,
        customerPhone
      )
      if (userResolution.error) {
        return NextResponse.json(
          { error: userResolution.error, requiresLogin: true },
          { status: 409 }
        )
      }
      const userId: string = userResolution.userId

      // Si se están usando puntos, validar
      if (pointsUsed > 0) {
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Debes estar autenticado para usar puntos' },
            { status: 401 }
          )
        }

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
      const trackingToken = generateTrackingToken()

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
            userId: userId,
            isGuestOrder: userResolution.isGuest,
            trackingToken,
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
