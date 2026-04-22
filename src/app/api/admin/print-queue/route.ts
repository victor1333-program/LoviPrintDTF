import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@prisma/client'

/**
 * GET /api/admin/print-queue
 * Obtener pedidos para la cola de impresión
 * Solo pedidos CONFIRMED o IN_PRODUCTION con pago PAID
 * Soporta paginación: ?page=1&limit=50 (default: limit=100)
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de paginación desde query params
    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const usePagination = pageParam !== null || limitParam !== null

    const page = parseInt(pageParam || '1', 10)
    const limit = Math.min(parseInt(limitParam || '100', 10), 200) // Máximo 200
    const skip = (page - 1) * limit

    // Obtener pedidos CONFIRMED o IN_PRODUCTION que estén pagados
    const queryConfig = {
      where: {
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION]
        },
        paymentStatus: PaymentStatus.PAID
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
        createdAt: 'asc' as const // Ordenar por fecha de entrada
      },
      ...(usePagination && { take: limit, skip: skip })
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany(queryConfig),
      usePagination ? prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION]
          },
          paymentStatus: PaymentStatus.PAID
        }
      }) : Promise.resolve(0)
    ])

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
        totalPrice: order.totalPrice.toString(),
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

    // Si se usa paginación, incluir metadata; si no, retornar array directo (compatibilidad)
    if (usePagination) {
      return NextResponse.json({
        data: sorted,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      })
    } else {
      // Comportamiento por defecto sin paginación (compatibilidad con frontend actual)
      return NextResponse.json(sorted)
    }
  } catch (error) {
    console.error('Error loading print queue:', error)
    return NextResponse.json(
      { error: 'Error al cargar la cola de impresión' },
      { status: 500 }
    )
  }
}
