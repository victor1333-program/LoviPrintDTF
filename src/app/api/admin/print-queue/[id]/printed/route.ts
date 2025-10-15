import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'

/**
 * POST /api/admin/print-queue/[id]/printed
 * Marcar pedido como impreso (cambiar a READY + generar etiqueta GLS automáticamente)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    // Obtener el pedido con su información de envío
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        shipment: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verificar que tenga dirección de envío
    if (!order.shippingAddress || typeof order.shippingAddress !== 'object') {
      return NextResponse.json(
        { error: 'El pedido no tiene dirección de envío configurada' },
        { status: 400 }
      )
    }

    const shippingAddr = order.shippingAddress as any

    // Generar envío en GLS si no existe
    let shipmentData = order.shipment

    if (!shipmentData) {
      // Obtener configuración de GLS
      const glsConfig = await GLSService.getConfig()

      if (!glsConfig) {
        return NextResponse.json(
          { error: 'GLS no está configurado. Configure GLS en ajustes primero.' },
          { status: 400 }
        )
      }

      const glsService = new GLSService(glsConfig)

      try {
        // Crear envío en GLS
        const glsResponse = await glsService.createShipment({
          orderId: order.orderNumber,
          recipientName: order.customerName,
          recipientAddress: shippingAddr.address || '',
          recipientCity: shippingAddr.city || '',
          recipientPostal: shippingAddr.postalCode || '',
          recipientCountry: shippingAddr.country || 'ES',
          recipientPhone: order.customerPhone || undefined,
          recipientEmail: order.customerEmail,
          weight: 0.5, // Peso por defecto
          packages: 1,
          notes: `Pedido ${order.orderNumber}`
        })

        // Obtener etiqueta PDF
        const labelBase64 = await glsService.getLabel(glsResponse.reference)

        // Crear registro de envío en la base de datos
        shipmentData = await prisma.shipment.create({
          data: {
            orderId: order.id,
            glsReference: glsResponse.reference,
            trackingNumber: glsResponse.trackingNumber,
            labelUrl: `data:application/pdf;base64,${labelBase64}`,
            status: 'CREATED',
            recipientName: order.customerName,
            recipientAddress: shippingAddr.address || '',
            recipientCity: shippingAddr.city || '',
            recipientPostal: shippingAddr.postalCode || '',
            recipientCountry: shippingAddr.country || 'ES',
            recipientPhone: order.customerPhone || undefined,
            recipientEmail: order.customerEmail,
            weight: 0.5,
            packages: 1,
            glsResponse: glsResponse as any
          }
        })
      } catch (error: any) {
        console.error('Error creating GLS shipment:', error)
        return NextResponse.json(
          { error: `Error al crear envío en GLS: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Actualizar estado del pedido a READY
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'READY',
        trackingNumber: shipmentData.trackingNumber || undefined,
        statusHistory: {
          create: {
            status: 'READY',
            notes: 'Pedido impreso - Etiqueta GLS generada automáticamente',
            createdBy: session.user.email || undefined
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      shipment: shipmentData
    })
  } catch (error) {
    console.error('Error marking order as printed:', error)
    return NextResponse.json(
      { error: 'Error al marcar el pedido como impreso' },
      { status: 500 }
    )
  }
}
