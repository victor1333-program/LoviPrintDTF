import { prisma } from '@/lib/prisma'

interface GLSConfig {
  apiUrl: string
  clientId: string
  username: string
  password: string
}

interface CreateShipmentParams {
  orderId: string
  recipientName: string
  recipientAddress: string
  recipientCity: string
  recipientPostal: string
  recipientCountry?: string
  recipientPhone?: string
  recipientEmail?: string
  weight?: number
  packages?: number
  notes?: string
}

interface GLSShipmentResponse {
  reference: string
  trackingNumber: string
  labelUrl?: string
}

export class GLSService {
  private config: GLSConfig

  constructor(config: GLSConfig) {
    this.config = config
  }

  /**
   * Obtener configuración de GLS desde la base de datos
   */
  static async getConfig(): Promise<GLSConfig | null> {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'shipping',
        key: {
          in: ['gls_api_url', 'gls_client_id', 'gls_username', 'gls_password', 'gls_enabled']
        }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    if (config.gls_enabled !== 'true') {
      return null
    }

    if (!config.gls_api_url || !config.gls_client_id || !config.gls_username || !config.gls_password) {
      return null
    }

    return {
      apiUrl: config.gls_api_url.replace('?wsdl', '').replace('?WSDL', ''),
      clientId: config.gls_client_id,
      username: config.gls_username,
      password: config.gls_password
    }
  }

  /**
   * Crear un envío en GLS
   */
  async createShipment(params: CreateShipmentParams): Promise<GLSShipmentResponse> {
    // Preparar el SOAP envelope para crear envío
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GrabaExpedicion xmlns="http://www.asmred.com/">
      <uid>${this.config.clientId}</uid>
      <datos>
        <Expedicion>
          <Remitente>
            <Cuenta>${this.config.username}</Cuenta>
            <Codigo>1</Codigo>
          </Remitente>
          <Destinatario>
            <Nombre>${this.escapeXml(params.recipientName)}</Nombre>
            <Direccion>${this.escapeXml(params.recipientAddress)}</Direccion>
            <Poblacion>${this.escapeXml(params.recipientCity)}</Poblacion>
            <Provincia>${this.escapeXml(params.recipientCity)}</Provincia>
            <CodPostal>${params.recipientPostal}</CodPostal>
            <Pais>${params.recipientCountry || 'ES'}</Pais>
            ${params.recipientPhone ? `<Telefono>${params.recipientPhone}</Telefono>` : ''}
            ${params.recipientEmail ? `<Email>${params.recipientEmail}</Email>` : ''}
          </Destinatario>
          <Envio>
            <Bultos>${params.packages || 1}</Bultos>
            ${params.weight ? `<Peso>${params.weight}</Peso>` : ''}
            <Retorno>N</Retorno>
            <POD>N</POD>
            ${params.notes ? `<Observaciones>${this.escapeXml(params.notes)}</Observaciones>` : ''}
          </Envio>
          <Referencia>${params.orderId}</Referencia>
        </Expedicion>
      </datos>
    </GrabaExpedicion>
  </soap:Body>
</soap:Envelope>`

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.asmred.com/GrabaExpedicion',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(30000) // 30 segundos timeout
    })

    const responseText = await response.text()

    // Verificar errores SOAP
    if (response.status === 500 && responseText.includes('soap:Fault')) {
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido'
      throw new Error(`Error GLS: ${errorMessage}`)
    }

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`)
    }

    // Parsear respuesta
    const referenceMatch = responseText.match(/<Referencia>(.*?)<\/Referencia>/)
    const trackingMatch = responseText.match(/<NumeroEnvio>(.*?)<\/NumeroEnvio>/)

    if (!referenceMatch || !trackingMatch) {
      throw new Error('Respuesta inválida de GLS: No se pudo obtener referencia o tracking')
    }

    return {
      reference: referenceMatch[1],
      trackingNumber: trackingMatch[1],
    }
  }

  /**
   * Obtener etiqueta PDF de un envío
   */
  async getLabel(glsReference: string): Promise<string> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetEtiquetaEnvio xmlns="http://www.asmred.com/">
      <uid>${this.config.clientId}</uid>
      <referencia>${glsReference}</referencia>
      <formato>PDF</formato>
    </GetEtiquetaEnvio>
  </soap:Body>
</soap:Envelope>`

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.asmred.com/GetEtiquetaEnvio',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(30000)
    })

    const responseText = await response.text()

    if (response.status === 500 && responseText.includes('soap:Fault')) {
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido'
      throw new Error(`Error GLS: ${errorMessage}`)
    }

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`)
    }

    // La respuesta contiene el PDF en base64
    const base64Match = responseText.match(/<GetEtiquetaEnvioResult>(.*?)<\/GetEtiquetaEnvioResult>/)

    if (!base64Match) {
      throw new Error('No se pudo obtener la etiqueta PDF')
    }

    return base64Match[1]
  }

  /**
   * Obtener seguimiento de un envío
   */
  async getTracking(trackingNumber: string) {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTrazabilidadEnvio xmlns="http://www.asmred.com/">
      <uid>${this.config.clientId}</uid>
      <numeroEnvio>${trackingNumber}</numeroEnvio>
    </GetTrazabilidadEnvio>
  </soap:Body>
</soap:Envelope>`

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.asmred.com/GetTrazabilidadEnvio',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(30000)
    })

    const responseText = await response.text()

    if (response.status === 500 && responseText.includes('soap:Fault')) {
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido'
      throw new Error(`Error GLS: ${errorMessage}`)
    }

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`)
    }

    // Parsear eventos de seguimiento del XML
    const events = this.parseTrackingEvents(responseText)

    return events
  }

  /**
   * Parsear eventos de seguimiento del XML
   */
  private parseTrackingEvents(xml: string) {
    const events: Array<{
      status: string
      description: string
      location: string | null
      eventDate: Date
    }> = []

    // Regex para extraer eventos (esto depende de la estructura real del XML de GLS)
    const eventRegex = /<Evento>[\s\S]*?<Fecha>(.*?)<\/Fecha>[\s\S]*?<Descripcion>(.*?)<\/Descripcion>[\s\S]*?(?:<Localidad>(.*?)<\/Localidad>)?[\s\S]*?<\/Evento>/g

    let match
    while ((match = eventRegex.exec(xml)) !== null) {
      events.push({
        status: this.determineStatus(match[2]),
        description: match[2],
        location: match[3] || null,
        eventDate: new Date(match[1])
      })
    }

    return events
  }

  /**
   * Determinar el estado basado en la descripción
   */
  private determineStatus(description: string): string {
    const desc = description.toLowerCase()

    if (desc.includes('entregado') || desc.includes('delivered')) return 'DELIVERED'
    if (desc.includes('reparto') || desc.includes('delivery')) return 'OUT_FOR_DELIVERY'
    if (desc.includes('tránsito') || desc.includes('transit')) return 'IN_TRANSIT'
    if (desc.includes('recogido') || desc.includes('picked')) return 'PICKED_UP'
    if (desc.includes('incidencia') || desc.includes('exception')) return 'EXCEPTION'

    return 'IN_TRANSIT'
  }

  /**
   * Escapar caracteres especiales XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
