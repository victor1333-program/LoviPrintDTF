import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { PDFDocument } from 'pdf-lib'

/**
 * POST /api/admin/orders/bulk/labels
 * Generar un PDF con múltiples etiquetas de envío
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { orderIds } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de orderIds' },
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

    const glsService = new GLSService(glsConfig)

    // Obtener todos los pedidos con sus shipments
    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: orderIds
        }
      },
      include: {
        shipment: {
          select: {
            glsReference: true,
            trackingNumber: true
          }
        }
      }
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron pedidos' },
        { status: 404 }
      )
    }

    // Filtrar solo pedidos que tienen etiqueta
    const ordersWithLabels = orders.filter(order => order.shipment?.glsReference)

    if (ordersWithLabels.length === 0) {
      return NextResponse.json(
        { error: 'Ninguno de los pedidos seleccionados tiene etiqueta de envío generada' },
        { status: 400 }
      )
    }

    // Crear un nuevo PDF donde combinaremos todas las etiquetas
    const mergedPdf = await PDFDocument.create()

    // Obtener y agregar cada etiqueta al PDF combinado
    for (const order of ordersWithLabels) {
      try {
        // Obtener la etiqueta de GLS
        const labelBase64 = await glsService.getLabel(order.shipment!.glsReference!)

        if (!labelBase64) {
          console.warn(`No se pudo obtener etiqueta para pedido ${order.orderNumber}`)
          continue
        }

        // Convertir de base64 a buffer
        const labelBuffer = Buffer.from(labelBase64, 'base64')

        // Cargar el PDF de la etiqueta
        const labelPdf = await PDFDocument.load(labelBuffer)

        // Copiar todas las páginas de esta etiqueta al PDF combinado
        const copiedPages = await mergedPdf.copyPages(labelPdf, labelPdf.getPageIndices())
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page)
        })
      } catch (error) {
        console.error(`Error procesando etiqueta para pedido ${order.orderNumber}:`, error)
        // Continuar con el siguiente pedido
      }
    }

    // Verificar que al menos se agregó una página
    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json(
        { error: 'No se pudo generar ninguna etiqueta' },
        { status: 500 }
      )
    }

    // Generar el PDF final
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBuffer = Buffer.from(mergedPdfBytes)

    // Devolver el PDF combinado
    return new NextResponse(mergedPdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etiquetas-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating bulk labels:', error)
    return NextResponse.json(
      { error: 'Error al generar las etiquetas' },
      { status: 500 }
    )
  }
}
