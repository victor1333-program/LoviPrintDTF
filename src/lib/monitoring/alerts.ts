/**
 * Sistema de Alertas
 * Envía notificaciones cuando ocurren eventos críticos
 */

import { fileLogger } from './file-logger'
import nodemailer from 'nodemailer'

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface Alert {
  level: AlertLevel
  title: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

interface AlertConfig {
  enabled: boolean
  emailTo: string[]
  emailFrom: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  cooldownMinutes: number // Tiempo mínimo entre alertas del mismo tipo
}

class AlertSystem {
  private config: AlertConfig
  private transporter: nodemailer.Transporter | null = null
  private lastAlerts: Map<string, number> = new Map() // key -> timestamp

  constructor() {
    this.config = {
      enabled: process.env.ALERTS_ENABLED === 'true',
      emailTo: process.env.ALERT_EMAIL_TO?.split(',') || ['admin@loviprintdtf.es'],
      emailFrom: process.env.SMTP_FROM || 'alerts@loviprintdtf.es',
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      cooldownMinutes: 30, // No enviar la misma alerta más de 1 vez cada 30 min
    }

    if (this.config.enabled && this.config.smtpHost) {
      this.initializeTransporter()
    }
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
      })

      fileLogger.info('Alerts', 'Alert system initialized')
    } catch (error) {
      fileLogger.error('Alerts', 'Failed to initialize alert system', error)
    }
  }

  private shouldSendAlert(alertKey: string): boolean {
    const now = Date.now()
    const lastSent = this.lastAlerts.get(alertKey)

    if (!lastSent) {
      return true
    }

    const cooldownMs = this.config.cooldownMinutes * 60 * 1000
    return now - lastSent > cooldownMs
  }

  private markAlertSent(alertKey: string) {
    this.lastAlerts.set(alertKey, Date.now())

    // Limpiar alertas antiguas (más de 24h)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    for (const [key, timestamp] of this.lastAlerts.entries()) {
      if (timestamp < cutoff) {
        this.lastAlerts.delete(key)
      }
    }
  }

  private getAlertColor(level: AlertLevel): string {
    const colors = {
      info: '#3498db',
      warning: '#f39c12',
      critical: '#e74c3c',
    }
    return colors[level]
  }

  private getAlertIcon(level: AlertLevel): string {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
    }
    return icons[level]
  }

  private generateEmailHTML(alert: Alert): string {
    const color = this.getAlertColor(alert.level)
    const icon = this.getAlertIcon(alert.level)

    let detailsHTML = ''
    if (alert.details) {
      detailsHTML = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">Detalles:</h3>
          <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12px; overflow-x: auto;">${JSON.stringify(alert.details, null, 2)}</pre>
        </div>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border-left: 4px solid ${color}; padding-left: 20px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: ${color}; font-size: 24px;">
              ${icon} ${alert.title}
            </h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
              ${alert.timestamp}
            </p>
          </div>

          <div style="padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px;">
            <p style="margin-top: 0; font-size: 16px; color: #333;">
              ${alert.message}
            </p>
            ${detailsHTML}
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              <strong>Sistema de Alertas - LoviPrintDTF</strong><br>
              Esta es una alerta automática del sistema de monitoreo.<br>
              Por favor, revisa el estado del servidor en <a href="https://www.loviprintdtf.es/api/health" style="color: #3498db;">https://www.loviprintdtf.es/api/health</a>
            </p>
          </div>
        </body>
      </html>
    `
  }

  public async sendAlert(alert: Alert) {
    try {
      // Log siempre
      const logMethod = alert.level === 'critical' ? 'critical' : alert.level === 'warning' ? 'warn' : 'info'
      fileLogger[logMethod]('Alert', `${alert.title}: ${alert.message}`, alert.details)

      // Verificar si se debe enviar email
      if (!this.config.enabled || !this.transporter) {
        return
      }

      const alertKey = `${alert.level}-${alert.title}`
      if (!this.shouldSendAlert(alertKey)) {
        fileLogger.info('Alerts', `Alert cooldown active for: ${alertKey}`)
        return
      }

      // Enviar email
      const subject = `[${alert.level.toUpperCase()}] ${alert.title} - LoviPrintDTF`
      const html = this.generateEmailHTML(alert)

      await this.transporter.sendMail({
        from: this.config.emailFrom,
        to: this.config.emailTo,
        subject,
        html,
      })

      this.markAlertSent(alertKey)
      fileLogger.info('Alerts', `Alert email sent: ${alertKey}`)
    } catch (error) {
      fileLogger.error('Alerts', 'Failed to send alert', error)
    }
  }

  // Helpers para tipos de alertas comunes

  public async highMemoryUsage(usedPercent: number, details?: Record<string, any>) {
    await this.sendAlert({
      level: usedPercent > 95 ? 'critical' : 'warning',
      title: 'Uso Alto de Memoria',
      message: `El uso de memoria ha alcanzado el ${usedPercent}%. El sistema puede volverse inestable.`,
      details: details,
      timestamp: new Date().toISOString(),
    })
  }

  public async highDiskUsage(usedPercent: number, details?: Record<string, any>) {
    await this.sendAlert({
      level: usedPercent > 95 ? 'critical' : 'warning',
      title: 'Uso Alto de Disco',
      message: `El uso de disco ha alcanzado el ${usedPercent}%. Se recomienda liberar espacio.`,
      details: details,
      timestamp: new Date().toISOString(),
    })
  }

  public async databaseConnectionError(error: Error) {
    await this.sendAlert({
      level: 'critical',
      title: 'Error de Conexión a Base de Datos',
      message: 'No se puede conectar a la base de datos. La aplicación puede no funcionar correctamente.',
      details: {
        error: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    })
  }

  public async highErrorRate(errorCount: number, timeWindow: string, details?: Record<string, any>) {
    await this.sendAlert({
      level: 'warning',
      title: 'Tasa Alta de Errores',
      message: `Se han detectado ${errorCount} errores en ${timeWindow}.`,
      details: details,
      timestamp: new Date().toISOString(),
    })
  }

  public async paymentSystemError(error: Error, orderId?: string) {
    await this.sendAlert({
      level: 'critical',
      title: 'Error en Sistema de Pagos',
      message: 'Se ha producido un error en el sistema de pagos. Requiere atención inmediata.',
      details: {
        error: error.message,
        orderId,
      },
      timestamp: new Date().toISOString(),
    })
  }

  public async securityEvent(event: string, details: Record<string, any>) {
    await this.sendAlert({
      level: 'critical',
      title: 'Evento de Seguridad',
      message: event,
      details,
      timestamp: new Date().toISOString(),
    })
  }

  public async applicationRestart(reason?: string) {
    await this.sendAlert({
      level: 'info',
      title: 'Aplicación Reiniciada',
      message: reason || 'La aplicación ha sido reiniciada.',
      timestamp: new Date().toISOString(),
    })
  }
}

// Singleton instance
export const alertSystem = new AlertSystem()

// Exportar para uso directo
export default alertSystem
