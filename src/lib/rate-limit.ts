/**
 * Rate Limiting simple in-memory
 *
 * Características:
 * - Protección contra fuerza bruta
 * - Límites configurables por tipo de endpoint
 * - Headers estándar de rate limit (X-RateLimit-*)
 * - Logging de intentos bloqueados
 * - Limpieza automática de registros antiguos
 *
 * Para producción con múltiples instancias considera:
 * - Redis con @upstash/ratelimit
 * - Cloudflare Rate Limiting
 * - API Gateway rate limiting
 */

import { logger } from './logger'

interface RateLimitRecord {
  count: number
  resetTime: number
  blockedAttempts: number // Contador de intentos bloqueados
}

// Almacenamiento en memoria (se reinicia con el servidor)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Limpiar registros antiguos cada 10 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number // Número máximo de requests
  windowMs: number    // Ventana de tiempo en milisegundos
}

export const RATE_LIMIT_CONFIGS = {
  // APIs públicas (carrito, productos, categorías)
  public: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 req/min

  // APIs de autenticación (login, registro, verificación)
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/min

  // Upload de archivos (diseños, imágenes)
  upload: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min

  // Pagos (checkout, webhooks - MUY restrictivo)
  payment: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 req/min

  // Admin (panel de administración)
  admin: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 req/min

  // Contacto y notificaciones
  contact: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/min
} as const

/**
 * Verifica si una IP ha excedido el límite de rate limiting
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.public
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier

  let record = rateLimitStore.get(key)

  // Si no existe registro o ha expirado, crear uno nuevo
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
      blockedAttempts: 0,
    }
  }

  // Incrementar contador
  record.count++

  const remaining = Math.max(0, config.maxRequests - record.count)
  const success = record.count <= config.maxRequests

  // Si se excedió el límite, incrementar contador de intentos bloqueados y loguear
  if (!success) {
    record.blockedAttempts++

    // Log cada 5 intentos bloqueados para evitar spam de logs
    if (record.blockedAttempts % 5 === 1) {
      logger.warn('Rate limit exceeded', {
        context: {
          identifier,
          attempts: record.count,
          blockedAttempts: record.blockedAttempts,
          maxAllowed: config.maxRequests,
          windowMs: config.windowMs,
          resetTime: new Date(record.resetTime).toISOString()
        }
      })
    }
  }

  rateLimitStore.set(key, record)

  return {
    success,
    remaining,
    resetTime: record.resetTime,
  }
}

/**
 * Obtiene el identificador único para rate limiting
 * Usa IP del cliente o user ID si está autenticado
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Si hay usuario autenticado, usar su ID
  if (userId) {
    return `user:${userId}`
  }

  // Obtener IP del cliente
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  return `ip:${ip}`
}

/**
 * Middleware helper para aplicar rate limiting
 */
export function applyRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; headers: Record<string, string> } {
  const result = checkRateLimit(identifier, config)

  const headers = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }

  return {
    allowed: result.success,
    headers,
  }
}
