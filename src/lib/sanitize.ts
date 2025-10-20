/**
 * Utilidades de sanitización HTML
 * Protege contra ataques XSS limpiando HTML generado por usuarios
 */
import DOMPurify from 'isomorphic-dompurify'

/**
 * Tipo de configuración para DOMPurify
 */
interface SanitizeConfig {
  ALLOWED_TAGS?: string[]
  ALLOWED_ATTR?: string[]
  ALLOW_DATA_ATTR?: boolean
  [key: string]: any
}

/**
 * Configuración por defecto de DOMPurify
 */
const DEFAULT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
}

/**
 * Configuración estricta (solo texto plano con formato básico)
 */
const STRICT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
}

/**
 * Sanitiza HTML con configuración por defecto
 * @param dirty - HTML potencialmente peligroso
 * @returns HTML limpio y seguro
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, DEFAULT_CONFIG)
}

/**
 * Sanitiza HTML con configuración estricta (mínimo formato)
 * @param dirty - HTML potencialmente peligroso
 * @returns HTML limpio con formato mínimo
 */
export function sanitizeHTMLStrict(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, STRICT_CONFIG)
}

/**
 * Sanitiza HTML con configuración personalizada
 * @param dirty - HTML potencialmente peligroso
 * @param config - Configuración personalizada de DOMPurify
 * @returns HTML limpio según configuración
 */
export function sanitizeHTMLCustom(dirty: string, config: SanitizeConfig): string {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, config)
}

/**
 * Elimina completamente todas las etiquetas HTML (solo texto plano)
 * @param dirty - HTML potencialmente peligroso
 * @returns Solo texto plano sin HTML
 */
export function stripHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

/**
 * Sanitiza un objeto recursivamente, limpiando todos los strings HTML
 * Útil para limpiar objetos JSON de formularios
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) : sanitizeHTML(String(item))
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Valida y sanitiza un email
 * @param email - Email a validar
 * @returns Email sanitizado o null si es inválido
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null

  const cleaned = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return emailRegex.test(cleaned) ? cleaned : null
}

/**
 * Sanitiza un número de teléfono
 * @param phone - Teléfono a sanitizar
 * @returns Teléfono sanitizado (solo dígitos y +)
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/[^\d+\s()-]/g, '').trim()
}

/**
 * Sanitiza una URL
 * @param url - URL a sanitizar
 * @returns URL sanitizada o null si es inválida
 */
export function sanitizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') return null

  try {
    const parsed = new URL(url)
    // Solo permitir http y https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}
