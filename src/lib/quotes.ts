import { prisma } from './prisma'
import { getStripeInstance } from './stripe'
import { calculateUnitPrice } from './pricing'
import { Decimal } from '@prisma/client/runtime/library'
import Stripe from 'stripe'

/**
 * Genera un número único de presupuesto con formato PRES-YYYY-NNNN
 */
export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PRES-${year}-`

  // Buscar el último presupuesto del año actual
  const lastQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
  })

  let nextNumber = 1

  if (lastQuote) {
    // Extraer el número del último presupuesto
    const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2])
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }

  // Formatear con ceros a la izquierda (4 dígitos)
  const formattedNumber = nextNumber.toString().padStart(4, '0')

  return `${prefix}${formattedNumber}`
}

/**
 * Interfaz para los parámetros de cálculo de presupuesto
 */
export interface QuotePriceCalculationParams {
  meters: number
  priceRanges: Array<{
    id: string
    fromQty: Decimal
    toQty: Decimal | null
    price: Decimal
    discountPct: Decimal | null
  }>
  // Extras opcionales
  needsCutting?: boolean
  needsLayout?: boolean
  isPriority?: boolean
  // Método de envío
  shippingCost?: number
  // IVA
  taxRate?: number
}

/**
 * Resultado del cálculo de precio de presupuesto
 */
export interface QuotePriceResult {
  pricePerMeter: number
  metersSubtotal: number
  cuttingPrice: number
  layoutPrice: number
  priorityPrice: number
  subtotal: number
  taxAmount: number
  shippingCost: number
  total: number
}

/**
 * Calcula los precios de extras según la cantidad de metros
 * Basado en la lógica existente de extras del sistema
 */
function calculateExtrasPrice(meters: number, extraType: 'cutting' | 'layout' | 'priority'): number {
  // Precios base de extras (puedes ajustarlos según tu negocio)
  const EXTRAS_CONFIG = {
    cutting: {
      // Precio fijo por corte, o puedes hacer variable según metros
      basePrice: 5.0,
      pricePerMeter: 0.5,
    },
    layout: {
      // Precio de maquetación
      basePrice: 10.0,
      pricePerMeter: 0.0, // Sin cargo adicional por metro
    },
    priority: {
      // Priorización: precio escalonado según metros (según código existente)
      ranges: [
        { min: 0, max: 4, price: 4.5 },
        { min: 4, max: 10, price: 18 },
        { min: 10, max: 20, price: 33 },
        { min: 20, max: 30, price: 48 },
        { min: 30, max: 40, price: 58.5 },
        { min: 40, max: 50, price: 73.5 },
        { min: 50, max: Infinity, price: 73.5 }, // Máximo
      ],
    },
  }

  if (extraType === 'cutting') {
    return EXTRAS_CONFIG.cutting.basePrice + meters * EXTRAS_CONFIG.cutting.pricePerMeter
  }

  if (extraType === 'layout') {
    return EXTRAS_CONFIG.layout.basePrice
  }

  if (extraType === 'priority') {
    const range = EXTRAS_CONFIG.priority.ranges.find(
      r => meters >= r.min && meters < r.max
    )
    return range ? range.price : EXTRAS_CONFIG.priority.ranges[EXTRAS_CONFIG.priority.ranges.length - 1].price
  }

  return 0
}

/**
 * Calcula todos los precios de un presupuesto
 */
export function calculateQuotePrice(params: QuotePriceCalculationParams): QuotePriceResult {
  const {
    meters,
    priceRanges,
    needsCutting = false,
    needsLayout = false,
    isPriority = false,
    shippingCost = 0,
    taxRate = 0.21, // IVA 21% por defecto
  } = params

  // 1. Calcular precio por metro según rangos
  const priceCalc = calculateUnitPrice(meters, priceRanges as any)
  const pricePerMeter = priceCalc.unitPrice
  const metersSubtotal = priceCalc.subtotal - priceCalc.discountAmount

  // 2. Calcular extras
  const cuttingPrice = needsCutting ? calculateExtrasPrice(meters, 'cutting') : 0
  const layoutPrice = needsLayout ? calculateExtrasPrice(meters, 'layout') : 0
  const priorityPrice = isPriority ? calculateExtrasPrice(meters, 'priority') : 0

  // 3. Subtotal (sin IVA ni envío)
  const subtotal = metersSubtotal + cuttingPrice + layoutPrice + priorityPrice

  // 4. IVA
  const taxAmount = subtotal * taxRate

  // 5. Total
  const total = subtotal + taxAmount + shippingCost

  return {
    pricePerMeter,
    metersSubtotal,
    cuttingPrice,
    layoutPrice,
    priorityPrice,
    subtotal,
    taxAmount,
    shippingCost,
    total,
  }
}

/**
 * Crea un Payment Link de Stripe para un presupuesto
 */
export async function createStripePaymentLink({
  quoteId,
  quoteNumber,
  amount,
  customerEmail,
  description,
}: {
  quoteId: string
  quoteNumber: string
  amount: number
  customerEmail: string
  description: string
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      return {
        success: false,
        error: 'Stripe no está configurado',
      }
    }

    // Crear un Price (precio único para este presupuesto)
    const price = await stripe.prices.create({
      currency: 'eur',
      unit_amount: Math.round(amount * 100), // Convertir a centavos
      product_data: {
        name: `Presupuesto ${quoteNumber}`,
      },
      metadata: {
        quoteId,
        quoteNumber,
        type: 'quote',
      },
    })

    // Crear el Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        quoteId,
        quoteNumber,
        type: 'quote',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.loviprintdtf.es'}/presupuesto/${quoteId}/confirmacion`,
        },
      },
      customer_creation: 'if_required',
      // Prellenar email del cliente
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Presupuesto ${quoteNumber}`,
          metadata: {
            quoteId,
            quoteNumber,
          },
          custom_fields: [
            {
              name: 'Presupuesto',
              value: quoteNumber,
            },
          ],
        },
      },
    })

    return {
      success: true,
      url: paymentLink.url,
    }
  } catch (error) {
    console.error('Error creating Stripe Payment Link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene los detalles de un Payment Link de Stripe
 */
export async function getStripePaymentLinkDetails(
  paymentLinkId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      return {
        success: false,
        error: 'Stripe no está configurado',
      }
    }

    const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId)

    return {
      success: true,
      data: paymentLink,
    }
  } catch (error) {
    console.error('Error getting Payment Link details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Caduca presupuestos automáticamente
 * Busca presupuestos que hayan superado su fecha de expiración
 */
export async function expireOldQuotes(): Promise<{ expired: number }> {
  const now = new Date()

  try {
    const result = await prisma.quote.updateMany({
      where: {
        status: {
          in: ['PENDING_REVIEW', 'QUOTED', 'PAYMENT_SENT'],
        },
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: 'EXPIRED',
        updatedAt: now,
      },
    })

    console.log(`✅ Caducados ${result.count} presupuestos`)

    return {
      expired: result.count,
    }
  } catch (error) {
    console.error('❌ Error caducando presupuestos:', error)
    return {
      expired: 0,
    }
  }
}

/**
 * Calcula la fecha de expiración de un presupuesto (15 días desde creación)
 */
export function calculateQuoteExpirationDate(createdAt: Date = new Date()): Date {
  const expirationDate = new Date(createdAt)
  expirationDate.setDate(expirationDate.getDate() + 15)
  return expirationDate
}

/**
 * Verifica si un presupuesto ha caducado
 */
export function isQuoteExpired(quote: { expiresAt: Date | null; status: string }): boolean {
  if (!quote.expiresAt) return false
  if (quote.status === 'PAID' || quote.status === 'EXPIRED' || quote.status === 'CANCELLED') {
    return false
  }
  return new Date() > quote.expiresAt
}

/**
 * Obtiene un texto descriptivo del estado de un presupuesto
 */
export function getQuoteStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    PENDING_REVIEW: 'Pendiente de revisión',
    QUOTED: 'Presupuesto enviado',
    PAYMENT_SENT: 'Enlace de pago enviado',
    PAID: 'Pagado',
    EXPIRED: 'Caducado',
    CANCELLED: 'Cancelado',
  }

  return statusTexts[status] || status
}

/**
 * Obtiene el color del badge de estado para UI
 */
export function getQuoteStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PENDING_REVIEW: 'yellow',
    QUOTED: 'blue',
    PAYMENT_SENT: 'purple',
    PAID: 'green',
    EXPIRED: 'gray',
    CANCELLED: 'red',
  }

  return statusColors[status] || 'gray'
}
