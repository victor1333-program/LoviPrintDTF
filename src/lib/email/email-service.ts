import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { renderEmailTemplate } from './template-service'
import { EmailTemplateType } from '@prisma/client'

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
    console.log('No se pudo cargar configuración de email desde DB, usando .env')
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
    console.log('⚠️  Usando modo de desarrollo para emails. Los emails no se enviarán realmente.')
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

    console.log('✅ Email enviado:', info.messageId)

    // En desarrollo con Ethereal, mostrar preview URL
    if (process.env.NODE_ENV === 'development' && !config.smtp_host) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
    }

    return true
  } catch (error) {
    console.error('❌ Error al enviar email:', error)
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
            <p>Hola <strong>${orderData.customerName}</strong>,</p>
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
            <p>Hola <strong>${orderData.customerName}</strong>,</p>
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
          .tracking-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .tracking-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Tu pedido está en camino! 🚚</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${orderData.customerName}</strong>,</p>
            <p>Buenas noticias! Tu pedido <strong>${orderData.orderNumber}</strong> ha sido enviado.</p>

            <div class="tracking-box">
              ${orderData.trackingNumber ? `
                <p><strong>Número de seguimiento:</strong></p>
                <p style="font-size: 1.2em; color: #667eea; font-weight: bold;">${orderData.trackingNumber}</p>
              ` : ''}

              ${orderData.trackingUrl ? `
                <a href="${orderData.trackingUrl}" class="tracking-button">Rastrear mi pedido</a>
              ` : ''}

              ${orderData.estimatedDelivery ? `
                <p style="margin-top: 20px;"><strong>Entrega estimada:</strong> ${new Date(orderData.estimatedDelivery).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              ` : ''}
            </div>

            <p>Gracias por tu compra! 🎉</p>
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
            <p>Hola <strong>${orderData.customerName}</strong>,</p>
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
            <p>Hola <strong>${voucherData.customerName}</strong>,</p>

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
