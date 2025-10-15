import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  sendOrderCreatedEmail,
  sendOrderStatusEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendVoucherExpirationEmail,
} from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Requiere autenticación de admin para enviar emails manualmente
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { type, data } = body

    let result = false

    switch (type) {
      case 'ORDER_CREATED':
        result = await sendOrderCreatedEmail(data.customerEmail, data)
        break

      case 'ORDER_STATUS':
        result = await sendOrderStatusEmail(data.customerEmail, data)
        break

      case 'ORDER_SHIPPED':
        result = await sendOrderShippedEmail(data.customerEmail, data)
        break

      case 'ORDER_DELIVERED':
        result = await sendOrderDeliveredEmail(data.customerEmail, data)
        break

      case 'VOUCHER_EXPIRATION':
        result = await sendVoucherExpirationEmail(data.customerEmail, data)
        break

      default:
        return NextResponse.json({ error: 'Tipo de notificación inválido' }, { status: 400 })
    }

    if (result) {
      return NextResponse.json({ success: true, message: 'Email enviado correctamente' })
    } else {
      return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
