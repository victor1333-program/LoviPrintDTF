import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getRateLimitIdentifier, applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { sanitizeFileName, generateUniqueFileName, isAllowedExtension, validateMimeTypeMatch } from '@/lib/file-utils'
import { uploadLogger } from '@/lib/logger'

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

    // Usar Cloudinary si está configurado
    if (storageProvider === 'cloudinary') {
      const result = await uploadToCloudinary(buffer, {
        folder,
        resourceType: 'auto',
      })

      if (!result.success) {
        // Fallback a almacenamiento local si Cloudinary falla
        uploadLogger.warn('Cloudinary upload failed, falling back to local storage', {
          context: { error: result.error }
        })
        return await uploadToLocal(sanitizedFileName, buffer, file.size)
      }

      return NextResponse.json({
        success: true,
        fileUrl: result.url,
        fileName: sanitizedFileName,
        fileSize: file.size,
        metadata: result.metadata,
        publicId: result.publicId,
      })
    }

    // Almacenamiento local (fallback o por defecto)
    return await uploadToLocal(sanitizedFileName, buffer, file.size)

  } catch (error) {
    uploadLogger.error('Error uploading file', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    )
  }
}

async function uploadToLocal(sanitizedFileName: string, buffer: Buffer, fileSize: number) {
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
  })
}
