import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getRateLimitIdentifier, applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'
import { validateRequest } from '@/lib/validations/validate'
import { registerSchema } from '@/lib/validations/schemas'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Aplicar rate limiting para prevenir ataques de fuerza bruta
  const identifier = getRateLimitIdentifier(req)
  const rateLimit = applyRateLimit(identifier, RATE_LIMIT_CONFIGS.auth)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Por favor, intenta más tarde.' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  try {
    // Validar request body
    const validation = await validateRequest(req, registerSchema)
    if (validation.error) {
      return validation.error
    }

    const { email, password } = validation.data

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: email.split('@')[0], // Usar parte del email temporalmente
        phone: '', // Se completará después
        emailVerified: null,
        verificationToken,
        verificationExpires,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Construir URL de verificación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.loviprintdtf.es'
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

    // Enviar email de confirmación
    const emailHtml = generateEmailConfirmationHTML(user.email, verificationUrl)

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Confirma tu cuenta - LoviPrintDTF',
      html: emailHtml,
    })

    if (!emailResult.success) {
      logger.error('Error sending verification email', emailResult.error)
      // No fallar el registro si el email no se envía, pero advertir
      logger.warn('User created but verification email failed to send')
    }

    return NextResponse.json(
      {
        message: 'Usuario creado correctamente. Por favor, revisa tu email para confirmar tu cuenta.',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating user', error)
    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    )
  }
}

function generateEmailConfirmationHTML(email: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirma tu Cuenta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://www.loviprintdtf.es/logo.png" alt="LoviPrintDTF" style="max-width: 200px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1);" />
        <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a LoviPrintDTF!</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola,
        </p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Gracias por registrarte en <strong>LoviPrintDTF</strong>. Para completar tu registro y comenzar a disfrutar de nuestros servicios de impresión DTF, necesitamos que confirmes tu dirección de correo electrónico.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Confirma tu Cuenta
          </a>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
        </p>
        <p style="font-size: 12px; color: #ea580c; word-break: break-all; background: white; padding: 10px; border-radius: 4px; border: 1px solid #fed7aa;">
          ${verificationUrl}
        </p>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Importante:</strong> Este enlace expirará en 24 horas. Si no has solicitado este registro, puedes ignorar este email.
          </p>
        </div>

        <p style="font-size: 16px; margin-top: 30px;">
          Una vez confirmada tu cuenta, podrás:
        </p>
        <ul style="font-size: 14px; color: #666;">
          <li>Completar tu perfil con tus datos de facturación</li>
          <li>Añadir direcciones de envío</li>
          <li>Realizar pedidos de impresión DTF</li>
          <li>Gestionar tus bonos prepagados</li>
          <li>Consultar el estado de tus pedidos</li>
        </ul>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Si tienes alguna pregunta, no dudes en contactarnos en <a href="mailto:info@loviprintdtf.es" style="color: #ea580c;">info@loviprintdtf.es</a>
        </p>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #999;">
            © ${new Date().getFullYear()} LoviPrintDTF. Todos los derechos reservados.
          </p>
          <p style="font-size: 12px; color: #999;">
            Calle Antonio Lopes del Oro 7, Hellín (Albacete)
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
