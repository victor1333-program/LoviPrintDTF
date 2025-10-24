import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { renderEmailTemplate } from './template-service'
import { EmailTemplateType } from '@prisma/client'
import { emailLogger } from '@/lib/logger'

/**
 * Formatea el nombre del cliente para que se muestre correctamente
 * Si el nombre es un email, extrae la parte antes del @ y la capitaliza
 * Si el nombre ya es un nombre propio, lo devuelve tal cual
 */
function formatCustomerName(name: string): string {
  if (!name) return 'Cliente'

  // Verificar si es un email (contiene @)
  if (name.includes('@')) {
    // Extraer la parte antes del @
    const username = name.split('@')[0]

    // Separar por puntos, guiones o guiones bajos
    const parts = username.split(/[._-]/)

    // Capitalizar cada parte
    const formatted = parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')

    return formatted
  }

  // Si no es un email, devolverlo tal cual (ya es un nombre)
  return name
}

// Cache para configuraciones
let settingsCache: Record<string, string> = {}
let cacheTime = 0
const CACHE_DURATION = 60000 // 1 minuto

// Obtener configuración de email (prioriza base de datos sobre env)
async function getEmailConfig() {
  const now = Date.now()

  // Si el cache es reciente, usarlo
  if (now - cacheTime < CACHE_DURATION && Object.keys(settingsCache).length > 0) {
    return settingsCache
  }

  // Intentar cargar desde base de datos
  try {
    const settings = await prisma.setting.findMany({
      where: { category: 'email' },
    })

    const config: Record<string, string> = {}
    settings.forEach((s) => {
      config[s.key] = s.value
    })

    // Si hay configuración en DB, actualizar cache
    if (Object.keys(config).length > 0) {
      settingsCache = config
      cacheTime = now
      return config
    }
  } catch (error) {
    emailLogger.info('No se pudo cargar configuración de email desde DB, usando .env')
  }

  // Fallback a variables de entorno
  return {
    smtp_host: process.env.SMTP_HOST || '',
    smtp_port: process.env.SMTP_PORT || '587',
    smtp_secure: process.env.SMTP_SECURE || 'false',
    smtp_user: process.env.SMTP_USER || '',
    smtp_password: process.env.SMTP_PASS || '',
    smtp_from_name: process.env.SMTP_FROM?.split('<')[0]?.trim()?.replace(/"/g, '') || 'DTF Print Services',
    smtp_from_email: process.env.SMTP_FROM?.match(/<(.+)>/)?.[1] || 'noreply@dtfprint.com',
  }
}

// Configuración del transportador de email
async function createTransporter() {
  const config = await getEmailConfig()

  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment && !config.smtp_host) {
    // Usar configuración de prueba para desarrollo
    emailLogger.warn('Usando modo de desarrollo para emails. Los emails no se enviarán realmente.')
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.smtp_user || 'test@ethereal.email',
        pass: config.smtp_password || 'testpass',
      },
    })
  }

  return nodemailer.createTransport({
    host: config.smtp_host,
    port: parseInt(config.smtp_port || '587'),
    secure: config.smtp_secure === 'true',
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
  })
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await getEmailConfig()
    const transporter = await createTransporter()

    const fromName = config.smtp_from_name || 'DTF Print Services'
    const fromEmail = config.smtp_from_email || 'noreply@dtfprint.com'
    const from = `"${fromName}" <${fromEmail}>`

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback a texto plano
    })

    emailLogger.info(`Email enviado: ${info.messageId}`)

    // En desarrollo con Ethereal, mostrar preview URL
    if (process.env.NODE_ENV === 'development' && !config.smtp_host) {
      emailLogger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }

    return true
  } catch (error) {
    emailLogger.error('Error al enviar email', error)
    return false
  }
}

// Funciones helper para enviar emails específicos
export async function sendOrderCreatedEmail(
  customerEmail: string,
  orderData: {
    orderNumber: string
    customerName: string
    totalPrice: number
    subtotal?: number
    taxAmount?: number
    shippingCost?: number
    discountAmount?: number
    customerPhone?: string
    notes?: string
    items: Array<{ productName: string; quantity: number; subtotal: number; unitPrice?: number }>
  }
) {
  // Intentar usar plantilla de BD primero
  const templateData = {
    customerName: orderData.customerName,
    orderNumber: orderData.orderNumber,
    totalPrice: orderData.totalPrice.toFixed(2),
    subtotal: (orderData.subtotal || orderData.totalPrice).toFixed(2),
    taxAmount: (orderData.taxAmount || 0).toFixed(2),
    shippingCost: (orderData.shippingCost || 0).toFixed(2),
    discountAmount: (orderData.discountAmount || 0).toFixed(2),
    customerEmail,
    customerPhone: orderData.customerPhone || '',
    notes: orderData.notes || '',
    items: orderData.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity.toString(),
      unitPrice: (item.unitPrice || 0).toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
  }

  const template = await renderEmailTemplate('ORDER_CREATED' as EmailTemplateType, templateData)

  if (template) {
    return sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Fallback a plantilla hardcoded
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
          .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .total { font-size: 1.2em; font-weight: bold; color: #667eea; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Pedido Confirmado! 🎉</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${formatCustomerName(orderData.customerName)}</strong>,</p>
            <p>Hemos recibido tu pedido correctamente. Aquí están los detalles:</p>

            <div class="order-info">
              <p><strong>Número de pedido:</strong> ${orderData.orderNumber}</p>

              <h3>Productos:</h3>
              ${orderData.items.map(item => `
                <div class="item">
                  <p><strong>${item.productName}</strong></p>
                  <p>Cantidad: ${item.quantity} - Subtotal: ${item.subtotal.toFixed(2)}€</p>
                </div>
              `).join('')}

              <p class="total">Total: ${orderData.totalPrice.toFixed(2)}€</p>
            </div>

            <p>Te mantendremos informado sobre el estado de tu pedido.</p>
            <p>Gracias por confiar en nosotros! 🙏</p>
          </div>
          <div class="footer">
            <p>DTF Print Services - Impresión profesional de calidad</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: customerEmail,
    subject: `Pedido confirmado - ${orderData.orderNumber}`,
    html,
  })
}

export async function sendOrderStatusEmail(
  customerEmail: string,
  orderData: {
    orderNumber: string
    customerName: string
    status: string
    statusLabel: string
  }
) {
  // Intentar usar plantilla de BD primero
  const statusEmoji: Record<string, string> = {
    PENDING: '⏳',
    CONFIRMED: '✅',
    IN_PRODUCTION: '🏭',
    READY: '📦',
    SHIPPED: '🚚',
    DELIVERED: '✅',
    CANCELLED: '❌',
  }

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    IN_PRODUCTION: '#f59e0b',
    READY: '#8b5cf6',
    SHIPPED: '#10b981',
    DELIVERED: '#22c55e',
    CANCELLED: '#ef4444',
  }

  const templateData = {
    customerName: orderData.customerName,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    statusLabel: orderData.statusLabel,
    statusEmoji: statusEmoji[orderData.status] || '📧',
    statusColor: statusColors[orderData.status] || '#667eea',
  }

  const template = await renderEmailTemplate('ORDER_STATUS_CHANGE' as EmailTemplateType, templateData)

  if (template) {
    return sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Fallback a plantilla hardcoded
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
          .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .status { font-size: 2em; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Actualización de Pedido ${statusEmoji[orderData.status]}</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${formatCustomerName(orderData.customerName)}</strong>,</p>
            <p>Tu pedido <strong>${orderData.orderNumber}</strong> ha cambiado de estado:</p>

            <div class="status-box">
              <div class="status">${statusEmoji[orderData.status]}</div>
              <h2>${orderData.statusLabel}</h2>
            </div>

            <p>Gracias por tu paciencia! 🙏</p>
          </div>
          <div class="footer">
            <p>DTF Print Services - Impresión profesional de calidad</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: customerEmail,
    subject: `Actualización de pedido ${orderData.orderNumber} - ${orderData.statusLabel}`,
    html,
  })
}

export async function sendOrderShippedEmail(
  customerEmail: string,
  orderData: {
    orderNumber: string
    customerName: string
    trackingNumber?: string
    trackingUrl?: string
    estimatedDelivery?: Date
    carrier?: string
  }
) {
  // Intentar usar plantilla de BD primero
  const templateData = {
    customerName: orderData.customerName,
    orderNumber: orderData.orderNumber,
    trackingNumber: orderData.trackingNumber || '',
    trackingUrl: orderData.trackingUrl || '',
    carrier: orderData.carrier || 'Correos',
    estimatedDelivery: orderData.estimatedDelivery
      ? new Date(orderData.estimatedDelivery).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '',
  }

  const template = await renderEmailTemplate('ORDER_SHIPPED' as EmailTemplateType, templateData)

  if (template) {
    return sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Fallback a plantilla hardcoded con diseño moderno
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Enviado - LoviPrintDTF</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 10px;">🚚</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">¡Tu Pedido Está en Camino!</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Pedido #${orderData.orderNumber}</p>
                </td>
              </tr>

              <!-- Contenido Principal -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.5;">
                    Hola <strong>${formatCustomerName(orderData.customerName)}</strong>,
                  </p>
                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                    ¡Buenas noticias! Tu pedido ha sido enviado y está en camino hacia ti. ${orderData.carrier ? `Lo enviaremos a través de <strong>${orderData.carrier}</strong>.` : ''}
                  </p>

                  ${orderData.trackingNumber ? `
                  <!-- Seguimiento -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center" style="padding: 35px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        <p style="margin: 0 0 10px; color: #d1fae5; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                          📍 Número de Seguimiento
                        </p>
                        <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                          ${orderData.trackingNumber}
                        </h2>
                        ${orderData.trackingUrl ? `
                        <a href="${orderData.trackingUrl}"
                           style="display: inline-block; padding: 12px 30px; background-color: #ffffff; color: #059669; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                          🔍 Seguir mi Pedido
                        </a>
                        ` : ''}
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  ${orderData.estimatedDelivery ? `
                  <!-- Info de entrega -->
                  <div style="margin: 25px 0; padding: 20px; background: linear-gradient(to right, #dbeafe, #bfdbfe); border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.7;">
                      <strong>📅 Entrega estimada:</strong> ${new Date(orderData.estimatedDelivery).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  ` : ''}

                  ${orderData.trackingUrl ? `
                  <div style="margin: 25px 0; padding: 20px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.7;">
                      <strong>💡 Seguimiento en Tiempo Real:</strong> Haz clic en el botón de arriba para ver el estado actualizado de tu envío.
                    </p>
                  </div>
                  ` : ''}

                  <!-- Tips de recepción -->
                  <div style="margin: 30px 0; padding: 25px; background: linear-gradient(to right, #fef3c7, #fde68a); border-radius: 12px; border-left: 5px solid #f59e0b;">
                    <h3 style="margin: 0 0 15px; color: #92400e; font-size: 16px; font-weight: 700;">
                      📦 Consejos para la Recepción
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                      <li>Asegúrate de que haya alguien disponible para recibir el paquete</li>
                      <li>Ten a mano un documento de identidad para la entrega</li>
                      <li>Verifica el paquete antes de firmar la recepción</li>
                      <li>Si hay algún problema con el envío, contáctanos inmediatamente</li>
                    </ul>
                  </div>

                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.7; text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                    ¿Tienes alguna pregunta sobre tu envío?<br>
                    <a href="mailto:info@loviprintdtf.es" style="color: #10b981; text-decoration: none; font-weight: 600;">Contáctanos</a> y te ayudaremos encantados.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} LoviPrintDTF. Todos los derechos reservados.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    <a href="https://www.loviprintdtf.es" style="color: #10b981; text-decoration: none; font-weight: 600;">www.loviprintdtf.es</a>
                    •
                    <a href="mailto:info@loviprintdtf.es" style="color: #10b981; text-decoration: none;">info@loviprintdtf.es</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return sendEmail({
    to: customerEmail,
    subject: `Tu pedido ${orderData.orderNumber} ha sido enviado 🚚`,
    html,
  })
}

export async function sendOrderDeliveredEmail(
  customerEmail: string,
  orderData: {
    orderNumber: string
    customerName: string
    deliveredAt?: Date
  }
) {
  // Intentar usar plantilla de BD primero
  const templateData = {
    customerName: orderData.customerName,
    orderNumber: orderData.orderNumber,
    deliveredAt: orderData.deliveredAt
      ? new Date(orderData.deliveredAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleDateString('es-ES'),
  }

  const template = await renderEmailTemplate('ORDER_DELIVERED' as EmailTemplateType, templateData)

  if (template) {
    return sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Fallback a plantilla hardcoded
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
            <h1>¡Pedido Entregado! ✅</h1>
          </div>
          <div class="content">
            <div class="success-icon">🎉</div>
            <p>Hola <strong>${formatCustomerName(orderData.customerName)}</strong>,</p>
            <p>Tu pedido <strong>${orderData.orderNumber}</strong> ha sido entregado correctamente.</p>
            <p>Esperamos que disfrutes de tu compra!</p>
            <p>Si tienes alguna pregunta o problema, no dudes en contactarnos.</p>
            <p>Gracias por confiar en nosotros! 🙏</p>
          </div>
          <div class="footer">
            <p>DTF Print Services - Impresión profesional de calidad</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: customerEmail,
    subject: `Pedido ${orderData.orderNumber} entregado ✅`,
    html,
  })
}

export async function sendVoucherExpirationEmail(
  customerEmail: string,
  voucherData: {
    customerName: string
    voucherName: string
    voucherCode: string
    expiresAt: Date
    remainingMeters: number
    remainingShipments: number
  }
) {
  const daysRemaining = Math.ceil((voucherData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // Intentar usar plantilla de BD primero
  const templateData = {
    customerName: voucherData.customerName,
    voucherCode: voucherData.voucherCode,
    voucherName: voucherData.voucherName,
    remainingMeters: voucherData.remainingMeters.toString(),
    remainingShipments: voucherData.remainingShipments.toString(),
    expiresAt: voucherData.expiresAt.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    daysRemaining: daysRemaining.toString(),
  }

  const template = await renderEmailTemplate('VOUCHER_EXPIRING' as EmailTemplateType, templateData)

  if (template) {
    return sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Fallback a plantilla hardcoded
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .voucher-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Tu bono está a punto de caducar</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${formatCustomerName(voucherData.customerName)}</strong>,</p>

            <div class="warning-box">
              <p><strong>¡Atención!</strong> Tu bono <strong>${voucherData.voucherName}</strong> caduca en <strong>${daysRemaining} días</strong>.</p>
            </div>

            <div class="voucher-info">
              <p><strong>Código del bono:</strong> ${voucherData.voucherCode}</p>
              <p><strong>Fecha de caducidad:</strong> ${voucherData.expiresAt.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Metros restantes:</strong> ${voucherData.remainingMeters}m</p>
              <p><strong>Envíos restantes:</strong> ${voucherData.remainingShipments}</p>
            </div>

            <p>No pierdas la oportunidad de usar tu bono antes de que caduque!</p>
            <p>¡Aprovéchalo ahora! 🚀</p>
          </div>
          <div class="footer">
            <p>DTF Print Services - Impresión profesional de calidad</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: customerEmail,
    subject: `⚠️ Tu bono ${voucherData.voucherName} caduca en ${daysRemaining} días`,
    html,
  })
}
