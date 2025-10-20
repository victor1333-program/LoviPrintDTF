import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface EmailConfig {
  host: string
  port: number
  user: string
  password: string
  fromName: string
  fromEmail: string
}

let cachedConfig: EmailConfig | null = null
let configLastFetched = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

async function getEmailConfig(): Promise<EmailConfig | null> {
  const now = Date.now()

  // Usar cache si no ha expirado
  if (cachedConfig && (now - configLastFetched) < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'email',
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_name', 'smtp_from_email']
        }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    // Verificar que tenemos toda la configuración necesaria
    if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
      console.warn('Email configuration incomplete')
      return null
    }

    cachedConfig = {
      host: config.smtp_host,
      port: parseInt(config.smtp_port || '587'),
      user: config.smtp_user,
      password: config.smtp_password,
      fromName: config.smtp_from_name || 'LoviPrintDTF',
      fromEmail: config.smtp_from_email || 'info@loviprintdtf.es',
    }

    configLastFetched = now
    return cachedConfig
  } catch (error) {
    console.error('Error fetching email config:', error)
    return null
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const config = await getEmailConfig()

    if (!config) {
      console.error('Email not sent: Configuration missing')
      return { success: false, error: 'Email configuration incomplete' }
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true para 465, false para otros puertos
      auth: {
        user: config.user,
        pass: config.password,
      },
    })

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback a HTML sin tags
      html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendOrderConfirmationEmail(order: any) {
  const html = generateOrderConfirmationHTML(order)

  await sendEmail({
    to: order.customerEmail,
    subject: `Confirmación de Pedido #${order.orderNumber} - LoviPrintDTF`,
    html,
  })
}

export async function sendOrderStatusUpdateEmail(order: any, newStatus: string) {
  const html = generateOrderStatusUpdateHTML(order, newStatus)

  await sendEmail({
    to: order.customerEmail,
    subject: `Actualización de Pedido #${order.orderNumber} - LoviPrintDTF`,
    html,
  })
}

export async function sendAdminOrderNotification(order: any) {
  try {
    const adminEmailSetting = await prisma.setting.findUnique({
      where: { key: 'admin_notification_email' }
    })

    const adminEmail = adminEmailSetting?.value || 'info@loviprintdtf.es'

    const html = generateAdminOrderNotificationHTML(order)

    await sendEmail({
      to: adminEmail,
      subject: `Nuevo Pedido #${order.orderNumber} - LoviPrintDTF`,
      html,
    })
  } catch (error) {
    console.error('Error sending admin notification:', error)
  }
}

// Templates HTML para emails
function generateOrderConfirmationHTML(order: any): string {
  const itemsHTML = order.items?.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.productName}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity} ${item.product?.unit || 'ud'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${parseFloat(item.unitPrice).toFixed(2)}€
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
        ${parseFloat(item.subtotal).toFixed(2)}€
      </td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Pedido</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://www.loviprintdtf.es/logo.png" alt="LoviPrintDTF" style="max-width: 200px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1);" />
        <h1 style="color: white; margin: 0; font-size: 28px;">¡Pedido Confirmado!</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola <strong>${order.customerName}</strong>,
        </p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Hemos recibido tu pedido <strong>#${order.orderNumber}</strong> correctamente y ya estamos trabajando en él.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #667eea; margin-top: 0;">Detalles del Pedido</h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #667eea;">Producto</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #667eea;">Cantidad</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #667eea;">Precio</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #667eea;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea;">
            <table style="width: 100%;">
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Subtotal:</strong></td>
                <td style="text-align: right; padding: 5px; width: 100px;">${parseFloat(order.subtotal).toFixed(2)}€</td>
              </tr>
              ${order.discountAmount > 0 ? `
              <tr>
                <td style="text-align: right; padding: 5px; color: #22c55e;"><strong>Descuento:</strong></td>
                <td style="text-align: right; padding: 5px; color: #22c55e;">-${parseFloat(order.discountAmount).toFixed(2)}€</td>
              </tr>
              ` : ''}
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>IVA:</strong></td>
                <td style="text-align: right; padding: 5px;">${parseFloat(order.taxAmount).toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 5px;"><strong>Envío:</strong></td>
                <td style="text-align: right; padding: 5px;">${parseFloat(order.shippingCost).toFixed(2)}€</td>
              </tr>
              <tr style="font-size: 18px; color: #667eea;">
                <td style="text-align: right; padding: 10px 5px; border-top: 2px solid #667eea;"><strong>TOTAL:</strong></td>
                <td style="text-align: right; padding: 10px 5px; border-top: 2px solid #667eea;"><strong>${parseFloat(order.totalPrice).toFixed(2)}€</strong></td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            <strong>Tiempo de entrega:</strong> 24-48 horas laborables
          </p>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Recibirás un email cuando tu pedido cambie de estado. Si tienes alguna pregunta, no dudes en contactarnos.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 14px; color: #999;">
            © ${new Date().getFullYear()} LoviPrintDTF. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateOrderStatusUpdateHTML(order: any, newStatus: string): string {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    CONFIRMED: {
      title: 'Pedido Confirmado',
      message: 'Tu pedido ha sido confirmado y pronto comenzaremos con la producción.',
      color: '#3b82f6'
    },
    IN_PRODUCTION: {
      title: 'En Producción',
      message: 'Estamos imprimiendo tus diseños con la máxima calidad.',
      color: '#f59e0b'
    },
    READY: {
      title: 'Listo para Envío',
      message: 'Tu pedido está listo y será enviado en breve.',
      color: '#8b5cf6'
    },
    SHIPPED: {
      title: 'Enviado',
      message: 'Tu pedido está en camino. Recibirás información de seguimiento pronto.',
      color: '#10b981'
    },
    DELIVERED: {
      title: 'Entregado',
      message: '¡Tu pedido ha sido entregado! Esperamos que disfrutes de nuestros productos.',
      color: '#22c55e'
    },
    CANCELLED: {
      title: 'Cancelado',
      message: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
      color: '#ef4444'
    },
  }

  const status = statusMessages[newStatus] || {
    title: 'Actualización',
    message: 'El estado de tu pedido ha cambiado.',
    color: '#667eea'
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Actualización de Pedido</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${status.color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://www.loviprintdtf.es/logo.png" alt="LoviPrintDTF" style="max-width: 200px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1);" />
        <h1 style="color: white; margin: 0; font-size: 28px;">${status.title}</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola <strong>${order.customerName}</strong>,
        </p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          ${status.message}
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${status.color};">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Número de pedido:</strong> #${order.orderNumber}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            <strong>Estado actual:</strong> <span style="color: ${status.color}; font-weight: bold;">${status.title}</span>
          </p>
          ${order.trackingNumber ? `
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            <strong>Número de seguimiento:</strong> ${order.trackingNumber}
          </p>
          ` : ''}
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 14px; color: #999;">
            © ${new Date().getFullYear()} LoviPrintDTF. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAdminOrderNotificationHTML(order: any): string {
  const itemsHTML = order.items?.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.productName}
        ${item.fileName ? `<br><small style="color: #666;">Archivo: ${item.fileName}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity} ${item.product?.unit || 'ud'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
        ${parseFloat(item.subtotal).toFixed(2)}€
      </td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuevo Pedido</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1f2937; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://www.loviprintdtf.es/logo.png" alt="LoviPrintDTF" style="max-width: 200px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1);" />
        <h1 style="color: white; margin: 0;">Nuevo Pedido Recibido</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px;">
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>Pedido #${order.orderNumber}</strong> - Total: <strong>${parseFloat(order.totalPrice).toFixed(2)}€</strong>
          </p>
        </div>

        <h2 style="color: #1f2937; margin-top: 0;">Información del Cliente</h2>
        <p><strong>Nombre:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        ${order.customerPhone ? `<p><strong>Teléfono:</strong> ${order.customerPhone}</p>` : ''}

        <h2 style="color: #1f2937; margin-top: 30px;">Artículos del Pedido</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #e5e7eb;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: center;">Cantidad</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="text-align: right; padding: 20px; background: white; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> ${parseFloat(order.subtotal).toFixed(2)}€</p>
          ${order.discountAmount > 0 ? `<p style="margin: 5px 0; color: #22c55e;"><strong>Descuento:</strong> -${parseFloat(order.discountAmount).toFixed(2)}€</p>` : ''}
          <p style="margin: 5px 0;"><strong>IVA:</strong> ${parseFloat(order.taxAmount).toFixed(2)}€</p>
          <p style="margin: 5px 0;"><strong>Envío:</strong> ${parseFloat(order.shippingCost).toFixed(2)}€</p>
          <p style="margin: 10px 0 0 0; font-size: 18px; color: #667eea; border-top: 2px solid #667eea; padding-top: 10px;">
            <strong>TOTAL:</strong> ${parseFloat(order.totalPrice).toFixed(2)}€
          </p>
        </div>

        ${order.notes ? `
        <div style="background: white; padding: 15px; margin-top: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #1f2937;">Notas del Cliente:</h3>
          <p style="margin: 0;">${order.notes}</p>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
}
