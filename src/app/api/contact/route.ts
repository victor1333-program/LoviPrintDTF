import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

// Mapeo de asuntos para el email
const subjectMap: Record<string, string> = {
  presupuesto: 'Solicitud de Presupuesto',
  pedido: 'Consulta sobre Pedido',
  bonos: 'Información sobre Bonos',
  tecnico: 'Consulta Técnica',
  otro: 'Consulta General'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validaciones básicas
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email no válido' },
        { status: 400 }
      )
    }

    // Obtener el email de destino de la configuración
    const contactEmailSetting = await prisma.setting.findFirst({
      where: {
        category: 'general',
        key: 'contact_email'
      }
    })

    // Email de destino (fallback a info@loviprintdtf.es)
    const destinationEmail = contactEmailSetting?.value || 'info@loviprintdtf.es'

    const subjectText = subjectMap[subject] || 'Consulta desde Web'

    // HTML del email para el administrador
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${subjectText}</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
        <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Datos del Cliente</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Nombre:</strong></td>
            <td style="padding: 8px 0; color: #333;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}" style="color: #f97316;">${email}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px 0; color: #333;"><a href="tel:${phone}" style="color: #f97316;">${phone}</a></td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="margin-bottom: 25px;">
        <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Mensaje</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;">
          <p style="color: #333; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="mailto:${email}?subject=Re: ${subjectText}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Responder al Cliente
        </a>
      </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p>Este mensaje fue enviado desde el formulario de contacto de loviprintdtf.es</p>
      <p>Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
    </div>
  </div>
</body>
</html>
`

    // Email de confirmación para el cliente
    const clientEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <img src="https://www.loviprintdtf.es/images/logo.png" alt="LoviPrintDTF" style="height: 50px; margin-bottom: 15px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">¡Hemos recibido tu mensaje!</h1>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Gracias por ponerte en contacto con nosotros. Hemos recibido tu mensaje sobre "<strong>${subjectText}</strong>" y te responderemos en menos de 24 horas.
      </p>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f97316;">
        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 14px;">Tu mensaje:</h3>
        <p style="color: #666; margin: 0; font-style: italic; white-space: pre-wrap;">${message}</p>
      </div>

      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Si necesitas una respuesta urgente, puedes contactarnos por:
      </p>

      <div style="display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap;">
        <a href="https://wa.me/34614051291" style="display: inline-flex; align-items: center; background: #25D366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          WhatsApp
        </a>
        <a href="tel:+34614051291" style="display: inline-flex; align-items: center; background: #333; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          +34 614 051 291
        </a>
      </div>

      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        ¡Gracias por confiar en LoviPrintDTF!
      </p>

      <p style="color: #333; font-size: 16px; margin-top: 30px;">
        Un saludo,<br>
        <strong>El equipo de LoviPrintDTF</strong>
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">
        <a href="https://www.loviprintdtf.es" style="color: #f97316; text-decoration: none;">www.loviprintdtf.es</a>
      </p>
      <p style="margin: 0;">
        Calle Antonio Lopes del Oro 7, Hellín, Albacete
      </p>
    </div>
  </div>
</body>
</html>
`

    // Enviar email al administrador
    const adminResult = await sendEmail({
      to: destinationEmail,
      subject: `[Contacto Web] ${subjectText} - ${name}`,
      html: adminEmailHtml,
      text: `Nuevo mensaje de contacto\n\nNombre: ${name}\nEmail: ${email}\nTeléfono: ${phone || 'No proporcionado'}\nAsunto: ${subjectText}\n\nMensaje:\n${message}`
    })

    if (!adminResult.success) {
      console.error('Error enviando email al admin:', adminResult.error)
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    // Enviar email de confirmación al cliente
    await sendEmail({
      to: email,
      subject: 'Hemos recibido tu mensaje - LoviPrintDTF',
      html: clientEmailHtml,
      text: `Hola ${name},\n\nGracias por ponerte en contacto con nosotros. Hemos recibido tu mensaje sobre "${subjectText}" y te responderemos en menos de 24 horas.\n\nTu mensaje:\n${message}\n\nSi necesitas una respuesta urgente, puedes contactarnos por WhatsApp: https://wa.me/34614051291\n\n¡Gracias por confiar en LoviPrintDTF!\n\nUn saludo,\nEl equipo de LoviPrintDTF`
    })

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente'
    })

  } catch (error) {
    console.error('Error en API de contacto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
