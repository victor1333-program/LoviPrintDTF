import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || token.length < 16) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { trackingToken: token },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        taxAmount: true,
        shippingCost: true,
        discountAmount: true,
        totalPrice: true,
        shippingAddress: true,
        trackingNumber: true,
        trackingUrl: true,
        estimatedDelivery: true,
        isGuestOrder: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            fileName: true,
          },
        },
        statusHistory: {
          select: {
            status: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: { isGuest: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Enmascarar email en la respuesta (ya viene con el pedido, pero por seguridad)
    const maskedEmail = maskEmail(order.customerEmail)

    return NextResponse.json({
      ...order,
      customerEmail: maskedEmail,
      canClaimAccount: order.user?.isGuest === true,
    })
  } catch (error) {
    logger.error('Error fetching tracking order', error)
    return NextResponse.json(
      { error: 'Error al obtener el pedido' },
      { status: 500 }
    )
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`
}
