import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { sendOrderStatusUpdateEmail } from '@/lib/email'

/**
 * POST /api/admin/tracking/update
 * Actualización manual de tracking desde el panel de admin
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      return NextResponse.json(
        { error: 'GLS no está configurado' },
        { status: 400 }
      )
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
            status: latestEvent.status as any,
            actualDelivery: latestEvent.status === 'DELIVERED' ? latestEvent.eventDate : undefined
          }
        })

        updatedCount++

        // Si el estado es DELIVERED, actualizar el pedido
        if (latestEvent.status === 'DELIVERED' && order.status !== 'DELIVERED') {
          const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'DELIVERED',
              statusHistory: {
                create: {
                  status: 'DELIVERED',
                  notes: `Entrega confirmada por GLS: ${latestEvent.description}`,
                  createdBy: session.user.email || undefined
                }
              }
            },
            include: {
              user: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          })

          deliveredCount++

          // Enviar correo al cliente
          sendOrderStatusUpdateEmail(updatedOrder, 'DELIVERED').catch(err =>
            console.error('Error sending delivery email:', err)
          )

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

    return NextResponse.json({
      success: true,
      message: `Tracking actualizado para ${updatedCount} pedidos`,
      totalOrders: orders.length,
      updated: updatedCount,
      delivered: deliveredCount,
      results
    })
  } catch (error: any) {
    console.error('Error updating tracking:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tracking', message: error.message },
      { status: 500 }
    )
  }
}
