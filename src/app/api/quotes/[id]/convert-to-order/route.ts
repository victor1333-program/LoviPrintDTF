import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { convertQuoteToOrder } from '@/lib/quotes'

/**
 * POST /api/quotes/[id]/convert-to-order
 * Convierte un presupuesto pagado en un pedido oficial
 * Solo admin puede realizar esta acción
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const quoteId = id

    // Usar la función reutilizable de conversión
    const result = await convertQuoteToOrder(quoteId, session.user.id!)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al convertir presupuesto a pedido' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Presupuesto convertido a pedido exitosamente',
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        totalPrice: result.order.totalPrice,
      },
      pointsEarned: result.pointsEarned,
    })
  } catch (error) {
    console.error('Error converting quote to order:', error)
    return NextResponse.json(
      {
        error: 'Error al convertir presupuesto a pedido',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
