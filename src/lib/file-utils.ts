/**
 * Utilidades para manejo seguro de archivos
 */

import path from 'path'
import { uploadLogger } from './logger'

/**
 * Sanitiza un nombre de archivo para prevenir ataques de seguridad
 *
 * Previene:
 * - Path traversal (../, ./, \)
 * - Nombres reservados del sistema
 * - Caracteres especiales peligrosos
 * - Nombres muy largos
 * - Unicode problemático
 *
 * @param fileName - Nombre original del archivo
 * @param maxLength - Longitud máxima del nombre (default: 100)
 * @returns Nombre sanitizado seguro
 */
export function sanitizeFileName(fileName: string, maxLength: number = 100): string {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Nombre de archivo inválido')
  }

  // 1. Eliminar espacios al inicio y final
  let sanitized = fileName.trim()

  // 2. Separar extensión de forma segura
  const lastDotIndex = sanitized.lastIndexOf('.')
  let name = lastDotIndex > 0 ? sanitized.substring(0, lastDotIndex) : sanitized
  let ext = lastDotIndex > 0 ? sanitized.substring(lastDotIndex) : ''

  // 3. Validar que no sea solo una extensión (ej: ".htaccess")
  if (!name || name.length === 0) {
    throw new Error('Nombre de archivo inválido')
  }

  // 4. Normalizar Unicode (prevenir ataques con caracteres similares)
  name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // 5. Eliminar path traversal y caracteres peligrosos
  // Eliminar: ../ ./ \ / : * ? " < > | null bytes
  name = name.replace(/\.\./g, '')
    .replace(/[\/\\:*?"<>|\x00-\x1f\x80-\x9f]/g, '')
    .replace(/^\.+/, '') // Eliminar puntos al inicio

  // 6. Reemplazar espacios y caracteres especiales con guiones
  name = name.replace(/\s+/g, '-')
    .replace(/[^\w\-_.]/g, '') // Solo permitir alfanuméricos, guiones, guiones bajos y puntos

  // 7. Eliminar guiones múltiples consecutivos
  name = name.replace(/-+/g, '-')

  // 8. Convertir a minúsculas para consistencia
  name = name.toLowerCase()

  // 9. Sanitizar extensión
  ext = ext.toLowerCase()
    .replace(/[^a-z0-9.]/g, '') // Solo permitir letras, números y punto
    .substring(0, 10) // Limitar longitud de extensión

  // 10. Validar que la extensión empiece con punto
  if (ext && !ext.startsWith('.')) {
    ext = '.' + ext
  }

  // 11. Limitar longitud del nombre (sin extensión)
  const maxNameLength = maxLength - ext.length
  if (name.length > maxNameLength) {
    name = name.substring(0, maxNameLength)
  }

  // 12. Eliminar guiones al final del nombre
  name = name.replace(/-+$/, '')

  // 13. Validar que el nombre no esté vacío después de sanitizar
  if (!name || name.length === 0) {
    name = 'file'
  }

  // 14. Verificar nombres reservados de Windows
  const reservedNames = [
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
  ]

  if (reservedNames.includes(name.toLowerCase())) {
    name = `file-${name}`
  }

  const finalName = name + ext

  // 15. Log si hubo cambios significativos
  if (finalName !== fileName) {
    uploadLogger.info('File name sanitized', {
      context: {
        original: fileName,
        sanitized: finalName
      }
    })
  }

  return finalName
}

/**
 * Genera un nombre de archivo único con timestamp y string aleatorio
 *
 * @param originalFileName - Nombre original del archivo
 * @returns Nombre único: timestamp-random.extension
 */
export function generateUniqueFileName(originalFileName: string): string {
  const sanitized = sanitizeFileName(originalFileName)
  const ext = path.extname(sanitized)
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)

  return `${timestamp}-${randomStr}${ext}`
}

/**
 * Valida que la extensión del archivo esté en la lista de permitidas
 *
 * @param fileName - Nombre del archivo
 * @param allowedExtensions - Array de extensiones permitidas (ej: ['.jpg', '.png'])
 * @returns true si la extensión está permitida
 */
export function isAllowedExtension(fileName: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(fileName).toLowerCase()
  return allowedExtensions.map(e => e.toLowerCase()).includes(ext)
}

/**
 * Valida que el tipo MIME coincida con la extensión del archivo
 *
 * @param fileName - Nombre del archivo
 * @param mimeType - Tipo MIME reportado
 * @returns true si son consistentes
 */
export function validateMimeTypeMatch(fileName: string, mimeType: string): boolean {
  const ext = path.extname(fileName).toLowerCase()

  const mimeTypeMap: Record<string, string[]> = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.webp': ['image/webp'],
    '.svg': ['image/svg+xml'],
    '.pdf': ['application/pdf'],
    '.psd': ['image/vnd.adobe.photoshop', 'application/octet-stream'],
    '.ai': ['application/postscript', 'application/illustrator'],
  }

  const expectedMimeTypes = mimeTypeMap[ext]
  if (!expectedMimeTypes) {
    return false
  }

  return expectedMimeTypes.includes(mimeType.toLowerCase())
}
