import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    // Leer configuración de Stripe desde la base de datos
    const [testModeSettings, secretKeyTest, secretKeyLive] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'stripe_test_mode' } }),
      prisma.setting.findUnique({ where: { key: 'stripe_secret_key_test' } }),
      prisma.setting.findUnique({ where: { key: 'stripe_secret_key_live' } }),
    ])

    const isTestMode = testModeSettings?.value === 'true'
    const stripeSecretKey = isTestMode ? secretKeyTest?.value : secretKeyLive?.value

    console.log('[Stripe Debug] Test mode:', isTestMode)
    console.log('[Stripe Debug] Secret key test exists:', !!secretKeyTest?.value)
    console.log('[Stripe Debug] Secret key live exists:', !!secretKeyLive?.value)
    console.log('[Stripe Debug] Using key:', stripeSecretKey ? `${stripeSecretKey.substring(0, 10)}...` : 'NONE')

    // Verificar que Stripe esté configurado
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe no está configurado. Por favor, configura las claves de Stripe en Admin > Configuración > Pagos.' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    const body = await request.json()
    const { orderId, orderNumber } = body

    if (!orderId || !orderNumber) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener el pedido de la base de datos
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Si ya está pagado, no crear nueva sesión
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Este pedido ya ha sido pagado' },
        { status: 400 }
      )
    }

    // Crear líneas de productos para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.productName,
          description: `${item.quantity} ${item.product.unit}`,
        },
        unit_amount: Math.round(parseFloat(item.subtotal.toString()) * 100), // Convertir a céntimos
      },
      quantity: 1,
    }))

    // Añadir envío como línea si existe
    if (parseFloat(order.shippingCost.toString()) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Gastos de envío',
          },
          unit_amount: Math.round(parseFloat(order.shippingCost.toString()) * 100),
        },
        quantity: 1,
      })
    }

    // Añadir IVA como línea
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'IVA (21%)',
        },
        unit_amount: Math.round(parseFloat(order.taxAmount.toString()) * 100),
      },
      quantity: 1,
    })

    // URL base de la aplicación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/pedidos/${orderNumber}?payment=success`,
      cancel_url: `${baseUrl}/pedidos/${orderNumber}?payment=cancelled`,
      customer_email: order.customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    })

    // Guardar el ID de la sesión de Stripe en el pedido
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentId: session.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    )
  }
}
