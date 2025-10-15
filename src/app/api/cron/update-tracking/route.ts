import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { sendOrderStatusUpdateEmail } from '@/lib/email'

/**
 * GET /api/cron/update-tracking
 * Cron job que actualiza el tracking de todos los pedidos enviados
 * Se ejecuta a las 19:00 cuando cierra la agencia de transporte
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del cron (opcional - usar una clave secreta)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      console.log('GLS no configurado, saltando actualización de tracking')
      return NextResponse.json({
        success: true,
        message: 'GLS no configurado',
        updated: 0
      })
    }

    const glsService = new GLSService(glsConfig)

    // Obtener todos los pedidos en estado SHIPPED o READY que tengan shipment
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['SHIPPED', 'READY']
        },
        shipment: {
          isNot: null
        }
      },
      include: {
        shipment: {
          include: {
            trackingEvents: {
              orderBy: {
                eventDate: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })

    console.log(`[CRON] Actualizando tracking para ${orders.length} pedidos`)

    let updatedCount = 0
    let deliveredCount = 0
    const results = []

    for (const order of orders) {
      if (!order.shipment?.trackingNumber) continue

      try {
        // Obtener tracking de GLS
        const trackingEvents = await glsService.getTracking(order.shipment.trackingNumber)

        if (!trackingEvents || trackingEvents.length === 0) {
          results.push({
            orderNumber: order.orderNumber,
            status: 'no_events',
            message: 'No hay eventos de tracking'
          })
          continue
        }

        // Obtener el último evento
        const latestEvent = trackingEvents[0]

        // Guardar eventos de tracking en la base de datos
        for (const event of trackingEvents) {
          // Verificar si el evento ya existe
          const existingEvent = await prisma.shipmentTracking.findFirst({
            where: {
              shipmentId: order.shipment.id,
              eventDate: event.eventDate,
              description: event.description
            }
          })

          if (!existingEvent) {
            await prisma.shipmentTracking.create({
              data: {
                shipmentId: order.shipment.id,
                status: event.status,
                description: event.description,
                location: event.location,
                eventDate: event.eventDate
              }
            })
          }
        }

        // Actualizar estado del shipment
        await prisma.shipment.update({
          where: { id: order.shipment.id },
          data: {
            status: latestEvent.status as any
          }
        })

        updatedCount++

        // Si el estado es DELIVERED, actualizar el pedido
        if (latestEvent.status === 'DELIVERED' && order.status !== 'DELIVERED') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'DELIVERED',
              statusHistory: {
                create: {
                  status: 'DELIVERED',
                  notes: `Entrega confirmada por GLS: ${latestEvent.description}`
                }
              }
            },
            include: {
              user: true
            }
          })

          deliveredCount++

          // Enviar correo al cliente
          const orderWithUser = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
              user: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          })

          if (orderWithUser) {
            sendOrderStatusUpdateEmail(orderWithUser, 'DELIVERED').catch(err =>
              console.error('Error sending delivery email:', err)
            )
          }

          results.push({
            orderNumber: order.orderNumber,
            status: 'delivered',
            message: 'Pedido marcado como entregado y correo enviado'
          })
        } else {
          results.push({
            orderNumber: order.orderNumber,
            status: 'updated',
            latestStatus: latestEvent.status,
            message: latestEvent.description
          })
        }
      } catch (error: any) {
        console.error(`Error updating tracking for order ${order.orderNumber}:`, error)
        results.push({
          orderNumber: order.orderNumber,
          status: 'error',
          message: error.message
        })
      }
    }

    console.log(`[CRON] Tracking actualizado: ${updatedCount} pedidos, ${deliveredCount} entregados`)

    return NextResponse.json({
      success: true,
      message: `Tracking actualizado para ${updatedCount} pedidos`,
      delivered: deliveredCount,
      results
    })
  } catch (error: any) {
    console.error('Error in tracking cron job:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tracking', message: error.message },
      { status: 500 }
    )
  }
}
