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
      where: { id },
      include: { trackingEvents: { orderBy: { eventDate: 'desc' } } }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Envío no encontrado' }, { status: 404 })
    }

    if (!shipment.trackingNumber) {
      return NextResponse.json({
        error: 'Este envío no tiene número de seguimiento'
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

    // Obtener seguimiento desde GLS
    const events = await glsService.getTracking(shipment.trackingNumber)

    // Actualizar eventos en la base de datos (solo nuevos)
    for (const event of events) {
      await prisma.shipmentTracking.upsert({
        where: {
          id: `${shipment.id}-${event.eventDate.getTime()}`
        },
        create: {
          id: `${shipment.id}-${event.eventDate.getTime()}`,
          shipmentId: shipment.id,
          status: event.status,
          description: event.description,
          location: event.location,
          eventDate: event.eventDate
        },
        update: {
          status: event.status,
          description: event.description,
          location: event.location
        }
      })
    }

    // Actualizar estado del envío según el último evento
    if (events.length > 0) {
      const latestEvent = events[0]
      const newStatus = mapStatusToShipmentStatus(latestEvent.status)

      await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: newStatus,
          ...(newStatus === 'DELIVERED' ? { actualDelivery: latestEvent.eventDate } : {})
        }
      })
    }

    // Obtener envío actualizado
    const updatedShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { trackingEvents: { orderBy: { eventDate: 'desc' } } }
    })

    return NextResponse.json({
      success: true,
      shipment: updatedShipment
    })

  } catch (error: any) {
    console.error('Error getting tracking:', error)
    return NextResponse.json({
      error: error.message || 'Error al obtener el seguimiento'
    }, { status: 500 })
  }
}

function mapStatusToShipmentStatus(status: string) {
  const mapping = {
    'DELIVERED': 'DELIVERED' as const,
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY' as const,
    'IN_TRANSIT': 'IN_TRANSIT' as const,
    'PICKED_UP': 'PICKED_UP' as const,
    'EXCEPTION': 'EXCEPTION' as const
  } as const

  return (mapping as any)[status] || 'IN_TRANSIT'
}
