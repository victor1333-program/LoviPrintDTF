import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { auth } from '@/auth'

/**
 * POST /api/shipments/[id]/sync
 * Forzar sincronización de tracking con GLS
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: shipmentId } = await params

    // Buscar envío
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: true,
      },
    })

    if (!shipment) {
      return NextResponse.json(
        { error: 'Envío no encontrado' },
        { status: 404 }
      )
    }

    if (!shipment.glsReference && !shipment.glsUid) {
      return NextResponse.json(
        { error: 'Envío sin referencia GLS' },
        { status: 400 }
      )
    }

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      return NextResponse.json(
        { error: 'GLS no configurado' },
        { status: 400 }
      )
    }

    const glsService = new GLSService(glsConfig)

    // Consultar tracking
    const trackingInfo = shipment.glsReference
      ? await glsService.getTrackingByReference(shipment.glsReference)
      : await glsService.getTrackingByUid(shipment.glsUid!)

    if (!trackingInfo) {
      return NextResponse.json(
        { error: 'No se pudo obtener tracking de GLS' },
        { status: 500 }
      )
    }

    // Mapear estado
    let newStatus = shipment.status
    switch (trackingInfo.statusCode) {
      case 0:
        newStatus = 'CREATED'
        break
      case 1:
      case 2:
        newStatus = 'PICKED_UP'
        break
      case 3:
      case 4:
      case 5:
        newStatus = 'IN_TRANSIT'
        break
      case 6:
        newStatus = 'OUT_FOR_DELIVERY'
        break
      case 7:
        newStatus = 'DELIVERED'
        break
      default:
        if (trackingInfo.incidence) {
          newStatus = 'EXCEPTION'
        }
    }

    // Actualizar shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: newStatus,
        actualDelivery: trackingInfo.deliveredDate,
        podImageUrl: trackingInfo.deliveryPOD,
        deliverySignatureName: trackingInfo.deliveryRecipient,
        incidence: trackingInfo.incidence,
        lastSyncAt: new Date(),
      },
    })

    // Sincronizar eventos
    let newEventsCount = 0
    for (const event of trackingInfo.events) {
      const existingEvent = await prisma.shipmentTracking.findFirst({
        where: {
          shipmentId: shipmentId,
          eventDate: event.date,
          description: event.description,
        },
      })

      if (!existingEvent) {
        await prisma.shipmentTracking.create({
          data: {
            shipmentId: shipmentId,
            status: event.type,
            description: event.description,
            location: event.location || null,
            eventDate: event.date,
            eventType: event.type,
            eventCode: event.code || null,
            agencyCode: event.agencyCode || null,
            agencyName: event.agencyName || null,
          },
        })
        newEventsCount++
      }
    }

    // Actualizar pedido si se entregó
    if (newStatus === 'DELIVERED' && shipment.order) {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: 'DELIVERED',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking sincronizado correctamente',
      shipment: updatedShipment,
      newEvents: newEventsCount,
      trackingInfo,
    })
  } catch (error: any) {
    console.error('❌ ERROR SYNC TRACKING:', error)
    return NextResponse.json(
      { error: error.message || 'Error al sincronizar tracking' },
      { status: 500 }
    )
  }
}
