import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Requiere autenticación de admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Enviar email de prueba
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 4em; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email de Prueba</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <h2 style="text-align: center; color: #667eea;">¡Configuración Exitosa!</h2>
              <p style="text-align: center; font-size: 16px;">
                Si estás viendo este email, significa que tu configuración SMTP está funcionando correctamente.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Sistema:</strong> DTF Print Services</p>
                <p style="margin: 10px 0 0 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                <p style="margin: 10px 0 0 0;"><strong>Tipo:</strong> Email de Prueba</p>
              </div>
              <p style="text-align: center; color: #666; margin-top: 30px;">
                Ahora puedes recibir notificaciones automáticas de pedidos y bonos.
              </p>
            </div>
            <div class="footer">
              <p>DTF Print Services - Sistema de Notificaciones</p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await sendEmail({
      to: email,
      subject: '✅ Prueba de Configuración SMTP - DTF Print Services',
      html,
    })

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Email de prueba enviado correctamente',
      })
    } else {
      return NextResponse.json(
        { error: 'Error al enviar email. Verifica la configuración SMTP.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}
