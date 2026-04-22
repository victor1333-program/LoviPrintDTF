import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/download-attachment?url=...&filename=...
 * Descarga archivos adjuntos de pedidos de manera segura (solo admin)
 *
 * Este endpoint actúa como proxy para descargar archivos desde Cloudinary o desde el servidor local
 * evitando problemas de CORS en el frontend
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Verificar que el usuario sea administrador
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      console.error('Download attempt without admin role:', session?.user?.email, session?.user?.role)
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const fileUrl = searchParams.get('url')
    const fileName = searchParams.get('filename') || 'archivo.pdf'

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'URL de archivo no proporcionada' },
        { status: 400 }
      )
    }

    let buffer: Buffer
    let contentType: string

    // Verificar si es un archivo de Cloudinary o local
    if (fileUrl.includes('cloudinary.com')) {
      // Archivo de Cloudinary - extraer public_id y resource_type de la URL
      console.log('Processing Cloudinary URL:', fileUrl)

      // Extraer el resource_type de la URL
      // Formato: https://res.cloudinary.com/CLOUD_NAME/RESOURCE_TYPE/upload/VERSION/FOLDER/PUBLIC_ID.EXTENSION
      const resourceTypeMatch = fileUrl.match(/cloudinary\.com\/[^/]+\/([^/]+)\/upload\//)
      console.log('Regex match result:', resourceTypeMatch)
      const resourceType = resourceTypeMatch ? resourceTypeMatch[1] : 'image'

      console.log('Extracted resource_type from URL:', resourceType)

      // Extraer el public_id de la URL de Cloudinary
      const urlParts = fileUrl.split('/upload/')
      if (urlParts.length < 2) {
        return NextResponse.json(
          { error: 'URL de Cloudinary inválida' },
          { status: 400 }
        )
      }

      // Obtener la parte después de /upload/ y quitar la versión (v1234567/)
      const pathAfterUpload = urlParts[1]
      const pathParts = pathAfterUpload.split('/')

      // Si hay versión, quitarla (empieza con 'v' seguido de números)
      const startIndex = pathParts[0].match(/^v\d+$/) ? 1 : 0
      const publicIdWithExt = pathParts.slice(startIndex).join('/')

      // Quitar la extensión para obtener el public_id
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '')

      console.log('Extracted public_id:', publicId)
      console.log('Using resource_type:', resourceType)

      // Configurar Cloudinary con credenciales de la base de datos
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

      if (!config.cloudinary_cloud_name || !config.cloudinary_api_key || !config.cloudinary_api_secret) {
        return NextResponse.json(
          { error: 'Cloudinary no está configurado' },
          { status: 500 }
        )
      }

      cloudinary.config({
        cloud_name: config.cloudinary_cloud_name,
        api_key: config.cloudinary_api_key,
        api_secret: config.cloudinary_api_secret,
      })

      console.log('Cloudinary configured, getting resource...')

      // Generar URL de descarga con autenticación de Cloudinary
      try {
        // Generar URL autenticada con modo private (permite descarga autenticada)
        const downloadUrl = cloudinary.url(publicId, {
          resource_type: resourceType,
          type: 'upload',
          sign_url: true,
          secure: true,
        })

        console.log('Generated authenticated URL, downloading...')

        // Descargar el archivo usando la URL autenticada
        const response = await fetch(downloadUrl)
        console.log('Download response status:', response.status)

        if (!response.ok) {
          console.error('Download failed:', response.status, response.statusText)

          // Si falla con URL firmada, intentar método alternativo
          console.log('Trying alternative method with extension in URL...')

          // Construir URL completa con extensión
          const extension = fileName.split('.').pop() || 'pdf'
          const simpleUrl = `https://res.cloudinary.com/${config.cloudinary_cloud_name}/${resourceType}/upload/${publicId}.${extension}`
          console.log('Trying URL:', simpleUrl)

          const simpleResponse = await fetch(simpleUrl)
          console.log('Simple URL response status:', simpleResponse.status)

          if (simpleResponse.ok) {
            const blob = await simpleResponse.blob()
            buffer = Buffer.from(await blob.arrayBuffer())
            contentType = simpleResponse.headers.get('Content-Type') || 'application/octet-stream'
            console.log('Downloaded via simple URL, size:', buffer.length)
          } else {
            console.error('Simple URL also failed with:', simpleResponse.status)

            // Método 3: Usar download_archive_url para archivos con restricciones de acceso
            // Este método genera un ZIP descargable que incluye el archivo original
            console.log('Trying download_archive_url method for restricted files...')

            try {
              // Generar URL de descarga de archivo usando la API de Cloudinary
              const archiveUrl = cloudinary.utils.download_archive_url({
                public_ids: [publicId],
                resource_type: resourceType as 'image' | 'raw' | 'video',
              })

              console.log('Archive download URL generated, downloading...')

              const archiveResponse = await fetch(archiveUrl)
              console.log('Archive response status:', archiveResponse.status)

              if (archiveResponse.ok) {
                // Descargar el ZIP
                const zipBuffer = Buffer.from(await archiveResponse.arrayBuffer())
                console.log('ZIP downloaded, size:', zipBuffer.length)

                // Extraer el archivo del ZIP usando JSZip o similar
                // Importamos AdmZip dinámicamente
                const AdmZip = require('adm-zip')
                const zip = new AdmZip(zipBuffer)
                const zipEntries = zip.getEntries()

                // Buscar el archivo en el ZIP
                let fileEntry = null
                for (const entry of zipEntries) {
                  if (!entry.isDirectory) {
                    fileEntry = entry
                    break
                  }
                }

                if (fileEntry) {
                  buffer = fileEntry.getData()
                  console.log('File extracted from ZIP, size:', buffer.length)

                  // Determinar content type basado en la extensión
                  const ext = path.extname(fileName).toLowerCase()
                  const mimeTypes: { [key: string]: string } = {
                    '.pdf': 'application/pdf',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml',
                    '.webp': 'image/webp',
                    '.zip': 'application/zip',
                  }
                  contentType = mimeTypes[ext] || 'application/octet-stream'
                } else {
                  throw new Error('No se encontró el archivo en el ZIP')
                }
              } else {
                throw new Error(`Archive download failed: ${archiveResponse.status}`)
              }
            } catch (archiveError: any) {
              console.error('Archive download error:', archiveError.message)

              // Todos los métodos fallaron
              return NextResponse.json(
                {
                  error: 'No se pudo descargar el archivo desde Cloudinary. El archivo tiene restricciones de acceso.',
                  details: `Estado: ${simpleResponse.status}`,
                  suggestion: 'Por favor, contacta con el administrador para revisar los permisos del archivo en Cloudinary.'
                },
                { status: 500 }
              )
            }
          }
        } else {
          const blob = await response.blob()
          console.log('Blob size:', blob.size, 'Type:', blob.type)
          buffer = Buffer.from(await blob.arrayBuffer())
          contentType = response.headers.get('Content-Type') || 'application/octet-stream'
          console.log('Buffer created, size:', buffer.length)
        }
      } catch (apiError: any) {
        console.error('Cloudinary API error:', apiError.message)
        return NextResponse.json(
          { error: 'No se pudo obtener el archivo desde Cloudinary: ' + apiError.message },
          { status: 500 }
        )
      }
    } else {
      // Archivo local del servidor
      // Validar que la ruta sea segura (dentro del directorio public/uploads)
      const normalizedPath = path.normalize(fileUrl)
      if (normalizedPath.includes('..') || !normalizedPath.startsWith('/uploads/')) {
        return NextResponse.json(
          { error: 'Ruta de archivo no válida' },
          { status: 400 }
        )
      }

      try {
        // Leer archivo desde el sistema de archivos
        const filePath = path.join(process.cwd(), 'public', normalizedPath)
        buffer = await readFile(filePath)

        // Determinar content type basado en la extensión
        const ext = path.extname(fileName).toLowerCase()
        const mimeTypes: { [key: string]: string } = {
          '.pdf': 'application/pdf',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.webp': 'image/webp',
          '.zip': 'application/zip',
        }
        contentType = mimeTypes[ext] || 'application/octet-stream'
      } catch (fileError) {
        console.error('Error reading local file:', fileError)
        return NextResponse.json(
          { error: 'Archivo no encontrado en el servidor' },
          { status: 404 }
        )
      }
    }

    // Retornar el archivo con headers adecuados para descarga
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      }
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      { error: 'Error al descargar el archivo' },
      { status: 500 }
    )
  }
}
