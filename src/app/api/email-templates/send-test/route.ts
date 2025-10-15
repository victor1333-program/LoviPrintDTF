import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendEmail } from '@/lib/email/email-service'
import { replaceVariables } from '@/types/email-templates'

// POST /api/email-templates/send-test - Enviar email de prueba
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, htmlContent, data } = body

    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Reemplazar variables en el asunto y contenido
    const processedSubject = replaceVariables(subject, data || {})
    const processedHtml = replaceVariables(htmlContent, data || {})

    // Enviar email
    const success = await sendEmail({
      to,
      subject: `[TEST] ${processedSubject}`,
      html: processedHtml,
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Error al enviar email de prueba' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email de prueba' },
      { status: 500 }
    )
  }
}
