import { prisma } from './prisma'
import { getStripeInstance } from './stripe'
import { calculateUnitPrice } from './pricing'
import { Decimal } from '@prisma/client/runtime/library'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from './email'

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
  taxExempt?: boolean // Sin IVA (exportación/intracomunitario)
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
    taxExempt = false, // Sin IVA (exportación/intracomunitario)
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

  // 4. Aplicar envío gratuito si el subtotal supera 100€
  const FREE_SHIPPING_THRESHOLD = 100
  const finalShippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shippingCost

  // 5. IVA (0% si está exento)
  const effectiveTaxRate = taxExempt ? 0 : taxRate
  const taxAmount = subtotal * effectiveTaxRate

  // 6. Total
  const total = subtotal + taxAmount + finalShippingCost

  return {
    pricePerMeter,
    metersSubtotal,
    cuttingPrice,
    layoutPrice,
    priorityPrice,
    subtotal,
    taxAmount,
    shippingCost: finalShippingCost,
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

/**
 * Convierte un presupuesto pagado en un pedido oficial
 * @param quoteId - ID del presupuesto a convertir
 * @param adminUserId - ID del admin que realiza la conversión
 * @returns El pedido creado con información adicional
 */
export async function convertQuoteToOrder(quoteId: string, adminUserId: string): Promise<{
  success: boolean
  order?: any
  pointsEarned?: number
  error?: string
}> {
  try {
    // 1. Verificar que el presupuesto existe y está pagado
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        user: true,
        shippingMethod: true,
      },
    })

    if (!quote) {
      return { success: false, error: 'Presupuesto no encontrado' }
    }

    if (quote.status !== 'PAID') {
      return { success: false, error: 'El presupuesto debe estar pagado para convertirlo a pedido' }
    }

    if (quote.orderId) {
      return { success: false, error: 'Este presupuesto ya fue convertido a pedido' }
    }

    if (!quote.estimatedMeters || !quote.estimatedTotal) {
      return { success: false, error: 'El presupuesto no tiene valores calculados' }
    }

    // 2. Buscar el producto DTF
    const dtfProduct = await prisma.product.findFirst({
      where: { productType: 'DTF_TEXTILE', isActive: true },
    })

    if (!dtfProduct) {
      return { success: false, error: 'Producto DTF no encontrado' }
    }

    // 3. Generar número de pedido
    const { generateOrderNumber } = await import('./utils')
    const orderNumber = generateOrderNumber(false)

    // 4. Determinar si se pagó con voucher
    const isPaidWithVoucher = quote.paymentMethod === 'VOUCHER' && quote.voucherId

    // 5. Calcular puntos de fidelización si el usuario está registrado
    // (Si se pagó con bono, no se otorgan puntos porque no gastó dinero real)
    let pointsEarned = 0
    let loyaltyTier = 'BRONZE'

    if (quote.userId && !isPaidWithVoucher) {
      const user = await prisma.user.findUnique({
        where: { id: quote.userId },
        select: {
          loyaltyTier: true,
          totalSpent: true,
        },
      })

      if (user) {
        loyaltyTier = user.loyaltyTier

        // Calcular puntos según tier
        const pointMultipliers: Record<string, number> = {
          BRONZE: 1.0,
          SILVER: 1.25,
          GOLD: 1.5,
          PLATINUM: 2.0,
        }

        const multiplier = pointMultipliers[loyaltyTier] || 1.0
        const pointsPerEuro = 1 // 1 punto por euro gastado (configurable)

        pointsEarned = Math.floor(Number(quote.estimatedTotal) * pointsPerEuro * multiplier)
      }
    }

    // 6. Crear el pedido en una transacción
    const order = await prisma.$transaction(async (tx) => {
      // Crear Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: quote.userId,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          voucherId: isPaidWithVoucher ? quote.voucherId : null,
          shippingMethodId: quote.shippingMethodId,
          // Si se pagó con bono, todos los precios deben ser 0
          subtotal: isPaidWithVoucher ? 0 : Number(quote.subtotal),
          discountAmount: 0,
          taxAmount: isPaidWithVoucher ? 0 : Number(quote.taxAmount),
          shippingCost: isPaidWithVoucher ? 0 : Number(quote.shippingCost || 0),
          totalPrice: isPaidWithVoucher ? 0 : Number(quote.estimatedTotal),
          metersOrdered: Number(quote.estimatedMeters),
          pricePerMeter: Number(quote.pricePerMeter),
          designFileUrl: quote.designFileUrl,
          designFileName: quote.designFileName,
          pointsEarned,
          pointsUsed: 0,
          pointsDiscount: 0,
          taxExempt: quote.taxExempt || false,
          status: 'CONFIRMED', // Pedido confirmado porque ya está pagado
          paymentStatus: 'PAID',
          paymentMethod: quote.paymentMethod || 'MANUAL',
          stripePaymentId: quote.stripePaymentId,
          notes: quote.customerNotes,
          adminNotes: quote.adminNotes,
          shippingAddress: quote.shippingAddress as any,
        },
      })

      // Crear OrderItem para los metros de DTF
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: dtfProduct.id,
          productName: `Impresión DTF - ${quote.estimatedMeters}m`,
          quantity: Number(quote.estimatedMeters),
          unitPrice: Number(quote.pricePerMeter),
          subtotal: Number(quote.subtotal),
          fileUrl: quote.designFileUrl,
          fileName: quote.designFileName,
          fileMetadata: (quote.fileMetadata || null) as any,
          customizations: {
            cutting: quote.needsCutting,
            cuttingPrice: quote.cuttingPrice ? Number(quote.cuttingPrice) : null,
            layout: quote.needsLayout,
            layoutPrice: quote.layoutPrice ? Number(quote.layoutPrice) : null,
            priority: quote.isPriority,
            priorityPrice: quote.priorityPrice ? Number(quote.priorityPrice) : null,
          },
        },
      })

      // Crear historial de estado inicial
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'CONFIRMED',
          notes: `Pedido creado desde presupuesto ${quote.quoteNumber}`,
          createdBy: adminUserId,
        },
      })

      // Actualizar Quote con el orderId
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          orderId: newOrder.id,
          convertedAt: new Date(),
        },
      })

      // Si hay usuario, actualizar sus puntos y total gastado
      if (quote.userId && pointsEarned > 0) {
        const currentUser = await tx.user.findUnique({
          where: { id: quote.userId },
          select: {
            loyaltyPoints: true,
            totalSpent: true,
          },
        })

        if (currentUser) {
          const newTotalSpent = Number(currentUser.totalSpent) + Number(quote.estimatedTotal)
          const newLoyaltyPoints = currentUser.loyaltyPoints + pointsEarned

          // Determinar nuevo tier según gasto total
          let newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE'
          if (newTotalSpent >= 1000) newTier = 'PLATINUM'
          else if (newTotalSpent >= 500) newTier = 'GOLD'
          else if (newTotalSpent >= 200) newTier = 'SILVER'

          await tx.user.update({
            where: { id: quote.userId },
            data: {
              loyaltyPoints: newLoyaltyPoints,
              totalSpent: newTotalSpent,
              loyaltyTier: newTier,
            },
          })

          // Registrar transacción de puntos si existe LoyaltyPoints
          const loyaltyRecord = await tx.loyaltyPoints.findUnique({
            where: { userId: quote.userId },
          })

          if (loyaltyRecord) {
            await tx.loyaltyPoints.update({
              where: { userId: quote.userId },
              data: {
                totalPoints: { increment: pointsEarned },
                availablePoints: { increment: pointsEarned },
                lifetimePoints: { increment: pointsEarned },
                tier: newTier,
              },
            })

            await tx.pointTransaction.create({
              data: {
                pointsId: loyaltyRecord.id,
                points: pointsEarned,
                type: 'earned',
                description: `Puntos ganados por pedido ${orderNumber} (desde presupuesto ${quote.quoteNumber})`,
                orderId: newOrder.id,
              },
            })
          }
        }
      }

      return newOrder
    })

    // 7. Obtener el pedido completo con sus items para el email
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingMethod: true,
        user: true,
      },
    })

    // 8. Enviar email de confirmación de pedido al cliente
    try {
      if (orderWithItems) {
        await sendOrderConfirmationEmail(orderWithItems)
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError)
      // No fallar la conversión si falla el email
    }

    return {
      success: true,
      order,
      pointsEarned,
    }
  } catch (error) {
    console.error('Error converting quote to order:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al convertir',
    }
  }
}
