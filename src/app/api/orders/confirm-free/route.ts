import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVoucherPurchaseEmail, sendAdminOrderNotification } from '@/lib/email'
import { createInvoiceForOrder } from '@/lib/invoice'
import { awardLoyaltyPointsForOrder } from '@/lib/loyalty'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del pedido' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el pedido sea de 0€
    if (parseFloat(order.totalPrice.toString()) !== 0) {
      return NextResponse.json(
        { error: 'Este endpoint solo es para pedidos gratuitos (0€)' },
        { status: 400 }
      )
    }

    // Verificar que el pedido no esté ya pagado
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'El pedido ya está confirmado' },
        { status: 400 }
      )
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

    // Descontar bonos si el pedido usa bonos de metros
    let voucherIdToAssociate: string | null = null
    const isVoucherOrder = order.notes?.includes('bonos de metros') || order.notes?.includes('bono:')

    if (isVoucherOrder && userIdToUse) {
      // Calcular metros necesarios desde los items
      let metersNeeded = 0
      for (const item of order.items) {
        if (item.product.productType === 'DTF_TEXTILE') {
          metersNeeded += parseFloat(item.quantity.toString())
        }
      }

      if (metersNeeded > 0) {
        console.log(`Deducting ${metersNeeded} meters from user ${userIdToUse} vouchers`)

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

        if (vouchers.length === 0) {
          return NextResponse.json(
            { error: 'No se encontraron bonos activos para este usuario' },
            { status: 400 }
          )
        }

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

          // Descontar envíos si quedan
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

        if (metersRemaining > 0) {
          return NextResponse.json(
            { error: `No hay suficientes metros en los bonos. Faltan ${metersRemaining} metros` },
            { status: 400 }
          )
        }

        if (shipmentsNeeded > 0) {
          console.log(`Warning: No hay suficientes envíos en los bonos. Faltan ${shipmentsNeeded} envío(s)`)
        }
      }
    }

    // Actualizar el estado del pedido (y asociar usuario y bono si se encontraron)
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentMethod: isVoucherOrder ? 'VOUCHER' : 'FREE',
        ...(userIdToUse && !order.userId ? { userId: userIdToUse } : {}),
        ...(voucherIdToAssociate ? { voucherId: voucherIdToAssociate } : {}),
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
    const historyNotes = isVoucherOrder
      ? `Pedido confirmado y pagado con bono de metros${voucherIdToAssociate ? ` (ID: ${voucherIdToAssociate})` : ''}`
      : 'Pedido confirmado (total 0€ - gratuito)'

    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        status: 'CONFIRMED',
        notes: historyNotes,
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
            // Generar código único para el bono (el orderNumber ya tiene el prefijo BONO-)
            const voucherCode = `${updatedOrder.orderNumber}-${Date.now().toString(36).toUpperCase()}`

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
            console.log(`Created voucher ${voucherCode} for user ${userIdToUse} from free order ${updatedOrder.orderNumber}`)
          } else {
            console.error(`No voucher template found with id ${voucherTemplateId}`)
          }
        }
      }
    }

    // Si el pedido tiene un userId, otorgar puntos de fidelidad
    // Nota: Para pedidos de 0€ normalmente no se otorgan puntos, pero lo incluimos por consistencia
    if (userIdToUse && parseFloat(order.totalPrice.toString()) > 0) {
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
        updatedOrder.orderNumber,
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

      console.log(`Awarded ${pointsEarned} points to user for free order ${updatedOrder.orderNumber}`)
    }

    // Enviar email específico según el tipo de pedido
    if (createdVouchers.length > 0) {
      // Es una compra de bono - enviar email especial de activación
      for (const voucher of createdVouchers) {
        sendVoucherPurchaseEmail(updatedOrder, voucher).catch(err =>
          console.error('Error sending voucher purchase email:', err)
        )
      }
    } else {
      // Es un pedido gratis normal - enviar email de confirmación estándar
      const { sendOrderConfirmationEmail } = await import('@/lib/email')
      sendOrderConfirmationEmail(updatedOrder).catch(err =>
        console.error('Error sending order confirmation email:', err)
      )
    }

    // Enviar email de notificación al admin
    sendAdminOrderNotification(updatedOrder).catch(err =>
      console.error('Error sending admin notification:', err)
    )

    // NO generar factura para pedidos de 0€ (pagados con bonos)
    // Solo se genera factura si el total es mayor a 0€
    const orderTotal = parseFloat(updatedOrder.totalPrice.toString())
    if (orderTotal > 0) {
      createInvoiceForOrder(updatedOrder.id).catch(err =>
        console.error('Error generating invoice:', err)
      )
    } else {
      console.log(`Skipping invoice generation for free order ${updatedOrder.orderNumber} (total: ${orderTotal}€)`)
    }

    console.log(`Free order confirmed: ${updatedOrder.orderNumber}`)

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    })

  } catch (error) {
    console.error('Error confirming free order:', error)
    return NextResponse.json(
      { error: 'Error al confirmar el pedido' },
      { status: 500 }
    )
  }
}
