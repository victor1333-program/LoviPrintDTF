import { PriceRange, Product, ProductWithRelations, PriceCalculationResult } from '@/types'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calcula el precio unitario basado en la cantidad y los rangos de precios
 */
export function calculateUnitPrice(
  quantity: number,
  priceRanges: PriceRange[]
): PriceCalculationResult {
  if (!priceRanges || priceRanges.length === 0) {
    throw new Error('No price ranges available')
  }

  // Ordenar rangos por cantidad mínima
  const sortedRanges = [...priceRanges].sort((a, b) => {
    return Number(a.fromQty) - Number(b.fromQty)
  })

  // Encontrar el rango aplicable
  const applicableRange = sortedRanges.find((range) => {
    const fromQty = Number(range.fromQty)
    const toQty = range.toQty ? Number(range.toQty) : Infinity
    return quantity >= fromQty && quantity <= toQty
  })

  if (!applicableRange) {
    // Si no hay rango aplicable, usar el último rango
    const lastRange = sortedRanges[sortedRanges.length - 1]
    const unitPrice = Number(lastRange.price)
    const subtotal = quantity * unitPrice
    const discountPct = Number(lastRange.discountPct || 0)
    const discountAmount = subtotal * (discountPct / 100)

    return {
      unitPrice,
      subtotal,
      discountPct,
      discountAmount,
      appliedRange: lastRange,
    }
  }

  const unitPrice = Number(applicableRange.price)
  const subtotal = quantity * unitPrice
  const discountPct = Number(applicableRange.discountPct || 0)
  const discountAmount = subtotal * (discountPct / 100)

  return {
    unitPrice,
    subtotal,
    discountPct,
    discountAmount,
    appliedRange: applicableRange,
  }
}

/**
 * Calcula el descuento profesional
 */
export function calculateProfessionalDiscount(
  subtotal: number,
  discountPct: number
): number {
  return subtotal * (discountPct / 100)
}

/**
 * Calcula el coste de envío
 */
export function calculateShipping(
  subtotal: number,
  freeShippingThreshold: number,
  standardShippingCost: number
): number {
  if (subtotal >= freeShippingThreshold) {
    return 0
  }
  return standardShippingCost
}

/**
 * Calcula los impuestos
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * taxRate
}

/**
 * Calcula los puntos ganados
 */
export function calculatePoints(totalSpent: number, pointsPerEuro: number): number {
  return Math.floor(totalSpent * pointsPerEuro)
}

/**
 * Formatea el precio de un rango para mostrar
 */
export function formatPriceRange(priceRange: PriceRange): string {
  const fromQty = Number(priceRange.fromQty)
  const toQty = priceRange.toQty ? Number(priceRange.toQty) : null
  const price = Number(priceRange.price)

  if (toQty) {
    return `${fromQty} - ${toQty}m: ${price.toFixed(2)}€/m`
  }
  return `${fromQty}m+: ${price.toFixed(2)}€/m`
}

/**
 * Obtiene todos los rangos de precio formateados para un producto
 */
export function getFormattedPriceRanges(product: ProductWithRelations): string[] {
  if (!product.priceRanges || product.priceRanges.length === 0) {
    return [`Precio base: ${Number(product.basePrice).toFixed(2)}€/${product.unit}`]
  }

  return product.priceRanges
    .sort((a, b) => Number(a.fromQty) - Number(b.fromQty))
    .map(formatPriceRange)
}

/**
 * Calcula el ahorro comparando con el precio base
 */
export function calculateSavings(
  basePrice: number,
  appliedPrice: number,
  quantity: number
): { amount: number; percentage: number } {
  const baseCost = basePrice * quantity
  const appliedCost = appliedPrice * quantity
  const amount = baseCost - appliedCost
  const percentage = (amount / baseCost) * 100

  return {
    amount: Math.max(0, amount),
    percentage: Math.max(0, percentage),
  }
}
