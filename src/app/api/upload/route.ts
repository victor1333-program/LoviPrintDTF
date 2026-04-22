import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { getRateLimitIdentifier, applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { sanitizeFileName, generateUniqueFileName, isAllowedExtension, validateMimeTypeMatch } from '@/lib/file-utils'
import { uploadLogger } from '@/lib/logger'

const MIN_WARN_DPI = 150
const MIN_WARN_PX = 1000

async function extractQualityInfo(buffer: Buffer, mimeType: string) {
  if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(mimeType)) {
    return { imageMetadata: null, qualityWarnings: [] as string[] }
  }
  try {
    const meta = await sharp(buffer).metadata()
    const width = meta.width
    const height = meta.height
    const dpi = meta.density
    const warnings: string[] = []

    if (dpi && dpi < MIN_WARN_DPI) {
      warnings.push(`Resolución baja (${dpi} DPI). Recomendamos 300 DPI para una impresión nítida.`)
    }
    if (width && height && Math.min(width, height) < MIN_WARN_PX) {
      warnings.push(`Dimensiones reducidas (${width}×${height}px). Recomendamos al menos ${MIN_WARN_PX}×${MIN_WARN_PX}px.`)
    }

    return {
      imageMetadata: { width, height, dpi },
      qualityWarnings: warnings,
    }
  } catch (error) {
    uploadLogger.warn('Could not extract image metadata with sharp', { context: { mimeType } })
    return { imageMetadata: null, qualityWarnings: [] as string[] }
  }
}

export async function POST(request: NextRequest) {
  // Aplicar rate limiting para uploads
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = applyRateLimit(identifier, RATE_LIMIT_CONFIGS.upload)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados uploads. Por favor, espera un momento.' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'customer-designs'

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      )
    }

    // VALIDACIONES DE SEGURIDAD - Ejecutar ANTES de cualquier procesamiento

    // 1. Validar tipo de archivo
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'image/vnd.adobe.photoshop',
      'application/postscript',
      'image/svg+xml'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan: PNG, JPG, PDF, PSD, AI, SVG' },
        { status: 400 }
      )
    }

    // 2. Validar extensión del archivo (protección adicional contra cambio de MIME)
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.psd', '.ai', '.svg']

    if (!isAllowedExtension(file.name, allowedExtensions)) {
      return NextResponse.json(
        { error: 'Extensión de archivo no permitida' },
        { status: 400 }
      )
    }

    // 2b. Validar que el MIME type coincida con la extensión
    if (!validateMimeTypeMatch(file.name, file.type)) {
      uploadLogger.warn('MIME type mismatch detected', {
        context: {
          fileName: file.name,
          reportedMimeType: file.type
        }
      })
      return NextResponse.json(
        { error: 'El tipo de archivo no coincide con su extensión' },
        { status: 400 }
      )
    }

    // 3. Validar tamaño del archivo (50MB para archivos de diseño)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 50MB' },
        { status: 400 }
      )
    }

    // 4. Sanitizar nombre del archivo (prevenir path traversal y otros ataques)
    let sanitizedFileName: string
    try {
      sanitizedFileName = sanitizeFileName(file.name)
    } catch (error) {
      uploadLogger.error('File name sanitization failed', error)
      return NextResponse.json(
        { error: 'Nombre de archivo inválido' },
        { status: 400 }
      )
    }

    // Obtener configuración de almacenamiento
    const storageProviderSetting = await prisma.setting.findUnique({
      where: { key: 'storage_provider' }
    })

    const storageProvider = storageProviderSetting?.value || 'local'

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validación de calidad (no bloquea, solo avisa)
    const { imageMetadata, qualityWarnings } = await extractQualityInfo(buffer, file.type)

    // Usar Cloudinary si está configurado
    if (storageProvider === 'cloudinary') {
      // Determinar el resource_type correcto:
      // - PDFs deben subirse como 'raw' para evitar restricciones de acceso
      // - Imágenes como 'image'
      // - Otros archivos como 'raw'
      let resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
      const extension = path.extname(file.name).toLowerCase()

      if (extension === '.pdf' || file.type === 'application/pdf') {
        resourceType = 'raw'
      } else if (['.psd', '.ai', '.svg'].includes(extension)) {
        resourceType = 'raw'
      } else if (['.png', '.jpg', '.jpeg'].includes(extension)) {
        resourceType = 'image'
      }

      const result = await uploadToCloudinary(buffer, {
        folder,
        resourceType,
      })

      if (!result.success) {
        // Fallback a almacenamiento local si Cloudinary falla
        uploadLogger.warn('Cloudinary upload failed, falling back to local storage', {
          context: { error: result.error }
        })
        return await uploadToLocal(sanitizedFileName, buffer, file.size, imageMetadata, qualityWarnings)
      }

      return NextResponse.json({
        success: true,
        fileUrl: result.url,
        fileName: sanitizedFileName,
        fileSize: file.size,
        metadata: result.metadata,
        publicId: result.publicId,
        imageMetadata,
        qualityWarnings,
      })
    }

    // Almacenamiento local (fallback o por defecto)
    return await uploadToLocal(sanitizedFileName, buffer, file.size, imageMetadata, qualityWarnings)

  } catch (error) {
    uploadLogger.error('Error uploading file', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    )
  }
}

async function uploadToLocal(
  sanitizedFileName: string,
  buffer: Buffer,
  fileSize: number,
  imageMetadata: { width?: number; height?: number; dpi?: number } | null = null,
  qualityWarnings: string[] = []
) {
  // Las validaciones ya se realizaron en el POST handler principal

  // Crear directorio si no existe
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'designs')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Generar nombre único usando el nombre sanitizado
  const uniqueFileName = generateUniqueFileName(sanitizedFileName)
  const filePath = path.join(uploadDir, uniqueFileName)

  // Guardar archivo
  await writeFile(filePath, buffer)

  // URL pública del archivo
  const fileUrl = `/uploads/designs/${uniqueFileName}`

  uploadLogger.info('File uploaded to local storage', {
    context: {
      fileName: sanitizedFileName,
      uniqueFileName,
      size: fileSize
    }
  })

  return NextResponse.json({
    success: true,
    fileUrl,
    fileName: sanitizedFileName,
    fileSize,
    imageMetadata,
    qualityWarnings,
  })
}
