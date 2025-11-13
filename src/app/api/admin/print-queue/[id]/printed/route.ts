import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import {
  normalizeCountryCode,
  getProvinceName,
  formatInternationalMobile,
} from '@/lib/utils/spanish-provinces'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/admin/print-queue/[id]/printed
 * Marcar pedido como impreso (cambiar a SHIPPED + generar etiqueta GLS automáticamente)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener el pedido con su información de envío y método de envío
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        shipment: true,
        shippingMethod: true
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
        const recipientCountryCode = normalizeCountryCode(shippingAddr.country)
        const recipientProvince = getProvinceName(shippingAddr.postalCode || '')

        // Obtener configuración de servicio GLS del método de envío
        const glsServiceCode = order.shippingMethod?.glsServiceCode || '1' // Courier por defecto
        const glsTimeFrame = order.shippingMethod?.glsTimeFrame || '19' // Express 19h por defecto

        // Crear envío en GLS con estructura correcta
        const glsResponse = await glsService.createShipment({
          orderId: order.orderNumber,
          recipientName: order.customerName,
          recipientAddress: shippingAddr.street || '',
          recipientCity: shippingAddr.city || '',
          recipientPostal: shippingAddr.postalCode || '',
          recipientCountry: recipientCountryCode,
          recipientProvince,
          recipientPhone: order.customerPhone || undefined,
          recipientMobile: order.customerPhone
            ? formatInternationalMobile(order.customerPhone, recipientCountryCode)
            : undefined,
          recipientEmail: order.customerEmail,
          weight: 0.5,
          packages: 1,
          notes: `Pedido ${order.orderNumber}`,
          service: glsServiceCode, // Usar servicio configurado
          timeFrame: glsTimeFrame, // Usar franja horaria configurada
          labelFormat: 'PDF', // Solicitar etiqueta PDF directamente
        })

        if (!glsResponse.success) {
          throw new Error(glsResponse.error || 'Error creando envío en GLS')
        }

        // Determinar nombre del servicio según configuración
        let serviceName = 'GLS Courier'
        if (glsServiceCode === '1') {
          if (glsTimeFrame === '3') {
            serviceName = 'GLS Express 14h'
          } else if (glsTimeFrame === '19') {
            serviceName = 'GLS Express 19h'
          } else if (glsTimeFrame === '2') {
            serviceName = 'GLS Express 10h'
          } else {
            serviceName = 'GLS Courier'
          }
        } else if (glsServiceCode === '96') {
          serviceName = 'GLS BusinessParcel'
        } else if (glsServiceCode === '74') {
          serviceName = 'GLS EuroBusinessParcel'
        }

        // Crear registro de envío en la base de datos
        shipmentData = await prisma.shipment.create({
          data: {
            orderId: order.id,
            glsReference: glsResponse.reference,
            trackingNumber: glsResponse.trackingNumber,
            glsUid: glsResponse.uid,
            glsCodexp: glsResponse.codexp,
            labelBase64: glsResponse.labelBase64,
            labelFormat: 'PDF',
            status: 'CREATED',
            carrier: 'GLS',
            serviceName: serviceName,
            recipientName: order.customerName,
            recipientAddress: shippingAddr.street || '',
            recipientCity: shippingAddr.city || '',
            recipientPostal: shippingAddr.postalCode || '',
            recipientCountry: recipientCountryCode,
            recipientProvince,
            recipientPhone: order.customerPhone || undefined,
            recipientEmail: order.customerEmail,
            weight: 0.5,
            packages: 1,
            glsResponse: glsResponse as any,
            lastSyncAt: new Date(),
          }
        })

        // Enviar email al cliente notificando que su pedido ha sido enviado
        try {
          await sendEmail({
            to: order.customerEmail,
            subject: `Tu pedido ${order.orderNumber} ha sido enviado`,
            text: `Hola ${order.customerName},\n\nTu pedido ${order.orderNumber} ha sido enviado con GLS.\n\nNúmero de seguimiento: ${glsResponse.trackingNumber}\n\nPuedes seguir tu pedido desde tu panel de cliente.\n\nGracias por tu compra.`,
            html: `
              <h2>¡Tu pedido ha sido enviado!</h2>
              <p>Hola ${order.customerName},</p>
              <p>Tu pedido <strong>${order.orderNumber}</strong> ha sido enviado con GLS.</p>
              <p><strong>Número de seguimiento:</strong> ${glsResponse.trackingNumber}</p>
              <p>Puedes seguir tu pedido en tiempo real desde tu panel de cliente.</p>
              <p>Gracias por tu compra.</p>
            `,
          })
        } catch (emailError) {
          console.error('Error enviando email de envío:', emailError)
          // No fallar si el email falla
        }
      } catch (error: any) {
        console.error('Error creating GLS shipment:', error)
        return NextResponse.json(
          { error: `Error al crear envío en GLS: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Actualizar estado del pedido a SHIPPED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        trackingNumber: shipmentData.trackingNumber || undefined,
        statusHistory: {
          create: {
            status: 'SHIPPED',
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
