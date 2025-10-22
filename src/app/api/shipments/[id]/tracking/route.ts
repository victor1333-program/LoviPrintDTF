import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'

/**
 * GET /api/shipments/[id]/tracking
 * Obtener tracking de un envío
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params

    // Buscar envío en BD
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: true,
        trackingEvents: {
          orderBy: { eventDate: 'desc' },
        },
      },
    })

    if (!shipment) {
      return NextResponse.json(
        { error: 'Envío no encontrado' },
        { status: 404 }
      )
    }

    // Si hace más de 1 hora que no se sincroniza, consultar a GLS
    const shouldSync =
      !shipment.lastSyncAt ||
      new Date().getTime() - new Date(shipment.lastSyncAt).getTime() > 3600000

    if (shouldSync && shipment.glsReference) {
      const glsConfig = await GLSService.getConfig()

      if (glsConfig) {
        const glsService = new GLSService(glsConfig)
        const trackingInfo = await glsService.getTrackingByReference(
          shipment.glsReference
        )

        if (trackingInfo) {
          let newStatus = shipment.status

          switch (trackingInfo.statusCode) {
            case 0: newStatus = 'CREATED'; break
            case 1:
            case 2: newStatus = 'PICKED_UP'; break
            case 3:
            case 4:
            case 5: newStatus = 'IN_TRANSIT'; break
            case 6: newStatus = 'OUT_FOR_DELIVERY'; break
            case 7: newStatus = 'DELIVERED'; break
            default:
              if (trackingInfo.incidence) {
                newStatus = 'EXCEPTION'
              }
          }

          await prisma.shipment.update({
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
            }
          }

          if (newStatus === 'DELIVERED' && shipment.order) {
            await prisma.order.update({
              where: { id: shipment.orderId },
              data: { status: 'DELIVERED' },
            })
          }
        }
      }
    }

    const updatedShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
          },
        },
        trackingEvents: {
          orderBy: { eventDate: 'desc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      shipment: updatedShipment,
      events: updatedShipment?.trackingEvents || [],
      lastSync: updatedShipment?.lastSyncAt,
    })
  } catch (error: any) {
    console.error('❌ ERROR GET TRACKING:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener tracking' },
      { status: 500 }
    )
  }
}
