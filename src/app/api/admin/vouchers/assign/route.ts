import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assignVoucherSchema } from '@/lib/validations/schemas'
import { generateOrderNumber } from '@/lib/utils'
import { awardLoyaltyPointsForOrder } from '@/lib/loyalty'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Validar con schema
    const body = await request.json()
    const validation = assignVoucherSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))

      return NextResponse.json(
        { error: 'Datos inválidos', details: errors },
        { status: 400 }
      )
    }

    const { voucherId, userId, createOrder, paymentMethod, notes } = validation.data

    // Obtener el bono plantilla
    const template = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { product: true }
    })

    if (!template || !template.isTemplate) {
      return NextResponse.json(
        { error: 'Bono no encontrado o no es una plantilla' },
        { status: 404 }
      )
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Generar código único para el bono asignado
    const code = `${template.code}-${Date.now()}`

    // Crear una copia del bono asignada al usuario
    const assignedVoucher = await prisma.voucher.create({
      data: {
        name: template.name,
        slug: `${template.slug}-${userId}-${Date.now()}`,
        description: template.description,
        imageUrl: template.imageUrl,
        price: template.price,
        productId: template.productId,
        userId: userId,
        code,
        type: template.type,
        initialMeters: template.initialMeters,
        remainingMeters: template.initialMeters,
        initialShipments: template.initialShipments,
        remainingShipments: template.initialShipments,
        expiresAt: template.expiresAt,
        isActive: true,
        isTemplate: false,
        usageCount: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    logger.info('Voucher assigned to user', {
      context: {
        voucherId: assignedVoucher.id,
        voucherCode: code,
        userId: userId,
        adminEmail: session.user.email,
        createOrder: createOrder || false
      }
    })

    // Si createOrder es true, generar pedido
    let createdOrder = null

    if (createOrder && paymentMethod) {
      if (!template.product) {
        logger.error('Cannot create order: voucher has no associated product', {
          context: { voucherId: template.id }
        })
        return NextResponse.json(
          { error: 'El bono no tiene un producto asociado' },
          { status: 400 }
        )
      }

      // Generar número de pedido
      const orderNumber = generateOrderNumber(false)

      // Calcular montos
      const subtotal = parseFloat(template.price.toString())
      const taxAmount = subtotal * 0.21
      const totalPrice = subtotal + taxAmount

      // Crear Order en transacción
      const order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: userId,
            customerName: user.name || user.email,
            customerEmail: user.email,
            customerPhone: user.phone || '',

            // Montos basados en el precio del bono
            subtotal: subtotal,
            discountAmount: 0,
            taxAmount: taxAmount,
            shippingCost: 0, // Bonos no tienen envío físico
            totalPrice: totalPrice,

            // Estados
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentMethod: paymentMethod,

            // Origen y tipo
            source: 'whatsapp', // Pedido manual de bono
            isVoucherPurchase: true, // ← CLAVE: No aparece en cola impresión

            // Relación con el bono
            voucherId: assignedVoucher.id,

            // Notas
            adminNotes: `Bono asignado manualmente por ${session.user.email}. Pago: ${paymentMethod}`,
            notes: notes || `Bono ${template.name} asignado manualmente`,
          }
        })

        // Crear OrderItem
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: template.product!.id,
            productName: `Bono: ${template.name}`,
            quantity: 1,
            unitPrice: subtotal,
            subtotal: subtotal,
            ...(Object.keys({
              voucherTemplateId: template.id,
              voucherName: template.name,
              voucherMeters: Number(template.initialMeters),
              voucherShipments: template.initialShipments,
            }).length > 0 && {
              customizations: {
                voucherTemplateId: template.id,
                voucherName: template.name,
                voucherMeters: Number(template.initialMeters),
                voucherShipments: template.initialShipments,
              }
            })
          }
        })

        // Crear historial
        await tx.orderStatusHistory.create({
          data: {
            orderId: createdOrder.id,
            status: 'CONFIRMED',
            notes: `Bono asignado manualmente por ${session.user.email}. Pago: ${paymentMethod}`,
            createdBy: session.user.email
          }
        })

        return createdOrder
      })

      // Otorgar puntos de fidelidad (+25% bonus por compra de bono)
      try {
        const { pointsEarned } = await awardLoyaltyPointsForOrder(
          prisma,
          userId,
          order.id,
          order.orderNumber,
          totalPrice,
          true // isVoucherPurchase = true (+25% bonus)
        )

        await prisma.order.update({
          where: { id: order.id },
          data: { pointsEarned }
        })

        logger.info('Order created and loyalty points awarded for voucher assignment', {
          context: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            pointsEarned,
            totalPrice
          }
        })
      } catch (error) {
        logger.error('Error awarding loyalty points for voucher order', error, {
          context: { orderId: order.id }
        })
        // No fallar la asignación si falla otorgar puntos
      }

      createdOrder = order
    }

    return NextResponse.json({
      voucher: assignedVoucher,
      order: createdOrder
    })

  } catch (error) {
    console.error('Error assigning voucher:', error)
    logger.error('Error assigning voucher', error)
    return NextResponse.json(
      { error: 'Error al asignar bono' },
      { status: 500 }
    )
  }
}
