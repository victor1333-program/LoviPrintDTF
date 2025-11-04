import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { sendOrderStatusUpdateEmail } from '@/lib/email'

/**
 * GET /api/cron/update-tracking
 * Actualiza el tracking de todos los pedidos enviados consultando a GLS
 * Endpoint protegido por CRON_SECRET para ejecución automática
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET no está configurado')
      return NextResponse.json(
        { error: 'Configuración de cron no disponible' },
        { status: 500 }
      )
    }

    const token = authHeader?.replace('Bearer ', '')
    if (token !== cronSecret) {
      console.error('[CRON] Token inválido o ausente')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('[CRON] Iniciando actualización automática de tracking...')

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()
    if (!glsConfig) {
      console.error('[CRON] Configuración de GLS no disponible')
      return NextResponse.json(
        { error: 'Configuración de GLS no disponible' },
        { status: 500 }
      )
    }

    const glsService = new GLSService(glsConfig)

    // Obtener pedidos que están enviados o listos y que tienen envío creado
    const shipments = await prisma.shipment.findMany({
      where: {
        glsReference: { not: null },
        status: {
          in: ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
        }
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            status: true
          }
        }
      }
    })

    console.log(`[CRON] Encontrados ${shipments.length} envíos para actualizar`)

    let updated = 0
    let delivered = 0
    const results = []

    // Actualizar cada envío
    for (const shipment of shipments) {
      try {
        if (!shipment.glsReference) {
          console.log(`[CRON] Envío sin referencia GLS, saltando`)
          continue
        }

        console.log(`[CRON] Actualizando envío ${shipment.glsReference}`)

        const trackingInfo = await glsService.getTrackingByReference(shipment.glsReference)

        if (!trackingInfo) {
          console.log(`[CRON] No se pudo obtener tracking para ${shipment.glsReference}`)
          results.push({
            shipmentId: shipment.id,
            glsReference: shipment.glsReference,
            orderNumber: shipment.order?.orderNumber,
            success: false,
            error: 'No se pudo obtener información de GLS'
          })
          continue
        }

        // Determinar nuevo estado según código de GLS
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

        // Actualizar envío
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: newStatus,
            actualDelivery: trackingInfo.deliveredDate,
            podImageUrl: trackingInfo.deliveryPOD,
            deliverySignatureName: trackingInfo.deliveryRecipient,
            incidence: trackingInfo.incidence,
            lastSyncAt: new Date(),
          },
        })

        // Actualizar eventos de tracking (solo nuevos)
        for (const event of trackingInfo.events) {
          const existingEvent = await prisma.shipmentTracking.findFirst({
            where: {
              shipmentId: shipment.id,
              eventDate: event.date,
              description: event.description,
            },
          })

          if (!existingEvent) {
            await prisma.shipmentTracking.create({
              data: {
                shipmentId: shipment.id,
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

        // Si el envío fue entregado, actualizar el pedido
        if (newStatus === 'DELIVERED' && shipment.order && shipment.order.status !== 'DELIVERED') {
          await prisma.order.update({
            where: { id: shipment.orderId },
            data: { status: 'DELIVERED' },
          })

          await prisma.orderStatusHistory.create({
            data: {
              orderId: shipment.orderId,
              status: 'DELIVERED',
              notes: 'Pedido entregado según tracking de GLS (actualización automática)'
            }
          })

          // Enviar email de entrega
          const orderWithItems = await prisma.order.findUnique({
            where: { id: shipment.orderId },
            include: {
              items: {
                include: { product: true }
              }
            }
          })

          if (orderWithItems) {
            sendOrderStatusUpdateEmail(orderWithItems, 'DELIVERED').catch(err =>
              console.error('[CRON] Error enviando email de entrega:', err)
            )
          }

          delivered++
          console.log(`[CRON] ✅ Pedido ${shipment.order.orderNumber} marcado como ENTREGADO`)
        }

        updated++
        results.push({
          shipmentId: shipment.id,
          glsReference: shipment.glsReference,
          orderNumber: shipment.order?.orderNumber,
          success: true,
          newStatus: newStatus,
          wasDelivered: newStatus === 'DELIVERED'
        })

      } catch (error: any) {
        console.error(`[CRON] Error actualizando ${shipment.glsReference}:`, error)
        results.push({
          shipmentId: shipment.id,
          glsReference: shipment.glsReference,
          orderNumber: shipment.order?.orderNumber,
          success: false,
          error: error.message
        })
      }
    }

    console.log(`[CRON] Completado: ${updated} actualizados, ${delivered} entregados`)

    return NextResponse.json({
      success: true,
      message: `Tracking actualizado para ${updated} pedidos`,
      updated,
      delivered,
      total: shipments.length,
      results
    })

  } catch (error: any) {
    console.error('[CRON] Error general:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar tracking' },
      { status: 500 }
    )
  }
}
