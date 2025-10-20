import { prisma } from '@/lib/prisma'

interface GLSConfig {
  apiUrl: string
  clientId: string
  username: string
  password: string
  senderName: string
  senderAddress: string
  senderCity: string
  senderZipcode: string
  senderCountry: string
  senderPhone: string
  senderEmail: string
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
          in: [
            'gls_api_url',
            'gls_client_id',
            'gls_username',
            'gls_password',
            'gls_enabled',
            'gls_sender_name',
            'gls_sender_address',
            'gls_sender_city',
            'gls_sender_zipcode',
            'gls_sender_country',
            'gls_sender_phone',
            'gls_sender_email'
          ]
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
      password: config.gls_password,
      senderName: config.gls_sender_name || '',
      senderAddress: config.gls_sender_address || '',
      senderCity: config.gls_sender_city || '',
      senderZipcode: config.gls_sender_zipcode || '',
      senderCountry: config.gls_sender_country || 'ES',
      senderPhone: config.gls_sender_phone || '',
      senderEmail: config.gls_sender_email || ''
    }
  }

  /**
   * Crear un envío en GLS
   */
  async createShipment(params: CreateShipmentParams): Promise<GLSShipmentResponse> {
    // Construir el XML interno del servicio
    const servicioXml = `<Servicios>
  <Servicio uid="${this.config.clientId}">
    <Remitente>
      <Cuenta>${this.config.username}</Cuenta>
      <Nombre>${this.escapeXml(this.config.senderName)}</Nombre>
      <Direccion>${this.escapeXml(this.config.senderAddress)}</Direccion>
      <Poblacion>${this.escapeXml(this.config.senderCity)}</Poblacion>
      <CodPostal>${this.config.senderZipcode}</CodPostal>
      <Pais>${this.config.senderCountry}</Pais>
      ${this.config.senderPhone ? `<Telefono>${this.config.senderPhone}</Telefono>` : ''}
      ${this.config.senderEmail ? `<Email>${this.config.senderEmail}</Email>` : ''}
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
  </Servicio>
</Servicios>`

    // Preparar el SOAP envelope para crear envío usando GrabaServicios
    // El docIn se pasa como CDATA para que no se parsee como XML
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn><![CDATA[${servicioXml}]]></docIn>
    </GrabaServicios>
  </soap:Body>
</soap:Envelope>`

    // Log del SOAP envelope para debug
    console.log('GLS SOAP Request:', soapEnvelope)

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.asmred.com/GrabaServicios',
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(30000) // 30 segundos timeout
    })

    const responseText = await response.text()

    // Log de la respuesta para debug
    console.log('GLS Response Status:', response.status)
    console.log('GLS Response Text:', responseText)

    // Verificar errores SOAP
    if (response.status === 500 && responseText.includes('soap:Fault')) {
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const faultDetailMatch = responseText.match(/<detail>(.*?)<\/detail>/s)
      const errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido'
      const errorDetail = faultDetailMatch ? faultDetailMatch[1] : ''

      console.error('SOAP Fault:', errorMessage)
      console.error('SOAP Detail:', errorDetail)
      console.error('Full Response:', responseText)

      throw new Error(`Error GLS: ${errorMessage}${errorDetail ? ' - ' + errorDetail : ''}`)
    }

    if (!response.ok) {
      console.error('HTTP Error Response:', responseText)
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
