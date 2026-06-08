import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// IVA español 21%. Los precios en BD (Product.basePrice, PriceRange.price,
// ShippingMethod.price) se almacenan SIN IVA. En cualquier display de catálogo
// orientado al cliente (homepage, detalle de producto, listados) se muestra
// con IVA incluido usando estos helpers, ya que la web vende con la etiqueta
// "IVA incluido". Carrito, checkout, factura y pedidos siguen mostrando
// desglose subtotal + IVA + total como exige la ley.
export const TAX_RATE = 0.21
export const TAX_MULTIPLIER = 1 + TAX_RATE

export function withTax(amountWithoutTax: number): number {
  return amountWithoutTax * TAX_MULTIPLIER
}

// Inverso de withTax: dado un precio CON IVA (el que escribe el admin),
// devuelve el precio SIN IVA redondeado a 2 decimales (el que se guarda
// en BD). Pasa la prueba ida-y-vuelta cuando el número con IVA tiene
// expresión decimal exacta: 11 → 9.09; 375 → 309.92; etc.
export function withoutTax(amountWithTax: number): number {
  return Math.round((amountWithTax / TAX_MULTIPLIER) * 100) / 100
}

export function formatPriceWithTax(amountWithoutTax: number): string {
  return formatCurrency(withTax(amountWithoutTax))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function generateOrderNumber(isVoucher: boolean = false): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  const prefix = isVoucher ? 'BONO' : 'DTF'
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}
