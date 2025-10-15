import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Obtener configuración de Cloudinary desde la base de datos
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
      return NextResponse.json({
        success: false,
        error: 'Configuración de Cloudinary incompleta. Asegúrate de completar todos los campos (Cloud Name, API Key, API Secret)'
      }, { status: 400 })
    }

    // Configurar Cloudinary con las credenciales
    cloudinary.config({
      cloud_name: config.cloudinary_cloud_name,
      api_key: config.cloudinary_api_key,
      api_secret: config.cloudinary_api_secret,
    })

    // Intentar hacer un ping a la API de Cloudinary
    const result = await cloudinary.api.ping()

    if (result.status === 'ok') {
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con Cloudinary',
        cloudName: config.cloudinary_cloud_name
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con Cloudinary. Verifica tus credenciales.'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error testing Cloudinary:', error)

    // Manejar errores específicos de Cloudinary
    if (error.error?.http_code === 401) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas. Verifica tu API Key y API Secret.'
      }, { status: 401 })
    }

    if (error.error?.http_code === 404) {
      return NextResponse.json({
        success: false,
        error: 'Cloud Name no encontrado. Verifica tu Cloud Name.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error al probar la conexión con Cloudinary'
    }, { status: 500 })
  }
}
