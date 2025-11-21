import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/print-queue
 * Obtener pedidos para la cola de impresión
 * Solo pedidos CONFIRMED o IN_PRODUCTION con pago PAID
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener pedidos CONFIRMED o IN_PRODUCTION que estén pagados
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'IN_PRODUCTION']
        },
        paymentStatus: 'PAID'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true,
        shippingMethod: true
      },
      orderBy: {
        createdAt: 'asc' // Ordenar por fecha de entrada
      }
    })

    // IMPORTANTE: Filtrar pedidos de bonos (no deben aparecer en cola de impresión)
    const printableOrders = orders.filter(order => {
      // Excluir pedidos que sean compra de bonos (voucherTemplateId en customizations)
      const isVoucherOrder = order.items.some(
        item => item.customizations && (item.customizations as any).voucherTemplateId
      )
      return !isVoucherOrder
    })

    // Determinar si cada pedido está priorizado
    const ordersWithPriority = printableOrders.map(order => {
      const isPrioritized = order.items.some(
        item => item.customizations &&
        (item.customizations as any).extras?.prioritize?.selected === true
      )

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        shippingMethod: order.shippingMethod ? {
          id: order.shippingMethod.id,
          name: order.shippingMethod.name
        } : null,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          customizations: item.customizations,
          product: {
            unit: item.product?.unit || 'metros'
          }
        })),
        isPrioritized
      }
    })

    // Ordenar: Priorizados primero, luego normales (ambos por fecha)
    const prioritized = ordersWithPriority.filter(o => o.isPrioritized)
    const normal = ordersWithPriority.filter(o => !o.isPrioritized)

    const sorted = [...prioritized, ...normal]

    return NextResponse.json(sorted)
  } catch (error) {
    console.error('Error loading print queue:', error)
    return NextResponse.json(
      { error: 'Error al cargar la cola de impresión' },
      { status: 500 }
    )
  }
}
