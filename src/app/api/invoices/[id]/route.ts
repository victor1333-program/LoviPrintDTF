import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/invoices/[id]
 * Obtiene los datos de una factura
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Obtener la factura
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos: admin o dueño del pedido
    const isAdmin = session?.user?.role === 'ADMIN'
    const isOwner = session?.user?.id === invoice.order.userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Error al obtener la factura' },
      { status: 500 }
    )
  }
}
