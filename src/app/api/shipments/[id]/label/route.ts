import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener el envío
    const shipment = await prisma.shipment.findUnique({
      where: { id }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Envío no encontrado' }, { status: 404 })
    }

    if (!shipment.glsReference) {
      return NextResponse.json({
        error: 'Este envío no tiene referencia de GLS'
      }, { status: 400 })
    }

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      return NextResponse.json({
        error: 'GLS no está configurado'
      }, { status: 400 })
    }

    const glsService = new GLSService(glsConfig)

    // Obtener etiqueta PDF en base64
    const labelBase64 = await glsService.getLabel(shipment.glsReference)

    if (!labelBase64) {
      return NextResponse.json({
        error: 'No se pudo obtener la etiqueta de GLS'
      }, { status: 500 })
    }

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(labelBase64, 'base64')

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etiqueta-${id}.pdf"`
      }
    })

  } catch (error: any) {
    console.error('Error getting label:', error)
    return NextResponse.json({
      error: error.message || 'Error al obtener la etiqueta'
    }, { status: 500 })
  }
}
