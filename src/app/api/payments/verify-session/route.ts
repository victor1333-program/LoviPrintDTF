import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripeInstance } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Obtener instancia de Stripe (lee config de la base de datos)
    const stripe = await getStripeInstance()

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Recuperar la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verificar que el pago fue exitoso
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not completed',
          paymentStatus: session.payment_status
        },
        { status: 400 }
      )
    }

    // Obtener el orderId de los metadatos
    const orderId = session.metadata?.orderId

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID not found in session metadata' },
        { status: 404 }
      )
    }

    // Buscar el pedido en la base de datos
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        status: true,
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
    })

  } catch (error) {
    console.error('Error verifying payment session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
