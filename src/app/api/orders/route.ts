import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'
import { validatePointsUsage } from '@/lib/loyalty'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    // Detectar formato del pedido (nuevo formato desde checkout o antiguo formato)
    const isCheckoutFormat = body.metersOrdered !== undefined

    let orderData

    if (isCheckoutFormat) {
      // Nuevo formato desde checkout (DTF)
      const {
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
      const {
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

      // Validaciones básicas
      if (!customerName || !customerEmail || !items || items.length === 0) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        )
      }

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

      // Verificar si algún producto es un bono (VOUCHER)
      const productIds = items.map((item: any) => item.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, productType: true }
      })

      const isVoucherOrder = products.some(p => p.productType === 'VOUCHER')
      const orderNumber = generateOrderNumber(isVoucherOrder)

      // Usar una transacción para crear el pedido
      orderData = await prisma.$transaction(async (tx) => {
        const isPaidWithVouchers = useMeterVouchers && meterVouchersInfo
        const orderStatus = isPaidWithVouchers ? 'CONFIRMED' : 'PENDING'
        const paymentStatus = isPaidWithVouchers ? 'PAID' : 'PENDING'

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

        // Si se usaron bonos de metros, descontarlos usando FIFO
        if (useMeterVouchers && meterVouchersInfo && userId) {
          const { metersNeeded, voucherIds } = meterVouchersInfo

          const vouchers = await tx.voucher.findMany({
            where: {
              id: { in: voucherIds },
              userId: userId,
              isActive: true,
              type: 'METERS',
              remainingMeters: { gt: 0 }
            },
            orderBy: {
              createdAt: 'asc'
            }
          })

          let metersRemaining = metersNeeded

          for (const voucher of vouchers) {
            if (metersRemaining <= 0) break

            const currentRemaining = parseFloat(voucher.remainingMeters.toString())
            const metersToDeduct = Math.min(metersRemaining, currentRemaining)
            const newRemaining = currentRemaining - metersToDeduct

            await tx.voucher.update({
              where: { id: voucher.id },
              data: {
                remainingMeters: newRemaining,
                usageCount: { increment: 1 },
                isActive: newRemaining > 0
              }
            })

            metersRemaining -= metersToDeduct
          }

          if (metersRemaining > 0) {
            throw new Error(`No hay suficientes metros en los bonos. Faltan ${metersRemaining} metros`)
          }
        }

        return newOrder
      })

      // Crear historial de estado
      const historyNotes = useMeterVouchers
        ? `Pedido creado y pagado con bonos de metros (${meterVouchersInfo?.metersNeeded} metros)`
        : 'Pedido creado'

      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderData.id,
          status: useMeterVouchers ? 'CONFIRMED' : 'PENDING',
          notes: historyNotes,
        },
      })
    }

    // Enviar email de confirmación al cliente (no esperar, hacer en background)
    sendOrderConfirmationEmail(orderData).catch(err =>
      console.error('Error sending confirmation email:', err)
    )

    // NOTA: El email al admin se envía cuando se confirma el pago en el webhook
    // Solo se envía aquí si el pedido ya está pagado (con bonos)
    const isPaid = orderData.paymentStatus === 'PAID'
    if (isPaid) {
      sendAdminOrderNotification(orderData).catch(err =>
        console.error('Error sending admin notification:', err)
      )
    }

    return NextResponse.json(orderData, { status: 201 })

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
    console.error('Error al obtener pedidos:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}
