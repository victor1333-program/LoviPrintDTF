import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getRateLimitIdentifier, applyRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

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
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Extensión de archivo no permitida' },
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

    // 4. Validar nombre del archivo (prevenir path traversal)
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
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
        console.warn('Cloudinary upload failed, falling back to local storage:', result.error)
        return await uploadToLocal(file, buffer)
      }

      return NextResponse.json({
        success: true,
        fileUrl: result.url,
        fileName: file.name,
        fileSize: file.size,
        metadata: result.metadata,
        publicId: result.publicId,
      })
    }

    // Almacenamiento local (fallback o por defecto)
    return await uploadToLocal(file, buffer)

  } catch (error) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    )
  }
}

async function uploadToLocal(file: File, buffer: Buffer) {
  // Las validaciones ya se realizaron en el POST handler principal

  // Crear directorio si no existe
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'designs')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Generar nombre único
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const ext = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomStr}.${ext}`
  const filePath = path.join(uploadDir, fileName)

  // Guardar archivo
  await writeFile(filePath, buffer)

  // URL pública del archivo
  const fileUrl = `/uploads/designs/${fileName}`

  return NextResponse.json({
    success: true,
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
  })
}
