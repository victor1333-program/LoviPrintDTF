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

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe no está configurado' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    })

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Falta el ID del pedido' },
        { status: 400 }
      )
    }

    // Obtener el pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        stripePaymentId: true,
        paymentStatus: true,
        status: true,
        totalPrice: true,
        userId: true,
        orderNumber: true,
        customerEmail: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Si ya está pagado, devolver el estado
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        paid: true,
        order: {
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
      })
    }

    // Si no tiene stripePaymentId, no podemos verificar
    if (!order.stripePaymentId) {
      return NextResponse.json({
        success: true,
        paid: false,
        order: {
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
      })
    }

    // Verificar el estado de la sesión de Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripePaymentId)

      console.log('[Verify Payment] Session status:', session.payment_status)
      console.log('[Verify Payment] Session ID:', session.id)

      // Si el pago está completado, actualizar el pedido
      if (session.payment_status === 'paid') {
        // VINCULACIÓN AUTOMÁTICA: Si el pedido no tiene userId, buscar usuario por email
        let updatedUserId = order.userId
        if (!order.userId && order.customerEmail) {
          console.log(`[Verify Payment] Pedido sin usuario, buscando por email: ${order.customerEmail}`)

          const matchingUser = await prisma.user.findUnique({
            where: { email: order.customerEmail },
            select: { id: true, email: true, name: true },
          })

          if (matchingUser) {
            console.log(`[Verify Payment] Usuario encontrado: ${matchingUser.name} (${matchingUser.id})`)
            updatedUserId = matchingUser.id
          } else {
            console.log(`[Verify Payment] No se encontró usuario con email: ${order.customerEmail}`)
          }
        }

        // Actualizar el estado del pedido (y vincular usuario si se encontró)
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            ...(updatedUserId && !order.userId ? { userId: updatedUserId } : {}),
          },
        })

        // Crear historial
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'CONFIRMED',
            notes: 'Pago confirmado vía verificación directa con Stripe',
          },
        })

        // Si el pedido tiene un userId (original o recién vinculado), otorgar puntos de fidelidad
        if (updatedUserId) {
          const { awardLoyaltyPointsForOrder } = await import('@/lib/loyalty')

          // Otorgar puntos usando la función compartida
          const { pointsEarned } = await awardLoyaltyPointsForOrder(
            prisma,
            updatedUserId,
            order.id,
            order.orderNumber,
            parseFloat(order.totalPrice.toString()),
            false // verify-payment no detecta si es voucher, solo webhook
          )

          console.log(`[Verify Payment] Awarded ${pointsEarned} points to user for order ${order.orderNumber}`)
        }

        console.log(`[Verify Payment] Payment confirmed for order ${order.orderNumber}`)

        return NextResponse.json({
          success: true,
          paid: true,
          order: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
          },
        })
      }

      // Si no está pagado, devolver el estado actual
      return NextResponse.json({
        success: true,
        paid: false,
        order: {
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
      })
    } catch (stripeError: any) {
      console.error('[Verify Payment] Error retrieving session:', stripeError)

      // Si no podemos verificar con Stripe, devolver el estado actual del pedido
      return NextResponse.json({
        success: true,
        paid: false,
        order: {
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
      })
    }
  } catch (error) {
    console.error('[Verify Payment] Error:', error)
    return NextResponse.json(
      { error: 'Error al verificar el pago' },
      { status: 500 }
    )
  }
}
