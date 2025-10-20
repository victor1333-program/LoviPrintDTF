import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getInvoicePDF } from '@/lib/invoice'

/**
 * GET /api/admin/invoices/[id]/pdf
 * Descarga el PDF de una factura (solo administradores)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Verificar que el usuario sea admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener la factura para verificar que existe y obtener el número
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
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
