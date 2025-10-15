import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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
  // Validar tipo de archivo
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'application/pdf',
    'image/vnd.adobe.photoshop',
    'application/postscript'
  ]

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Solo PNG y PDF' },
      { status: 400 }
    )
  }

  // Validar tamaño (100MB por defecto para local)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'El archivo es demasiado grande. Máximo 100MB' },
      { status: 400 }
    )
  }

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
