import { prisma } from '@/lib/prisma'
import {
  getProvinceName,
  getCountryInfo,
  normalizeCountryCode,
  formatInternationalMobile,
} from '@/lib/utils/spanish-provinces'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface GLSConfig {
  apiUrl: string
  clientId: string // UID Cliente
  username: string // No se usa en la API, pero guardado por compatibilidad
  password: string // No se usa en la API, pero guardado por compatibilidad
  senderName: string
  senderAddress: string
  senderCity: string
  senderZipcode: string
  senderCountry: string
  senderPhone: string
  senderEmail: string
}

export interface CreateShipmentParams {
  orderId: string
  recipientName: string
  recipientAddress: string
  recipientCity: string
  recipientPostal: string
  recipientCountry?: string
  recipientProvince?: string // Opcional, se calcula automáticamente del CP
  recipientPhone?: string
  recipientMobile?: string
  recipientEmail?: string
  weight?: number
  packages?: number
  notes?: string
  service?: string // Código de servicio GLS (96, 1, 74, etc.)
  timeFrame?: string // Franja horaria (18, 3, 2, 19)
  declaredValue?: number // Valor declarado
  insurance?: boolean // Seguro
  cashOnDelivery?: number // Reembolso
  returnLabel?: boolean // Etiqueta de retorno
  labelFormat?: 'PDF' | 'ZPL' | 'JPG' | 'PNG' | 'EPL' | 'DPL' // Formato etiqueta
}

export interface GLSShipmentResponse {
  success: boolean
  reference: string // Referencia del cliente
  trackingNumber: string // Código de barras GLS
  uid: string // UID del envío
  codexp?: string // Número de expedición GLS
  labelUrl?: string // URL de la etiqueta (si se solicitó)
  labelBase64?: string // Etiqueta en base64
  error?: string
}

export interface TrackingEvent {
  date: Date
  type: string // ESTADO, ENTREGA, POD, FACTURA
  code?: string
  description: string
  location?: string
  agencyCode?: string
  agencyName?: string
}

export interface TrackingInfo {
  trackingNumber: string
  uid: string
  reference: string
  status: string // Estado actual
  statusCode: number
  currentLocation?: string
  estimatedDelivery?: Date
  deliveredDate?: Date
  deliveryPOD?: string // URL imagen POD
  deliverySignature?: string
  deliveryRecipient?: string
  events: TrackingEvent[]
  incidence?: string
}

export interface Digitization {
  date: Date
  type: string // POD, FIRMA, DNI
  imageUrl: string
  notes?: string
}

// ============================================================================
// CLASE PRINCIPAL GLS SERVICE
// ============================================================================

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
            'gls_sender_email',
          ],
        },
      },
    })

    const config: Record<string, string> = {}
    settings.forEach((s) => {
      config[s.key] = s.value
    })

    if (config.gls_enabled !== 'true') {
      return null
    }

    if (!config.gls_api_url || !config.gls_client_id) {
      return null
    }

    return {
      apiUrl: config.gls_api_url.replace('?wsdl', '').replace('?WSDL', ''),
      clientId: config.gls_client_id,
      username: config.gls_username || '',
      password: config.gls_password || '',
      senderName: config.gls_sender_name || '',
      senderAddress: config.gls_sender_address || '',
      senderCity: config.gls_sender_city || '',
      senderZipcode: config.gls_sender_zipcode || '',
      senderCountry: config.gls_sender_country || 'ES',
      senderPhone: config.gls_sender_phone || '',
      senderEmail: config.gls_sender_email || '',
    }
  }

  /**
   * Crear un envío en GLS con estructura correcta
   */
  async createShipment(params: CreateShipmentParams): Promise<GLSShipmentResponse> {
    try {
      // Normalizar país del destinatario
      const recipientCountryCode = normalizeCountryCode(params.recipientCountry || 'ES')
      const recipientCountryInfo = getCountryInfo(recipientCountryCode)

      if (!recipientCountryInfo) {
        throw new Error(`País no soportado: ${params.recipientCountry}`)
      }

      // Obtener provincia del código postal
      const recipientProvince =
        params.recipientProvince || getProvinceName(params.recipientPostal)

      // Determinar servicio automáticamente
      let service = params.service || '96' // BusinessParcel por defecto
      let timeFrame = params.timeFrame || '18' // Sin franja específica

      // Si es envío internacional, usar EuroBusinessParcel
      if (recipientCountryCode !== 'ES' && recipientCountryInfo.euroBusinessParcel) {
        service = '74' // EuroBusinessParcel
      }

      // Fecha de hoy en formato DD/MM/YYYY
      const today = new Date()
      const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${today.getFullYear()}`

      // Normalizar país del remitente
      const senderCountryCode = normalizeCountryCode(this.config.senderCountry)
      const senderCountryInfo = getCountryInfo(senderCountryCode)
      const senderProvince = getProvinceName(this.config.senderZipcode)

      // Formatear teléfono móvil si es internacional
      const formattedMobile = params.recipientMobile
        ? formatInternationalMobile(params.recipientMobile, recipientCountryCode)
        : ''

      // Construir el XML del servicio según documentación oficial
      const servicioXml = `<Servicios uidcliente="${
        this.config.clientId
      }" xmlns="http://www.asmred.com/">
  <Envio>
    <Fecha>${dateStr}</Fecha>
    <Portes>P</Portes>
    <Servicio>${service}</Servicio>
    <Horario>${timeFrame}</Horario>
    <Bultos>${params.packages || 1}</Bultos>
    <Peso>${params.weight ? Number(params.weight).toFixed(1) : '0.5'}</Peso>
    <Retorno>0</Retorno>
    <Pod>N</Pod>${
      params.declaredValue
        ? `
    <Declarado>${Number(params.declaredValue).toFixed(2)}</Declarado>`
        : ''
    }${
        recipientCountryInfo.requiresIncoterm
          ? `
    <Aduanas><Incoterm>18</Incoterm></Aduanas>`
          : ''
      }
    <Remite>
      <Nombre><![CDATA[${this.escapeForCdata(this.config.senderName)}]]></Nombre>
      <Direccion><![CDATA[${this.escapeForCdata(this.config.senderAddress)}]]></Direccion>
      <Poblacion><![CDATA[${this.escapeForCdata(this.config.senderCity)}]]></Poblacion>${
        senderProvince
          ? `
      <Provincia><![CDATA[${this.escapeForCdata(senderProvince)}]]></Provincia>`
          : ''
      }
      <Pais>${senderCountryInfo?.glsCode || '34'}</Pais>
      <CP>${this.config.senderZipcode}</CP>${
        this.config.senderPhone
          ? `
      <Telefono>${this.config.senderPhone}</Telefono>`
          : ''
      }${
        this.config.senderEmail
          ? `
      <Email>${this.config.senderEmail}</Email>`
          : ''
      }
    </Remite>
    <Destinatario>
      <Nombre><![CDATA[${this.escapeForCdata(params.recipientName)}]]></Nombre>
      <Direccion><![CDATA[${this.escapeForCdata(params.recipientAddress)}]]></Direccion>
      <Poblacion><![CDATA[${this.escapeForCdata(params.recipientCity)}]]></Poblacion>${
        recipientProvince
          ? `
      <Provincia><![CDATA[${this.escapeForCdata(recipientProvince)}]]></Provincia>`
          : ''
      }
      <Pais>${recipientCountryInfo.glsCode}</Pais>
      <CP>${params.recipientPostal}</CP>${
        params.recipientPhone
          ? `
      <Telefono>${params.recipientPhone}</Telefono>`
          : ''
      }${
        formattedMobile
          ? `
      <Movil>${formattedMobile}</Movil>`
          : ''
      }${
        params.recipientEmail
          ? `
      <Email>${params.recipientEmail}</Email>`
          : ''
      }${
        params.notes
          ? `
      <Observaciones><![CDATA[${this.escapeForCdata(params.notes)}]]></Observaciones>`
          : ''
      }
    </Destinatario>
    <Referencias>
      <Referencia tipo="C"><![CDATA[${params.orderId}]]></Referencia>
    </Referencias>${
      params.cashOnDelivery
        ? `
    <Importes>
      <Reembolso>${Number(params.cashOnDelivery).toFixed(2)}</Reembolso>
    </Importes>`
        : ''
    }${
      params.insurance
        ? `
    <Seguro tipo="1">
      <Importe>0</Importe>
    </Seguro>`
        : ''
    }${
      params.labelFormat
        ? `
    <DevuelveAdicionales>
      <Etiqueta tipo="${params.labelFormat}"></Etiqueta>
    </DevuelveAdicionales>`
        : ''
    }
  </Envio>
</Servicios>`

      // Preparar el SOAP envelope (SOAP 1.2 según documentación)
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn>${servicioXml}</docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`

      // Log para debug
      console.log('📦 GLS CREATE SHIPMENT REQUEST:', {
        orderId: params.orderId,
        service,
        country: recipientCountryCode,
        date: dateStr,
      })

      // Realizar petición
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: soapEnvelope,
        signal: AbortSignal.timeout(30000),
      })

      const responseText = await response.text()

      console.log('📦 GLS RESPONSE STATUS:', response.status)

      // Verificar errores SOAP
      if (response.status === 500 && responseText.includes('soap:Fault')) {
        const faultMatch = responseText.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
        const errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido'

        console.error('❌ GLS SOAP FAULT:', errorMessage)

        return {
          success: false,
          reference: params.orderId,
          trackingNumber: '',
          uid: '',
          error: `Error GLS: ${errorMessage}`,
        }
      }

      if (!response.ok) {
        console.error('❌ GLS HTTP ERROR:', response.status, responseText)
        return {
          success: false,
          reference: params.orderId,
          trackingNumber: '',
          uid: '',
          error: `Error HTTP ${response.status}: ${response.statusText}`,
        }
      }

      // Parsear respuesta exitosa
      const codbarrasMatch = responseText.match(/<Envio codbarras="([^"]*)"/)
      const uidMatch = responseText.match(/uid="([^"]*)"/)
      const codexpMatch = responseText.match(/codexp="([^"]*)"/)
      const resultMatch = responseText.match(/<Resultado return="([^"]*)"/)
      const errorMatch = responseText.match(/<Errores>([\s\S]*?)<\/Errores>/)

      const returnCode = resultMatch ? resultMatch[1] : '-1'

      if (returnCode !== '0') {
        // Hubo un error
        const errorText = errorMatch?.[1] || 'Error desconocido'
        console.error('❌ GLS ERROR CODE:', returnCode, errorText)

        return {
          success: false,
          reference: params.orderId,
          trackingNumber: '',
          uid: '',
          error: `Error GLS (${returnCode}): ${this.getErrorDescription(returnCode)}`,
        }
      }

      // Éxito
      const trackingNumber = codbarrasMatch?.[1] || ''
      const uid = uidMatch?.[1] || ''
      const codexp = codexpMatch?.[1] || ''

      // Extraer etiqueta si se solicitó
      let labelBase64 = ''
      if (params.labelFormat) {
        const labelMatch = responseText.match(/<Etiqueta[^>]*>([^<]+)<\/Etiqueta>/)
        labelBase64 = labelMatch?.[1] || ''
      }

      console.log('✅ GLS SHIPMENT CREATED:', {
        trackingNumber,
        uid,
        codexp,
        hasLabel: !!labelBase64,
      })

      return {
        success: true,
        reference: params.orderId,
        trackingNumber,
        uid,
        codexp,
        labelBase64,
      }
    } catch (error: any) {
      console.error('❌ GLS CREATE SHIPMENT ERROR:', error)

      return {
        success: false,
        reference: params.orderId,
        trackingNumber: '',
        uid: '',
        error: error.message || 'Error desconocido',
      }
    }
  }

  /**
   * Obtener etiqueta de un envío (EtiquetaEnvioV2)
   */
  async getLabel(
    reference: string,
    format: 'PDF' | 'ZPL' | 'JPG' | 'PNG' | 'EPL' | 'DPL' = 'PDF'
  ): Promise<string | null> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:asm="http://www.asmred.com/">
  <soap:Header/>
  <soap:Body>
    <asm:EtiquetaEnvioV2>
      <uidcliente>${this.config.clientId}</uidcliente>
      <asm:codigo>${reference}</asm:codigo>
      <asm:tipoEtiqueta>${format}</asm:tipoEtiqueta>
    </asm:EtiquetaEnvioV2>
  </soap:Body>
</soap:Envelope>`

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: soapEnvelope,
        signal: AbortSignal.timeout(30000),
      })

      const responseText = await response.text()

      if (!response.ok) {
        console.error('❌ GLS GET LABEL ERROR:', response.status, responseText)
        return null
      }

      // Extraer etiqueta base64
      const labelMatch = responseText.match(/<Etiqueta[^>]*>([^<]+)<\/Etiqueta>/)
      return labelMatch?.[1] || null
    } catch (error) {
      console.error('❌ GLS GET LABEL EXCEPTION:', error)
      return null
    }
  }

  /**
   * Obtener tracking de un envío por referencia (GetExpCli)
   */
  async getTrackingByReference(reference: string): Promise<TrackingInfo | null> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GetExpCli xmlns="http://www.asmred.com/">
      <codigo>${reference}</codigo>
      <uid>${this.config.clientId}</uid>
    </GetExpCli>
  </soap12:Body>
</soap12:Envelope>`

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: soapEnvelope,
        signal: AbortSignal.timeout(30000),
      })

      const responseText = await response.text()

      if (!response.ok) {
        console.error('❌ GLS GET TRACKING ERROR:', response.status)
        return null
      }

      return this.parseTrackingResponse(responseText, reference)
    } catch (error) {
      console.error('❌ GLS GET TRACKING EXCEPTION:', error)
      return null
    }
  }

  /**
   * Obtener tracking de un envío por UID (GetExp)
   */
  async getTrackingByUid(uid: string): Promise<TrackingInfo | null> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GetExp xmlns="http://www.asmred.com/">
      <uid>${uid}</uid>
    </GetExp>
  </soap12:Body>
</soap12:Envelope>`

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: soapEnvelope,
        signal: AbortSignal.timeout(30000),
      })

      const responseText = await response.text()

      if (!response.ok) {
        console.error('❌ GLS GET TRACKING BY UID ERROR:', response.status)
        return null
      }

      return this.parseTrackingResponse(responseText)
    } catch (error) {
      console.error('❌ GLS GET TRACKING BY UID EXCEPTION:', error)
      return null
    }
  }

  /**
   * Parsear respuesta de tracking
   */
  private parseTrackingResponse(xml: string, reference?: string): TrackingInfo | null {
    try {
      // Extraer datos principales
      const uidExpMatch = xml.match(/<uidExp>([^<]+)<\/uidExp>/)
      const codbarMatch = xml.match(/<codbar>([^<]+)<\/codbar>/)
      const codestadoMatch = xml.match(/<codestado>([^<]+)<\/codestado>/)
      const estadoMatch = xml.match(/<estado>([^<]+)<\/estado>/)
      const incidenciaMatch = xml.match(/<incidencia>([^<]+)<\/incidencia>/)
      const podMatch = xml.match(/<pod>([^<]+)<\/pod>/)
      const nombreEntregaMatch = xml.match(/<NombreEntrega>([^<]+)<\/NombreEntrega>/)

      if (!uidExpMatch || !codbarMatch) {
        return null
      }

      const uid = uidExpMatch[1]
      const trackingNumber = codbarMatch[1]
      const statusCode = parseInt(codestadoMatch?.[1] || '0')
      const status = estadoMatch?.[1] || 'Desconocido'
      const incidence = incidenciaMatch?.[1]

      // Parsear eventos de tracking
      const events: TrackingEvent[] = []
      const trackingRegex =
        /<tracking>[\s\S]*?<fecha>([^<]+)<\/fecha>[\s\S]*?<tipo>([^<]+)<\/tipo>[\s\S]*?<evento>([^<]+)<\/evento>[\s\S]*?(?:<plaza>([^<]*)<\/plaza>)?[\s\S]*?(?:<nombreplaza>([^<]*)<\/nombreplaza>)?[\s\S]*?<\/tracking>/g

      let match
      while ((match = trackingRegex.exec(xml)) !== null) {
        events.push({
          date: this.parseGLSDate(match[1]),
          type: match[2],
          description: match[3],
          agencyCode: match[4] || undefined,
          agencyName: match[5] || undefined,
        })
      }

      return {
        trackingNumber,
        uid,
        reference: reference || trackingNumber,
        status,
        statusCode,
        deliveredDate: podMatch ? this.parseGLSDate(podMatch[1]) : undefined,
        deliveryRecipient: nombreEntregaMatch?.[1],
        events,
        incidence: incidence !== 'SIN INCIDENCIA' ? incidence : undefined,
      }
    } catch (error) {
      console.error('❌ ERROR PARSING TRACKING:', error)
      return null
    }
  }

  /**
   * Parsear fecha GLS (formato: DD/MM/YYYY HH:MM:SS o DD/MM/YYYY)
   */
  private parseGLSDate(dateStr: string): Date {
    try {
      const parts = dateStr.split(' ')
      const datePart = parts[0]
      const timePart = parts[1] || '00:00:00'

      const [day, month, year] = datePart.split('/')
      const [hour, minute, second] = timePart.split(':')

      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour || '0'),
        parseInt(minute || '0'),
        parseInt(second || '0')
      )
    } catch {
      return new Date()
    }
  }

  /**
   * Escapar caracteres para CDATA
   */
  private escapeForCdata(text: string | undefined | null): string {
    if (!text) return ''
    // CDATA no necesita escapar, pero por seguridad quitamos ]]>
    return text.replace(/]]>/g, ']] >')
  }

  /**
   * Obtener descripción de error según código
   */
  private getErrorDescription(code: string): string {
    const errors: Record<string, string> = {
      '-1': 'Excepción general',
      '-3': 'El código de barras ya existe',
      '-33': 'CP destino inválido o servicio incorrecto',
      '-48': 'EuroBusinessParcel: número de bultos debe ser 1',
      '-49': 'EuroBusinessParcel: peso debe ser ≤ 40 kg',
      '-52': 'País no incluido en el servicio',
      '-54': 'Email del remitente o destinatario requerido',
      '-55': 'Teléfono móvil del destinatario requerido',
      '-70': 'El número de pedido ya existe',
      '-80': 'Campo obligatorio faltante',
      '-81': 'Formato incorrecto en campo',
      '-82': 'CP o país incorrecto',
      '-88': 'Error en datos del envío',
      '-108': 'Nombre remitente debe tener al menos 3 caracteres',
      '-109': 'Dirección remitente debe tener al menos 3 caracteres',
      '-110': 'Ciudad remitente debe tener al menos 3 caracteres',
      '-111': 'CP remitente debe tener al menos 4 caracteres',
      '-128': 'Nombre destinatario debe tener al menos 3 caracteres',
      '-129': 'Dirección destinatario debe tener al menos 3 caracteres',
      '-130': 'Ciudad destinatario debe tener al menos 3 caracteres',
      '-131': 'CP destinatario debe tener al menos 4 caracteres',
    }

    return errors[code] || `Error ${code}`
  }
}
