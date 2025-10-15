import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, orderNumber, amount, customerEmail, lineItems } = body

    if (!orderId || !orderNumber || !amount || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const origin = req.headers.get('origin') || 'http://localhost:3001'

    const result = await createCheckoutSession({
      orderId,
      orderNumber,
      amount,
      customerEmail,
      successUrl: `${origin}/pago/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/carrito?cancelled=true`,
      lineItems: lineItems || [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Pedido #${orderNumber}`,
            description: 'Impresión DTF',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
    })
  } catch (error) {
    console.error('Error in checkout route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
