/**
 * Rate Limiting simple in-memory
 * Para producción considera usar Redis con @upstash/ratelimit
 */

interface RateLimitRecord {
  count: number
  resetTime: number
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
  // APIs públicas
  public: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 req/min

  // APIs de autenticación (más restrictivo)
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/min

  // Upload de archivos
  upload: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min

  // Pagos (muy restrictivo)
  payment: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 req/min

  // Admin (moderado)
  admin: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 req/min
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
    }
  }

  // Incrementar contador
  record.count++
  rateLimitStore.set(key, record)

  const remaining = Math.max(0, config.maxRequests - record.count)
  const success = record.count <= config.maxRequests

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
