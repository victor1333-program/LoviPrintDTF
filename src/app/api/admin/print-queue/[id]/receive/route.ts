import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/print-queue/[id]/receive
 * Marcar pedido como recibido (cambiar a IN_PRODUCTION)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    // Actualizar estado del pedido
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'IN_PRODUCTION',
        statusHistory: {
          create: {
            status: 'IN_PRODUCTION',
            notes: 'Pedido recibido en cola de impresión',
            createdBy: session.user.email || undefined
          }
        }
      }
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error marking order as received:', error)
    return NextResponse.json(
      { error: 'Error al marcar el pedido como recibido' },
      { status: 500 }
    )
  }
}
