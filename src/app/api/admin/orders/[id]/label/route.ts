import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'

/**
 * GET /api/admin/orders/[id]/label
 * Obtener la etiqueta de envío de un pedido
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    // Obtener el pedido con su shipment
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        shipment: {
          select: {
            glsReference: true,
            trackingNumber: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (!order.shipment?.glsReference) {
      return NextResponse.json(
        { error: 'Este pedido no tiene etiqueta de envío generada' },
        { status: 400 }
      )
    }

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      return NextResponse.json(
        { error: 'GLS no está configurado' },
        { status: 500 }
      )
    }

    // Obtener la etiqueta de GLS
    const glsService = new GLSService(glsConfig)
    const labelBase64 = await glsService.getLabel(order.shipment.glsReference)

    if (!labelBase64) {
      return NextResponse.json(
        { error: 'No se pudo obtener la etiqueta de envío' },
        { status: 500 }
      )
    }

    // Convertir de base64 a buffer
    const labelBuffer = Buffer.from(labelBase64, 'base64')

    // Devolver el PDF
    return new NextResponse(labelBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etiqueta-${order.orderNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error getting shipping label:', error)
    return NextResponse.json(
      { error: 'Error al obtener la etiqueta de envío' },
      { status: 500 }
    )
  }
}
