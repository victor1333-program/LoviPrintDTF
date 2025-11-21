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

    // Obtener el pedido con su información de envío, método de envío e items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        shipment: true,
        shippingMethod: true,
        items: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Detectar si es recogida local
    const isLocalPickup = order.shippingMethod?.name?.toLowerCase().includes('recogida')

    // Si es recogida local, marcar como READY y enviar email específico
    if (isLocalPickup) {
      // Actualizar estado del pedido a READY (listo para recoger)
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'READY',
          statusHistory: {
            create: {
              status: 'READY',
              notes: 'Pedido impreso - Listo para recoger en tienda',
              createdBy: session.user.email || undefined
            }
          }
        }
      })

      // Formatear items para el email
      const orderItemsHtml = order.items.map(item => {
        return `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.productName} x ${item.quantity} - ${Number(item.subtotal).toFixed(2)}€</li>`
      }).join('')

      // Enviar email de "Pedido Listo para Recoger" usando la plantilla
      try {
        // Obtener plantilla de la base de datos
        const template = await prisma.emailTemplate.findFirst({
          where: {
            type: 'ORDER_READY_FOR_PICKUP',
            isActive: true
          }
        })

        if (template) {
          // Importar función de reemplazo de variables
          const { replaceVariables } = await import('@/types/email-templates')

          // Preparar variables para el email
          const variables = {
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            orderItems: `<ul style="list-style: none; padding: 0; margin: 0;">${orderItemsHtml}</ul>`,
            totalPrice: Number(order.totalPrice).toFixed(2)
          }

          // Reemplazar variables en el contenido
          const processedSubject = replaceVariables(template.subject, variables)
          const processedHtml = replaceVariables(template.htmlContent, variables)

          // Enviar email
          await sendEmail({
            to: order.customerEmail,
            subject: processedSubject,
            html: processedHtml
          })
        } else {
          // Fallback si no existe la plantilla
          await sendEmail({
            to: order.customerEmail,
            subject: `Tu pedido ${order.orderNumber} está listo para recoger`,
            html: `
              <h2>¡Tu pedido está listo!</h2>
              <p>Hola ${order.customerName},</p>
              <p>Tu pedido <strong>${order.orderNumber}</strong> ya está listo para recoger en nuestra tienda.</p>
              <p><strong>Dirección:</strong><br>
              Lovilike - Hellín<br>
              Calle Antonio Lopez del Oro, 7<br>
              02400 Hellín, Albacete</p>
              <p><a href="https://maps.app.goo.gl/VZ7n3FCfmJKZKQUq7">Ver en Google Maps</a></p>
            `
          })
        }
      } catch (emailError) {
        console.error('Error enviando email de recogida:', emailError)
        // No fallar si el email falla
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        isLocalPickup: true
      })
    }

    // Flujo normal para envíos con GLS
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
