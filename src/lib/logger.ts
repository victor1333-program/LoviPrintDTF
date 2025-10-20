/**
 * Sistema de Logging Condicional
 * Solo imprime logs en desarrollo, silencioso en producción
 */

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

interface LogOptions {
  /** Forzar log incluso en producción */
  force?: boolean
  /** Contexto adicional para el log */
  context?: Record<string, any>
}

class Logger {
  private prefix: string

  constructor(prefix: string = 'App') {
    this.prefix = prefix
  }

  private shouldLog(force?: boolean): boolean {
    return isDev || isTest || force === true
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}]`
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : ''
    return `${prefix} ${message}${contextStr}`
  }

  /**
   * Log genérico (solo desarrollo)
   */
  log(message: string, options?: LogOptions) {
    if (this.shouldLog(options?.force)) {
      console.log(this.formatMessage('log', message, options?.context))
    }
  }

  /**
   * Información general (solo desarrollo)
   */
  info(message: string, options?: LogOptions) {
    if (this.shouldLog(options?.force)) {
      console.info(this.formatMessage('info', message, options?.context))
    }
  }

  /**
   * Advertencias (siempre se muestran)
   */
  warn(message: string, options?: LogOptions) {
    console.warn(this.formatMessage('warn', message, options?.context))
  }

  /**
   * Errores (siempre se muestran)
   */
  error(message: string, error?: Error | unknown, options?: LogOptions) {
    const errorContext = error instanceof Error
      ? { message: error.message, stack: error.stack, ...options?.context }
      : { error, ...options?.context }

    console.error(this.formatMessage('error', message, errorContext))
  }

  /**
   * Debug verbose (solo desarrollo)
   */
  debug(message: string, data?: any) {
    if (isDev) {
      console.debug(this.formatMessage('debug', message, { data }))
    }
  }

  /**
   * Log de éxito (solo desarrollo)
   */
  success(message: string, options?: LogOptions) {
    if (this.shouldLog(options?.force)) {
      console.log(`✅ ${this.formatMessage('log', message, options?.context)}`)
    }
  }

  /**
   * Timers para medir performance
   */
  time(label: string) {
    if (isDev) {
      console.time(`[${this.prefix}] ${label}`)
    }
  }

  timeEnd(label: string) {
    if (isDev) {
      console.timeEnd(`[${this.prefix}] ${label}`)
    }
  }
}

/**
 * Logger por defecto
 */
export const logger = new Logger('LoviPrintDTF')

/**
 * Crear logger con contexto específico
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Logs específicos por módulo
 */
export const authLogger = createLogger('Auth')
export const paymentLogger = createLogger('Payment')
export const emailLogger = createLogger('Email')
export const orderLogger = createLogger('Order')
export const uploadLogger = createLogger('Upload')

/**
 * Helper para sanitizar datos sensibles antes de logear
 */
export function sanitizeForLog<T extends Record<string, any>>(
  data: T,
  keysToRedact: string[] = ['password', 'token', 'secret', 'apiKey', 'creditCard']
): T {
  const sanitized: Record<string, any> = { ...data }

  for (const key of keysToRedact) {
    if (key in sanitized) {
      sanitized[key] = '***REDACTED***'
    }
  }

  // También redactar nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForLog(value as Record<string, any>, keysToRedact)
    }
  }

  return sanitized as T
}

/**
 * Log seguro de request/response en APIs
 */
export function logAPICall(
  method: string,
  path: string,
  statusCode: number,
  duration?: number,
  error?: Error
) {
  const message = `${method} ${path} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`

  if (error) {
    logger.error(message, error)
  } else if (statusCode >= 400) {
    logger.warn(message)
  } else {
    logger.info(message)
  }
}
