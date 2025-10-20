import { NextResponse } from 'next/server'
import { GLSService } from '@/lib/services/gls-service'
import { auth } from '@/auth'

/**
 * GET /api/test-gls-shipment
 * Endpoint de prueba para debuggear la creación de envíos en GLS
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configuración de GLS
    const glsConfig = await GLSService.getConfig()

    if (!glsConfig) {
      return NextResponse.json({
        success: false,
        error: 'GLS no está configurado',
        details: 'Verifica que todos los campos de GLS estén completos en Configuración > Envíos'
      })
    }

    // Mostrar configuración (sin contraseña)
    const configInfo = {
      apiUrl: glsConfig.apiUrl,
      clientId: glsConfig.clientId,
      username: glsConfig.username,
      senderName: glsConfig.senderName,
      senderAddress: glsConfig.senderAddress,
      senderCity: glsConfig.senderCity,
      senderZipcode: glsConfig.senderZipcode,
      senderCountry: glsConfig.senderCountry,
      senderPhone: glsConfig.senderPhone,
      senderEmail: glsConfig.senderEmail,
    }

    console.log('=== GLS Config (test) ===')
    console.log(JSON.stringify(configInfo, null, 2))

    // Crear servicio GLS
    const glsService = new GLSService(glsConfig)

    // Intentar crear un envío de prueba
    try {
      const testShipment = await glsService.createShipment({
        orderId: 'TEST-' + Date.now(),
        recipientName: 'Cliente de Prueba',
        recipientAddress: 'Calle Test 123',
        recipientCity: 'Madrid',
        recipientPostal: '28001',
        recipientCountry: 'ES',
        recipientPhone: '666555444',
        recipientEmail: 'test@example.com',
        weight: 0.5,
        packages: 1,
        notes: 'Envío de prueba'
      })

      return NextResponse.json({
        success: true,
        message: '✅ Envío de prueba creado exitosamente en GLS',
        config: configInfo,
        glsResponse: testShipment
      })

    } catch (glsError: any) {
      console.error('=== GLS Error ===')
      console.error('Message:', glsError.message)
      console.error('Stack:', glsError.stack)

      return NextResponse.json({
        success: false,
        error: 'Error al crear envío de prueba en GLS',
        details: glsError.message,
        config: configInfo
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('=== General Error ===')
    console.error(error)

    return NextResponse.json({
      success: false,
      error: 'Error general',
      details: error.message
    }, { status: 500 })
  }
}
