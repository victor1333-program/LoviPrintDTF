import { BUSINESS } from "./business-info"

/**
 * Construye una URL de WhatsApp Business apuntando al número del negocio
 * con el mensaje codificado. wa.me requiere el número sin "+", espacios ni guiones.
 */
export function buildWhatsAppUrl(message: string): string {
  const cleanNumber = BUSINESS.phoneE164.replace(/[^\d]/g, "")
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}
