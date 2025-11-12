import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * GET /api/admin/download-attachment?url=...&filename=...
 * Descarga archivos adjuntos de pedidos de manera segura (solo admin)
 *
 * Este endpoint actúa como proxy para descargar archivos desde Cloudinary
 * evitando problemas de CORS en el frontend
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Verificar que el usuario sea administrador
    if (!session || !session.user || session.user.role !== 'ADMIN') {
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

    // Validar que la URL sea de Cloudinary (seguridad)
    if (!fileUrl.includes('cloudinary.com')) {
      return NextResponse.json(
        { error: 'URL no válida' },
        { status: 400 }
      )
    }

    // Descargar el archivo desde Cloudinary
    const response = await fetch(fileUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al descargar el archivo desde Cloudinary' },
        { status: response.status }
      )
    }

    // Obtener el contenido del archivo
    const blob = await response.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())

    // Retornar el archivo con headers adecuados para descarga
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
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
