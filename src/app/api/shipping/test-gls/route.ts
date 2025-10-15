import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Obtener configuración de GLS desde la base de datos
    const settings = await prisma.setting.findMany({
      where: {
        category: 'shipping',
        key: {
          in: [
            'gls_enabled',
            'gls_api_url',
            'gls_client_id',
            'gls_username',
            'gls_password',
            'gls_test_mode'
          ]
        }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    // Verificar que GLS esté habilitado
    if (config.gls_enabled !== 'true') {
      return NextResponse.json({
        success: false,
        error: 'La integración con GLS no está activada. Marca la casilla "Activar integración con GLS" y guarda los cambios.'
      }, { status: 400 })
    }

    // Verificar que tenemos toda la configuración necesaria
    if (!config.gls_api_url || !config.gls_client_id || !config.gls_username || !config.gls_password) {
      return NextResponse.json({
        success: false,
        error: 'Configuración de GLS incompleta. Asegúrate de completar todos los campos obligatorios: API URL, Client ID, Usuario y Contraseña'
      }, { status: 400 })
    }

    // Preparar el SOAP envelope para llamar a GetPaisesEE (método de prueba)
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetPaisesEE xmlns="http://www.asmred.com/">
      <cuenta>${config.gls_username}</cuenta>
      <uid>${config.gls_client_id}</uid>
    </GetPaisesEE>
  </soap:Body>
</soap:Envelope>`

    // Extraer la URL base sin ?wsdl
    const apiUrl = config.gls_api_url.replace('?wsdl', '').replace('?WSDL', '')

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.asmred.com/GetPaisesEE',
        },
        body: soapEnvelope,
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      })

      const responseText = await response.text()

      // Si la respuesta es 500 y contiene "soap:Fault", es un error SOAP
      if (response.status === 500 && responseText.includes('soap:Fault')) {
        // Extraer el mensaje de error del XML
        const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
        const errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido'

        // Si el error contiene información sobre credenciales inválidas
        if (errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('inválid') ||
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('authentication')) {
          return NextResponse.json({
            success: false,
            error: `Credenciales inválidas: ${errorMessage}`
          }, { status: 401 })
        }

        return NextResponse.json({
          success: false,
          error: `Error de GLS: ${errorMessage}`
        }, { status: 500 })
      }

      // Si la respuesta no es exitosa
      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `Error de GLS: ${response.status} - ${response.statusText}`
        }, { status: response.status })
      }

      // Si llegamos aquí, la respuesta es exitosa
      // Verificar que el XML de respuesta contiene datos válidos
      if (responseText.includes('GetPaisesEEResponse')) {
        const isTestMode = config.gls_test_mode === 'true'
        return NextResponse.json({
          success: true,
          message: `✅ Conexión exitosa con GLS ${isTestMode ? '(Modo Test)' : '(Modo Producción)'}`,
          testMode: isTestMode,
          details: 'Credenciales validadas correctamente. La API SOAP de GLS está operativa.'
        })
      } else {
        // Respuesta inesperada
        return NextResponse.json({
          success: false,
          error: 'Respuesta inesperada de la API de GLS',
          response: responseText.substring(0, 500) // Primeros 500 caracteres para debug
        }, { status: 500 })
      }

    } catch (fetchError: any) {
      // Error de red o timeout
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Timeout: No se pudo conectar con la API de GLS. Verifica la URL de la API.'
        }, { status: 504 })
      }

      throw fetchError
    }

  } catch (error: any) {
    console.error('Error testing GLS:', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Error al probar la conexión con GLS. Verifica tu configuración.'
    }, { status: 500 })
  }
}
