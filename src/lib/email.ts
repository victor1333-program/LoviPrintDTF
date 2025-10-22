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

export async function sendVoucherPurchaseEmail(order: any, voucher: any) {
  const html = generateVoucherPurchaseHTML(order, voucher)

  await sendEmail({
    to: order.customerEmail,
    subject: `🎁 ${voucher.name} Activado - LoviPrintDTF`,
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
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
        <strong>${item.productName}</strong>
        ${item.fileName ? `<br><span style="color: #6b7280; font-size: 12px;">📎 ${item.fileName}</span>` : ''}
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151; font-size: 14px;">
        ${item.quantity} ${item.product?.unit || 'ud'}
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280; font-size: 14px;">
        ${parseFloat(item.unitPrice).toFixed(2)}€
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-size: 14px; font-weight: 700;">
        ${parseFloat(item.subtotal).toFixed(2)}€
      </td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Pedido - LoviPrintDTF</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">¡Pedido Confirmado!</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Pedido #${order.orderNumber}</p>
                </td>
              </tr>

              <!-- Contenido Principal -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.5;">
                    Hola <strong>${formatCustomerName(order.customerName)}</strong>,
                  </p>
                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                    ¡Gracias por tu confianza! Hemos recibido tu pedido correctamente y ya estamos preparándolo con el máximo cuidado.
                  </p>

                  <!-- Productos -->
                  <div style="margin: 30px 0;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 10px;">📦</span> Detalle del Pedido
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                      <thead>
                        <tr style="background: linear-gradient(to right, #f9fafb, #f3f4f6);">
                          <th style="padding: 15px 10px; text-align: left; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea;">Producto</th>
                          <th style="padding: 15px 10px; text-align: center; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea;">Cant.</th>
                          <th style="padding: 15px 10px; text-align: right; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea;">Precio</th>
                          <th style="padding: 15px 10px; text-align: right; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #667eea;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                    </table>
                  </div>

                  <!-- Totales -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(to right, #f9fafb, #f3f4f6); border-radius: 12px; overflow: hidden; border: 2px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 25px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${parseFloat(order.subtotal).toFixed(2)}€</td>
                          </tr>
                          ${order.discountAmount > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;">✨ Descuento:</td>
                            <td align="right" style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 700;">-${parseFloat(order.discountAmount).toFixed(2)}€</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">IVA (21%):</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${parseFloat(order.taxAmount).toFixed(2)}€</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Envío:</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${parseFloat(order.shippingCost).toFixed(2)}€</td>
                          </tr>
                          <tr style="border-top: 2px solid #667eea;">
                            <td style="padding: 15px 0 0; color: #111827; font-size: 18px; font-weight: 700;">TOTAL:</td>
                            <td align="right" style="padding: 15px 0 0; color: #667eea; font-size: 24px; font-weight: 700;">${parseFloat(order.totalPrice).toFixed(2)}€</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Info de entrega -->
                  <div style="margin: 25px 0; padding: 20px; background: linear-gradient(to right, #fef3c7, #fde68a); border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.7;">
                      <strong>⏱️ Tiempo de entrega:</strong> 24-48 horas laborables desde la confirmación del pedido.
                    </p>
                  </div>

                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.7; text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                    Te mantendremos informado del estado de tu pedido por email.<br>
                    ¿Alguna duda? <a href="mailto:info@loviprintdtf.es" style="color: #667eea; text-decoration: none; font-weight: 600;">Contáctanos</a>
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
                    <a href="https://www.loviprintdtf.es" style="color: #667eea; text-decoration: none; font-weight: 600;">www.loviprintdtf.es</a>
                    •
                    <a href="mailto:info@loviprintdtf.es" style="color: #667eea; text-decoration: none;">info@loviprintdtf.es</a>
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
}

function generateOrderStatusUpdateHTML(order: any, newStatus: string): string {
  const statusMessages: Record<string, { title: string; message: string; color: string; emoji: string }> = {
    CONFIRMED: {
      title: 'Pedido Confirmado',
      message: 'Tu pedido ha sido confirmado y pronto comenzaremos con la producción.',
      color: '#3b82f6',
      emoji: '✅'
    },
    IN_PRODUCTION: {
      title: 'En Producción',
      message: 'Estamos imprimiendo tus diseños con la máxima calidad.',
      color: '#f59e0b',
      emoji: '🖨️'
    },
    READY: {
      title: 'Listo para Envío',
      message: 'Tu pedido está listo y será enviado en breve.',
      color: '#8b5cf6',
      emoji: '📦'
    },
    SHIPPED: {
      title: 'Enviado',
      message: order.trackingNumber ? '¡Tu pedido está en camino! Puedes seguir su estado en tiempo real.' : 'Tu pedido está en camino.',
      color: '#10b981',
      emoji: '🚚'
    },
    DELIVERED: {
      title: 'Entregado',
      message: '¡Tu pedido ha sido entregado! Esperamos que disfrutes de nuestros productos.',
      color: '#22c55e',
      emoji: '🎉'
    },
    CANCELLED: {
      title: 'Cancelado',
      message: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
      color: '#ef4444',
      emoji: '❌'
    },
  }

  const status = statusMessages[newStatus] || {
    title: 'Actualización',
    message: 'El estado de tu pedido ha cambiado.',
    color: '#667eea',
    emoji: '📢'
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Actualización de Pedido - LoviPrintDTF</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 10px;">${status.emoji}</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">${status.title}</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Pedido #${order.orderNumber}</p>
                </td>
              </tr>

              <!-- Contenido Principal -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.5;">
                    Hola <strong>${formatCustomerName(order.customerName)}</strong>,
                  </p>
                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                    ${status.message}
                  </p>

                  <!-- Info del Pedido -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(to right, #f9fafb, #f3f4f6); border-radius: 12px; overflow: hidden; border: 2px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 25px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Número de pedido:</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">#${order.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Estado:</td>
                            <td align="right" style="padding: 8px 0; color: ${status.color}; font-size: 14px; font-weight: 700;">${status.title}</td>
                          </tr>
                          ${order.trackingNumber ? `
                          <tr>
                            <td colspan="2" style="padding: 15px 0 0 0;">
                              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 8px; color: #d1fae5; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                  📍 Número de Seguimiento
                                </p>
                                <p style="margin: 0 0 15px; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                                  ${order.trackingNumber}
                                </p>
                                <a href="https://gls-group.com/ES/es/recibir-paquetes/seguimiento-envio/"
                                   style="display: inline-block; padding: 12px 30px; background-color: #ffffff; color: #059669; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                  🔍 Seguir mi Pedido
                                </a>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${order.trackingNumber ? `
                  <div style="margin: 25px 0; padding: 20px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.7;">
                      <strong>💡 Seguimiento GLS:</strong> Haz clic en el botón de arriba para ver el estado actualizado de tu envío en tiempo real a través de GLS.
                    </p>
                  </div>
                  ` : ''}

                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.7; text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                    ¿Tienes alguna pregunta sobre tu pedido?<br>
                    <a href="mailto:info@loviprintdtf.es" style="color: #6366f1; text-decoration: none; font-weight: 600;">Contáctanos</a> y te ayudaremos encantados.
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
                    <a href="https://www.loviprintdtf.es" style="color: #6366f1; text-decoration: none; font-weight: 600;">www.loviprintdtf.es</a>
                    •
                    <a href="mailto:info@loviprintdtf.es" style="color: #6366f1; text-decoration: none;">info@loviprintdtf.es</a>
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
}

function generateAdminOrderNotificationHTML(order: any): string {
  const itemsHTML = order.items?.map((item: any) => `
    <tr>
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
        <strong>${item.productName}</strong>
        ${item.fileName ? `<br><span style="color: #6b7280; font-size: 12px;">📎 ${item.fileName}</span>` : ''}
        ${item.fileUrl ? `<br><a href="${item.fileUrl}" style="color: #3b82f6; text-decoration: none; font-size: 12px;">⬇️ Descargar archivo</a>` : ''}
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151; font-size: 14px;">
        ${item.quantity} ${item.product?.unit || 'ud'}
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-size: 14px; font-weight: 700;">
        ${parseFloat(item.subtotal).toFixed(2)}€
      </td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Pedido - Admin</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 10px;">🔔</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Nuevo Pedido</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 16px;">¡Acaba de llegar un pedido nuevo!</p>
                </td>
              </tr>

              <!-- Alerta -->
              <tr>
                <td style="padding: 0;">
                  <div style="background: linear-gradient(to right, #fef3c7, #fde68a); padding: 20px 30px; text-align: center; border-bottom: 3px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: 700;">
                      Pedido #${order.orderNumber}
                    </p>
                    <p style="margin: 5px 0 0; color: #92400e; font-size: 24px; font-weight: 700;">
                      ${parseFloat(order.totalPrice).toFixed(2)}€
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 40px 30px;">
                  <!-- Cliente -->
                  <div style="margin-bottom: 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 10px;">👤</span> Información del Cliente
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(to right, #f9fafb, #f3f4f6); border-radius: 12px; border: 2px solid #e5e7eb; padding: 20px;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Nombre:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatCustomerName(order.customerName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                        <td style="padding: 8px 0;"><a href="mailto:${order.customerEmail}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">${order.customerEmail}</a></td>
                      </tr>
                      ${order.customerPhone ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Teléfono:</td>
                        <td style="padding: 8px 0;"><a href="tel:${order.customerPhone}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">${order.customerPhone}</a></td>
                      </tr>
                      ` : ''}
                      ${order.shippingAddress ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Dirección:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                          ${order.shippingAddress.street}<br>
                          ${order.shippingAddress.postalCode} ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                          ${order.shippingAddress.country}
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>

                  <!-- Productos -->
                  <div style="margin: 30px 0;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                      <span style="font-size: 24px; margin-right: 10px;">📦</span> Artículos del Pedido
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                      <thead>
                        <tr style="background: linear-gradient(to right, #f9fafb, #f3f4f6);">
                          <th style="padding: 15px 10px; text-align: left; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #1f2937;">Producto</th>
                          <th style="padding: 15px 10px; text-align: center; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #1f2937;">Cant.</th>
                          <th style="padding: 15px 10px; text-align: right; color: #374151; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #1f2937;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                    </table>
                  </div>

                  <!-- Totales -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(to right, #f9fafb, #f3f4f6); border-radius: 12px; overflow: hidden; border: 2px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 25px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${parseFloat(order.subtotal).toFixed(2)}€</td>
                          </tr>
                          ${order.discountAmount > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;">Descuento:</td>
                            <td align="right" style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 700;">-${parseFloat(order.discountAmount).toFixed(2)}€</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">IVA:</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${parseFloat(order.taxAmount).toFixed(2)}€</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Envío:</td>
                            <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${parseFloat(order.shippingCost).toFixed(2)}€</td>
                          </tr>
                          <tr style="border-top: 2px solid #1f2937;">
                            <td style="padding: 15px 0 0; color: #111827; font-size: 18px; font-weight: 700;">TOTAL:</td>
                            <td align="right" style="padding: 15px 0 0; color: #1f2937; font-size: 24px; font-weight: 700;">${parseFloat(order.totalPrice).toFixed(2)}€</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${order.notes ? `
                  <div style="margin: 25px 0; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: 700;">📝 Notas del Cliente:</p>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.7;">${order.notes}</p>
                  </div>
                  ` : ''}

                  <!-- Botón de acción -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.loviprintdtf.es/admin/pedidos/${order.orderNumber}"
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      📋 Ver Pedido Completo
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} LoviPrintDTF - Panel de Administración
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
}

function generateVoucherPurchaseHTML(order: any, voucher: any): string {
  const meters = parseFloat(voucher.remainingMeters || 0).toFixed(1)
  const shipments = voucher.remainingShipments || 0
  const orderTotal = parseFloat(order.totalPrice || 0).toFixed(2)

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bono Activado - LoviPrintDTF</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 10px;">🎁✨</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">¡Tu Bono Ya Está Activo!</h1>
                  <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">Disponible de inmediato en tu cuenta</p>
                </td>
              </tr>
              <!-- Contenido Principal -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.5;">
                    Hola <strong>${formatCustomerName(order.customerName)}</strong>,
                  </p>
                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                    ¡Enhorabuena! Tu <strong>${voucher.name}</strong> ha sido activado correctamente en tu cuenta. Ya puedes empezar a disfrutar de tus metros prepagados cuando quieras, sin esperas ni fechas límite.
                  </p>

                  <!-- Código del Bono -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center" style="padding: 35px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        <p style="margin: 0 0 10px; color: #e0e7ff; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                          Tu Código de Bono
                        </p>
                        <h2 style="margin: 0; color: #ffffff; font-size: 38px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                          ${voucher.code}
                        </h2>
                        <p style="margin: 10px 0 0; color: #c7d2fe; font-size: 12px;">
                          Guarda este código para tu referencia
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Detalles del Bono -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(to right, #faf5ff, #f5f3ff); border-radius: 12px; overflow: hidden; border: 2px solid #e9d5ff;">
                    <tr>
                      <td style="padding: 30px;">
                        <h3 style="margin: 0 0 20px; color: #6b21a8; font-size: 18px; font-weight: 700;">📊 Detalles de tu bono</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 15px; border-bottom: 1px solid #e9d5ff;">Metros disponibles:</td>
                            <td align="right" style="padding: 12px 0; color: #8b5cf6; font-size: 22px; font-weight: bold; border-bottom: 1px solid #e9d5ff;">${meters} m</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 15px; border-bottom: 1px solid #e9d5ff;">Envíos gratis incluidos:</td>
                            <td align="right" style="padding: 12px 0; color: #8b5cf6; font-size: 22px; font-weight: bold; border-bottom: 1px solid #e9d5ff;">${shipments} envíos</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0 0; color: #6b7280; font-size: 15px;">Válido hasta:</td>
                            <td align="right" style="padding: 12px 0 0; color: #059669; font-size: 16px; font-weight: 600;">♾️ Sin caducidad</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Cómo Funciona -->
                  <div style="margin: 35px 0; padding: 30px; background-color: #eff6ff; border-radius: 12px; border-left: 5px solid #3b82f6;">
                    <h3 style="margin: 0 0 20px; color: #1e40af; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                      🚀 ¿Cómo funciona tu bono?
                    </h3>
                    <div style="margin-bottom: 20px; padding: 18px; background-color: white; border-radius: 8px; border-left: 3px solid #3b82f6;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="display: inline-block; min-width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px; margin-right: 15px;">1</span>
                        <div>
                          <strong style="color: #1e40af; font-size: 15px;">Compra completada</strong>
                          <p style="margin: 5px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                            Tu bono se ha activado automáticamente tras la confirmación del pago. ¡Ya está listo para usar!
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style="margin-bottom: 20px; padding: 18px; background-color: white; border-radius: 8px; border-left: 3px solid #3b82f6;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="display: inline-block; min-width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px; margin-right: 15px;">2</span>
                        <div>
                          <strong style="color: #1e40af; font-size: 15px;">Usa tus metros cuando quieras</strong>
                          <p style="margin: 5px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                            Haz tus pedidos de Transfer DTF normalmente. Puedes usar la cantidad que necesites en cada pedido, sin mínimos ni restricciones.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style="margin-bottom: 20px; padding: 18px; background-color: white; border-radius: 8px; border-left: 3px solid #3b82f6;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="display: inline-block; min-width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px; margin-right: 15px;">3</span>
                        <div>
                          <strong style="color: #1e40af; font-size: 15px;">Disfruta de envíos gratis</strong>
                          <p style="margin: 5px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                            Tu bono incluye ${shipments} envíos gratuitos. Haz pedidos pequeños sin preocuparte por costes de envío.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style="padding: 18px; background-color: white; border-radius: 8px; border-left: 3px solid #3b82f6;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="display: inline-block; min-width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px; margin-right: 15px;">4</span>
                        <div>
                          <strong style="color: #1e40af; font-size: 15px;">Sin caducidad</strong>
                          <p style="margin: 5px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                            Tu bono nunca caduca. Úsalo a tu ritmo, sin presiones ni fechas límite.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Ventajas -->
                  <div style="margin: 35px 0; padding: 25px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px;">
                    <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 18px; font-weight: 700;">✨ Ventajas de tu bono</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #d1fae5; font-size: 14px; line-height: 1.8;">
                      <li><strong style="color: #ffffff;">Ahorro garantizado:</strong> Precio por metro más económico que pedidos individuales</li>
                      <li><strong style="color: #ffffff;">Gestión automática:</strong> El sistema descuenta los metros automáticamente de tu bono</li>
                      <li><strong style="color: #ffffff;">Total flexibilidad:</strong> Usa los metros que necesites, cuando quieras</li>
                      <li><strong style="color: #ffffff;">Seguimiento fácil:</strong> Consulta tu saldo en cualquier momento desde tu perfil</li>
                    </ul>
                  </div>

                  <!-- Resumen de Compra -->
                  <div style="margin: 30px 0; padding: 25px; background-color: #fefce8; border-radius: 12px; border: 2px solid #fde047;">
                    <h3 style="margin: 0 0 15px; color: #854d0e; font-size: 17px; font-weight: 700;">📋 Resumen de tu compra</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px;">Número de pedido:</td>
                        <td align="right" style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600;">#${order.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px;">Total pagado:</td>
                        <td align="right" style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600;">${orderTotal}€</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px;">Estado:</td>
                        <td align="right" style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 700;">✅ Bono activado</td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 35px 0 30px;">
                    <tr>
                      <td align="center" style="padding: 0 0 15px;">
                        <a href="https://www.loviprintdtf.es/perfil/bonos" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
                          👁️ Ver Mis Bonos
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <a href="https://www.loviprintdtf.es/productos/transfer-dtf" style="display: inline-block; padding: 14px 35px; background-color: transparent; color: #6366f1; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; border: 2px solid #6366f1;">
                          🛒 Hacer un Pedido
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #9ca3af;">
                    <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.7;">
                      <strong style="color: #1f2937;">💡 Consejo:</strong> Para usar tu bono, simplemente realiza un pedido de Transfer DTF con normalidad. El sistema detectará automáticamente que tienes metros disponibles en tu bono y los descontará sin coste adicional. ¡Así de fácil!
                    </p>
                  </div>

                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.7; text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                    ¿Tienes alguna duda sobre tu bono?<br>
                    <a href="mailto:info@loviprintdtf.es" style="color: #6366f1; text-decoration: none; font-weight: 600;">Contáctanos</a> y te ayudaremos encantados.
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
                    <a href="https://www.loviprintdtf.es" style="color: #6366f1; text-decoration: none; font-weight: 600;">www.loviprintdtf.es</a>
                    •
                    <a href="mailto:info@loviprintdtf.es" style="color: #6366f1; text-decoration: none;">info@loviprintdtf.es</a>
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
}
