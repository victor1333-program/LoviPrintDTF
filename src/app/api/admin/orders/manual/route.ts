import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { createManualOrderSchema } from '@/lib/validations/schemas'
import { logger } from '@/lib/logger'
import { awardLoyaltyPointsForOrder } from '@/lib/loyalty'
import { sendOrderConfirmationEmail } from '@/lib/email'

/**
 * POST /api/admin/orders/manual
 * Crea un pedido manual (WhatsApp) desde el panel de administración
 * Solo accesible para usuarios con rol ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación y permisos
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear pedidos manuales' },
        { status: 403 }
      )
    }

    // 2. Validar datos del request
    const body = await request.json()
    const validation = createManualOrderSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))

      logger.warn('Validation error in manual order creation', {
        context: {
          adminEmail: session.user.email,
          errors
        }
      })

      return NextResponse.json(
        { error: 'Datos inválidos', details: errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // 3. Buscar producto DTF activo
    const dtfProduct = await prisma.product.findFirst({
      where: {
        productType: 'DTF_TEXTILE',
        isActive: true
      }
    })

    if (!dtfProduct) {
      logger.error('DTF product not found when creating manual order', {
        context: { adminEmail: session.user.email }
      })

      return NextResponse.json(
        { error: 'Producto DTF no encontrado. Contacta con soporte técnico.' },
        { status: 500 }
      )
    }

    // 4. Verificar que el método de envío existe
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { id: data.shippingMethodId }
    })

    if (!shippingMethod) {
      return NextResponse.json(
        { error: 'Método de envío no encontrado' },
        { status: 400 }
      )
    }

    // 5. Si se proporcionó associateUserId, verificar que existe
    let userIdToAssociate: string | null = data.associateUserId || null

    if (data.associateUserId) {
      const user = await prisma.user.findUnique({
        where: { id: data.associateUserId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 400 }
        )
      }

      // Si el email no coincide, advertir (seguridad)
      if (user.email !== data.customerEmail) {
        logger.warn('Email mismatch in manual order user association', {
          context: {
            userId: user.id,
            userEmail: user.email,
            customerEmail: data.customerEmail,
            adminEmail: session.user.email
          }
        })
      }
    }

    // 5b. Si se va a usar un bono, validar y reservar metros
    let voucherToUse: any = null
    let shouldAwardPoints = true

    if (data.useVoucher && data.voucherId) {
      // Validar que el bono existe y pertenece al usuario
      voucherToUse = await prisma.voucher.findUnique({
        where: { id: data.voucherId }
      })

      if (!voucherToUse) {
        return NextResponse.json(
          { error: 'Bono no encontrado' },
          { status: 400 }
        )
      }

      if (voucherToUse.userId !== userIdToAssociate) {
        return NextResponse.json(
          { error: 'El bono no pertenece a este usuario' },
          { status: 400 }
        )
      }

      if (!voucherToUse.isActive) {
        return NextResponse.json(
          { error: 'El bono no está activo' },
          { status: 400 }
        )
      }

      // Verificar que hay suficientes metros disponibles
      const remainingMeters = parseFloat(voucherToUse.remainingMeters.toString())
      if (data.metersOrdered > remainingMeters) {
        return NextResponse.json(
          { error: `El bono solo tiene ${remainingMeters}m disponibles. Necesitas ${data.metersOrdered}m.` },
          { status: 400 }
        )
      }

      // Verificar que no haya expirado
      if (voucherToUse.expiresAt && new Date(voucherToUse.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'El bono ha expirado' },
          { status: 400 }
        )
      }

      // Si se usa bono, NO otorgar puntos (ya fueron otorgados al comprar el bono)
      shouldAwardPoints = false

      logger.info('Using voucher for manual order', {
        context: {
          voucherId: voucherToUse.id,
          voucherName: voucherToUse.name,
          metersToUse: data.metersOrdered,
          metersRemaining: remainingMeters,
          adminEmail: session.user.email
        }
      })
    }

    // 6. Generar número de pedido único
    const orderNumber = generateOrderNumber(false)

    // 7. Crear pedido en transacción
    const order = await prisma.$transaction(async (tx) => {
      // Crear Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingMethodId: data.shippingMethodId,
          subtotal: data.subtotal,
          discountAmount: 0, // Los descuentos se ajustan en precio/metro
          taxAmount: data.taxAmount,
          shippingCost: data.shippingCost,
          totalPrice: data.totalPrice,
          metersOrdered: data.metersOrdered,
          pricePerMeter: data.pricePerMeter,
          designFileUrl: data.designFileUrl,
          designFileName: data.designFileName,
          shippingAddress: data.shippingAddress,
          notes: data.notes || null,
          adminNotes: voucherToUse
            ? `Pedido manual (WhatsApp) creado por ${session.user.name || session.user.email}. Pago: ${data.paymentMethod}. BONO USADO: ${voucherToUse.name} (${data.metersOrdered}m descontados). Impresión ya pagada en el bono.`
            : `Pedido manual (WhatsApp) creado por ${session.user.name || session.user.email}. Pago: ${data.paymentMethod}`,

          // Estados: Ya confirmado y pagado
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: data.paymentMethod,

          // NUEVO: Source whatsapp
          source: 'whatsapp',

          // Usuario asociado (puede ser null)
          userId: userIdToAssociate,

          // Campos no aplicables para pedidos manuales
          voucherId: voucherToUse ? voucherToUse.id : null,
          discountCodeId: null,
          pointsUsed: 0,
          pointsDiscount: 0,
          isVoucherPurchase: false,
          stripePaymentId: null,
        },
      })

      // Si se está usando un bono, descontar los metros
      if (voucherToUse) {
        const currentRemaining = parseFloat(voucherToUse.remainingMeters.toString())
        const newMetersRemaining = currentRemaining - data.metersOrdered
        const shouldDeactivate = newMetersRemaining <= 0

        await tx.voucher.update({
          where: { id: voucherToUse.id },
          data: {
            remainingMeters: Math.max(0, newMetersRemaining),
            isActive: !shouldDeactivate,
            usageCount: { increment: 1 }
          }
        })

        logger.info('Voucher meters deducted for manual order', {
          context: {
            voucherId: voucherToUse.id,
            metersDeducted: data.metersOrdered,
            metersRemaining: newMetersRemaining,
            isActive: !shouldDeactivate,
            orderNumber
          }
        })
      }

      // Crear OrderItem
      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: dtfProduct.id,
          productName: `Impresión DTF - ${data.metersOrdered}m`,
          quantity: data.metersOrdered,
          unitPrice: data.pricePerMeter,
          subtotal: data.subtotal,
          fileUrl: data.designFileUrl,
          fileName: data.designFileName,
          ...(data.customizations && { customizations: data.customizations }),
        }
      })

      // Crear historial de estado
      await tx.orderStatusHistory.create({
        data: {
          orderId: createdOrder.id,
          status: 'CONFIRMED',
          notes: voucherToUse
            ? `Pedido manual (WhatsApp) creado por ${session.user.name || session.user.email}. Método de pago: ${data.paymentMethod}. Usando bono: ${voucherToUse.name} (${data.metersOrdered}m descontados).`
            : `Pedido manual (WhatsApp) creado por ${session.user.name || session.user.email}. Método de pago: ${data.paymentMethod}.`,
          createdBy: session.user.email || undefined
        }
      })

      return createdOrder
    })

    // 8. Otorgar puntos de fidelidad SI tiene usuario asociado Y NO está usando un bono
    let pointsEarned = 0
    let newTier = 'BRONZE'

    if (userIdToAssociate && shouldAwardPoints) {
      try {
        const loyaltyResult = await awardLoyaltyPointsForOrder(
          prisma,
          userIdToAssociate,
          order.id,
          order.orderNumber,
          parseFloat(order.totalPrice.toString()),
          false // No es compra de bono
        )

        pointsEarned = loyaltyResult.pointsEarned
        newTier = loyaltyResult.newTier

        // Actualizar el pedido con los puntos otorgados
        await prisma.order.update({
          where: { id: order.id },
          data: { pointsEarned: pointsEarned }
        })

        logger.info('Loyalty points awarded for manual order', {
          context: {
            orderNumber: order.orderNumber,
            userId: userIdToAssociate,
            pointsEarned,
            newTier
          }
        })
      } catch (error) {
        logger.error('Error awarding loyalty points for manual order', error, {
          context: {
            orderNumber: order.orderNumber,
            userId: userIdToAssociate
          }
        })
        // No fallar la creación del pedido si falla otorgar puntos
      }
    } else if (userIdToAssociate && !shouldAwardPoints) {
      logger.info('Loyalty points not awarded (voucher used)', {
        context: {
          orderNumber: order.orderNumber,
          userId: userIdToAssociate,
          voucherId: voucherToUse?.id
        }
      })
    }

    // 9. Enviar email de confirmación SI se solicitó
    if (data.sendConfirmationEmail) {
      try {
        // Obtener pedido completo con relaciones para el email
        const orderWithDetails = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: { product: true }
            },
            shippingMethod: true
          }
        })

        if (orderWithDetails) {
          await sendOrderConfirmationEmail(orderWithDetails)

          logger.info('Confirmation email sent for manual order', {
            context: {
              orderNumber: order.orderNumber,
              customerEmail: data.customerEmail
            }
          })
        }
      } catch (error) {
        logger.error('Error sending confirmation email for manual order', error, {
          context: {
            orderNumber: order.orderNumber,
            customerEmail: data.customerEmail
          }
        })
        // No fallar la creación del pedido si falla el email
      }
    }

    // 10. Log exitoso
    logger.info('Manual order created successfully', {
      context: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerEmail: data.customerEmail,
        totalPrice: data.totalPrice,
        createdBy: session.user.email,
        hasUser: !!userIdToAssociate,
        pointsEarned,
        emailSent: data.sendConfirmationEmail || false,
        voucherUsed: !!voucherToUse,
        voucherId: voucherToUse?.id,
        metersFromVoucher: voucherToUse ? data.metersOrdered : 0
      }
    })

    // 11. Retornar pedido completo con relaciones
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { product: true }
        },
        shippingMethod: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        ...orderWithItems,
        pointsEarned,
        newTier: userIdToAssociate ? newTier : null
      },
      { status: 201 }
    )

  } catch (error) {
    logger.error('Error creating manual order', error, {
      context: {
        adminEmail: (await auth())?.user?.email
      }
    })

    return NextResponse.json(
      { error: 'Error al crear el pedido manual. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
