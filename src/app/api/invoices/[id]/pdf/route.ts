import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getInvoicePDF } from '@/lib/invoice'

/**
 * GET /api/invoices/[id]/pdf
 * Descarga el PDF de una factura (para clientes)
 * Solo permite al dueño del pedido o administradores
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Verificar que el usuario esté autenticado
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Obtener la factura
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            userId: true
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
    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = session.user.id === invoice.order.userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Generar el PDF
    const pdfBuffer = await getInvoicePDF(id)

    // Retornar el PDF como respuesta
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Factura-${invoice.invoiceNumber}.pdf"`,
      }
    })
  } catch (error) {
    console.error('Error downloading invoice PDF:', error)
    return NextResponse.json(
      { error: 'Error al descargar la factura' },
      { status: 500 }
    )
  }
}
