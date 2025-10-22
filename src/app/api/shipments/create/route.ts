import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GLSService } from '@/lib/services/gls-service'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID requerido' }, { status: 400 })
    }

    // Obtener el pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verificar que el pedido tenga dirección de envío
    if (!order.shippingAddress) {
      return NextResponse.json({
        error: 'El pedido no tiene dirección de envío'
      }, { status: 400 })
    }

    // Verificar si ya existe un envío
    if (order.shipment) {
      return NextResponse.json({
        error: 'Este pedido ya tiene un envío creado'
      }, { status: 400 })
    }

    const address = order.shippingAddress as any

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      return NextResponse.json({
        error: 'GLS no está configurado. Ve a Configuración > Envíos para configurar GLS'
      }, { status: 400 })
    }

    const glsService = new GLSService(glsConfig)

    // Normalizar código de país a formato ISO de 2 letras
    const normalizeCountryCode = (country: string | undefined): string => {
      if (!country) return 'ES'
      const countryUpper = country.toUpperCase()
      // Si ya es un código de 2 letras, devolverlo
      if (countryUpper.length === 2) return countryUpper
      // Mapeo de nombres comunes a códigos
      const countryMap: { [key: string]: string } = {
        'ESPAÑA': 'ES',
        'SPAIN': 'ES',
        'PORTUGAL': 'PT',
        'FRANCIA': 'FR',
        'FRANCE': 'FR',
        'ITALIA': 'IT',
        'ITALY': 'IT',
        'ALEMANIA': 'DE',
        'GERMANY': 'DE'
      }
      return countryMap[countryUpper] || 'ES'
    }

    // Crear envío en GLS
    const glsResponse = await glsService.createShipment({
      orderId: order.id,
      recipientName: order.customerName,
      recipientAddress: address.street || address.address || '',
      recipientCity: address.city || '',
      recipientPostal: address.postalCode || address.zipCode || '',
      recipientCountry: normalizeCountryCode(address.country),
      recipientPhone: order.customerPhone || undefined,
      recipientEmail: order.customerEmail,
      weight: 1.0,
      packages: 1,
      notes: order.notes || undefined
    })

    // Crear registro de envío en la base de datos
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        glsReference: glsResponse.reference,
        trackingNumber: glsResponse.trackingNumber,
        status: 'CREATED',
        carrier: 'GLS',
        recipientName: order.customerName,
        recipientAddress: address.street || address.address || '',
        recipientCity: address.city || '',
        recipientPostal: address.postalCode || address.zipCode || '',
        recipientCountry: normalizeCountryCode(address.country),
        recipientPhone: order.customerPhone || undefined,
        recipientEmail: order.customerEmail,
        weight: 1.0,
        packages: 1,
        glsResponse: glsResponse as any
      }
    })

    // Actualizar el pedido con el número de seguimiento
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: glsResponse.trackingNumber,
        status: 'SHIPPED'
      }
    })

    return NextResponse.json({
      success: true,
      shipment,
      message: 'Envío creado exitosamente en GLS'
    })

  } catch (error: any) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({
      error: error.message || 'Error al crear el envío'
    }, { status: 500 })
  }
}
