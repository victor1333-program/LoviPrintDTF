import { v2 as cloudinary } from 'cloudinary'
import { prisma } from './prisma'
import { uploadLogger } from './logger'

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

let cachedConfig: CloudinaryConfig | null = null
let configLastFetched = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutos
let cloudinaryConfigured = false

async function getCloudinaryConfig(): Promise<CloudinaryConfig | null> {
  const now = Date.now()

  // Usar cache si no ha expirado
  if (cachedConfig && (now - configLastFetched) < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'storage',
        key: {
          in: ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']
        }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    // Verificar que tenemos toda la configuración necesaria
    if (!config.cloudinary_cloud_name || !config.cloudinary_api_key || !config.cloudinary_api_secret) {
      uploadLogger.warn('Cloudinary configuration incomplete')
      return null
    }

    cachedConfig = {
      cloudName: config.cloudinary_cloud_name,
      apiKey: config.cloudinary_api_key,
      apiSecret: config.cloudinary_api_secret,
    }

    configLastFetched = now
    return cachedConfig
  } catch (error) {
    uploadLogger.error('Error fetching Cloudinary config', error)
    return null
  }
}

async function configureCloudinary() {
  if (cloudinaryConfigured) return true

  const config = await getCloudinaryConfig()

  if (!config) {
    return false
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  })

  cloudinaryConfigured = true
  return true
}

export interface UploadResult {
  success: boolean
  url?: string
  publicId?: string
  error?: string
  metadata?: {
    width: number
    height: number
    format: string
    bytes: number
  }
}

/**
 * Sube un archivo a Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer | string,
  options: {
    folder?: string
    publicId?: string
    resourceType?: 'image' | 'raw' | 'video' | 'auto'
    format?: string
  } = {}
): Promise<UploadResult> {
  try {
    const isConfigured = await configureCloudinary()

    if (!isConfigured) {
      return {
        success: false,
        error: 'Cloudinary no está configurado. Por favor configura las credenciales en Configuración > Almacenamiento'
      }
    }

    const uploadOptions: any = {
      folder: options.folder || 'customer-designs',
      resource_type: options.resourceType || 'auto',
      // Hacer que los archivos 'raw' (como PDFs) sean públicos
      type: 'upload',
      access_mode: 'public'
    }

    if (options.publicId) {
      uploadOptions.public_id = options.publicId
    }

    if (options.format) {
      uploadOptions.format = options.format
    }

    // Si es un buffer, convertirlo a base64
    let fileData: string
    if (Buffer.isBuffer(fileBuffer)) {
      fileData = `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`
    } else {
      fileData = fileBuffer
    }

    const result = await cloudinary.uploader.upload(fileData, uploadOptions)

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }
    }
  } catch (error) {
    uploadLogger.error('Error uploading to Cloudinary', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo'
    }
  }
}

/**
 * Elimina un archivo de Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const isConfigured = await configureCloudinary()

    if (!isConfigured) {
      uploadLogger.warn('Cloudinary not configured, skipping delete')
      return false
    }

    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (error) {
    uploadLogger.error('Error deleting from Cloudinary', error)
    return false
  }
}

/**
 * Obtiene información de un archivo en Cloudinary
 */
export async function getCloudinaryResource(publicId: string) {
  try {
    const isConfigured = await configureCloudinary()

    if (!isConfigured) {
      return null
    }

    const result = await cloudinary.api.resource(publicId)
    return result
  } catch (error) {
    uploadLogger.error('Error getting Cloudinary resource', error)
    return null
  }
}

/**
 * Genera URL transformada (resize, crop, etc)
 */
export function getTransformedUrl(
  publicId: string,
  transformations: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  } = {}
): string {
  return cloudinary.url(publicId, transformations)
}
