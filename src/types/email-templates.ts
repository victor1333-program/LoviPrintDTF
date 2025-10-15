import { EmailTemplateType } from '@prisma/client'

export interface EmailVariable {
  name: string
  description: string
  example: string
  required: boolean
}

export interface EmailTemplateData {
  id?: string
  name: string
  type: EmailTemplateType
  subject: string
  htmlContent: string
  textContent?: string
  variables?: EmailVariable[]
  sampleData?: Record<string, any>
  isActive: boolean
  isDefault: boolean
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  path?: string
  content?: string
  contentType?: string
}

// Definición de variables disponibles por tipo de email
export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateType, EmailVariable[]> = {
  ORDER_CREATED: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'orderNumber', description: 'Número de pedido', example: 'ORD-2024-001', required: true },
    { name: 'totalPrice', description: 'Precio total', example: '150.00', required: true },
    { name: 'subtotal', description: 'Subtotal sin IVA', example: '124.00', required: true },
    { name: 'taxAmount', description: 'IVA', example: '26.00', required: true },
    { name: 'shippingCost', description: 'Coste de envío', example: '10.00', required: true },
    { name: 'discountAmount', description: 'Descuento aplicado', example: '15.00', required: false },
    { name: 'items', description: 'Lista de productos (array)', example: '[{productName, quantity, unitPrice, subtotal}]', required: true },
    { name: 'customerEmail', description: 'Email del cliente', example: 'cliente@example.com', required: true },
    { name: 'customerPhone', description: 'Teléfono del cliente', example: '+34 600 000 000', required: false },
    { name: 'notes', description: 'Notas del pedido', example: 'Entrega urgente', required: false },
  ],
  ORDER_STATUS_CHANGE: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'orderNumber', description: 'Número de pedido', example: 'ORD-2024-001', required: true },
    { name: 'status', description: 'Estado del pedido (código)', example: 'IN_PRODUCTION', required: true },
    { name: 'statusLabel', description: 'Estado del pedido (texto)', example: 'En Producción', required: true },
    { name: 'statusColor', description: 'Color asociado al estado', example: '#f59e0b', required: false },
    { name: 'statusEmoji', description: 'Emoji del estado', example: '🏭', required: false },
  ],
  ORDER_SHIPPED: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'orderNumber', description: 'Número de pedido', example: 'ORD-2024-001', required: true },
    { name: 'trackingNumber', description: 'Número de seguimiento', example: 'TRK123456789', required: false },
    { name: 'trackingUrl', description: 'URL de seguimiento', example: 'https://tracking.com/TRK123456789', required: false },
    { name: 'estimatedDelivery', description: 'Fecha estimada de entrega', example: '2024-01-25', required: false },
    { name: 'carrier', description: 'Empresa de transporte', example: 'Correos Express', required: false },
  ],
  ORDER_DELIVERED: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'orderNumber', description: 'Número de pedido', example: 'ORD-2024-001', required: true },
    { name: 'deliveredAt', description: 'Fecha de entrega', example: '2024-01-25 14:30', required: false },
  ],
  VOUCHER_EXPIRING: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'voucherCode', description: 'Código del bono', example: 'BONO-2024-001', required: true },
    { name: 'voucherName', description: 'Nombre del bono', example: 'Bono 50 metros', required: true },
    { name: 'remainingMeters', description: 'Metros restantes', example: '25.5', required: true },
    { name: 'remainingShipments', description: 'Envíos restantes', example: '3', required: true },
    { name: 'expiresAt', description: 'Fecha de caducidad', example: '2024-02-01', required: true },
    { name: 'daysRemaining', description: 'Días restantes', example: '7', required: true },
  ],
  VOUCHER_ACTIVATED: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'voucherCode', description: 'Código del bono', example: 'BONO-2024-001', required: true },
    { name: 'voucherName', description: 'Nombre del bono', example: 'Bono 50 metros', required: true },
    { name: 'initialMeters', description: 'Metros iniciales', example: '50', required: true },
    { name: 'initialShipments', description: 'Envíos incluidos', example: '5', required: true },
    { name: 'expiresAt', description: 'Fecha de caducidad', example: '2024-12-31', required: false },
  ],
  USER_WELCOME: [
    { name: 'userName', description: 'Nombre del usuario', example: 'Juan Pérez', required: true },
    { name: 'userEmail', description: 'Email del usuario', example: 'usuario@example.com', required: true },
    { name: 'loginUrl', description: 'URL de inicio de sesión', example: 'https://app.com/login', required: false },
  ],
  USER_PASSWORD_RESET: [
    { name: 'userName', description: 'Nombre del usuario', example: 'Juan Pérez', required: true },
    { name: 'resetUrl', description: 'URL para resetear contraseña', example: 'https://app.com/reset?token=...', required: true },
    { name: 'expiresIn', description: 'Tiempo de expiración del link', example: '24 horas', required: false },
  ],
  ADMIN_NEW_ORDER: [
    { name: 'orderNumber', description: 'Número de pedido', example: 'ORD-2024-001', required: true },
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'customerEmail', description: 'Email del cliente', example: 'cliente@example.com', required: true },
    { name: 'customerPhone', description: 'Teléfono del cliente', example: '+34 600 000 000', required: false },
    { name: 'totalPrice', description: 'Precio total', example: '150.00', required: true },
    { name: 'items', description: 'Lista de productos (array)', example: '[{productName, quantity, subtotal, fileName}]', required: true },
    { name: 'notes', description: 'Notas del pedido', example: 'Entrega urgente', required: false },
    { name: 'adminUrl', description: 'URL del panel admin', example: 'https://app.com/admin/pedidos/123', required: false },
  ],
  CUSTOM: [],
}

// Datos de ejemplo por tipo de email
export const EMAIL_TEMPLATE_SAMPLE_DATA: Record<EmailTemplateType, Record<string, any>> = {
  ORDER_CREATED: {
    customerName: 'Juan Pérez',
    orderNumber: 'ORD-2024-001',
    totalPrice: '150.00',
    subtotal: '124.00',
    taxAmount: '26.00',
    shippingCost: '10.00',
    discountAmount: '15.00',
    customerEmail: 'cliente@example.com',
    customerPhone: '+34 600 000 000',
    notes: 'Por favor, entregar en horario de mañana',
    items: [
      { productName: 'DTF Textil Premium', quantity: '10', unitPrice: '8.50', subtotal: '85.00' },
      { productName: 'UV DTF Rígidos', quantity: '5', unitPrice: '12.00', subtotal: '60.00' },
    ],
  },
  ORDER_STATUS_CHANGE: {
    customerName: 'Juan Pérez',
    orderNumber: 'ORD-2024-001',
    status: 'IN_PRODUCTION',
    statusLabel: 'En Producción',
    statusColor: '#f59e0b',
    statusEmoji: '🏭',
  },
  ORDER_SHIPPED: {
    customerName: 'Juan Pérez',
    orderNumber: 'ORD-2024-001',
    trackingNumber: 'TRK123456789',
    trackingUrl: 'https://tracking.correos.es/TRK123456789',
    estimatedDelivery: '25 de enero de 2024',
    carrier: 'Correos Express',
  },
  ORDER_DELIVERED: {
    customerName: 'Juan Pérez',
    orderNumber: 'ORD-2024-001',
    deliveredAt: '25 de enero de 2024 a las 14:30',
  },
  VOUCHER_EXPIRING: {
    customerName: 'María González',
    voucherCode: 'BONO-2024-001',
    voucherName: 'Bono Premium 50 metros',
    remainingMeters: '25.5',
    remainingShipments: '3',
    expiresAt: '1 de febrero de 2024',
    daysRemaining: '7',
  },
  VOUCHER_ACTIVATED: {
    customerName: 'María González',
    voucherCode: 'BONO-2024-001',
    voucherName: 'Bono Premium 50 metros',
    initialMeters: '50',
    initialShipments: '5',
    expiresAt: '31 de diciembre de 2024',
  },
  USER_WELCOME: {
    userName: 'Ana López',
    userEmail: 'ana@example.com',
    loginUrl: 'https://dtfprint.com/login',
  },
  USER_PASSWORD_RESET: {
    userName: 'Carlos Martín',
    resetUrl: 'https://dtfprint.com/reset-password?token=abc123xyz',
    expiresIn: '24 horas',
  },
  ADMIN_NEW_ORDER: {
    orderNumber: 'ORD-2024-001',
    customerName: 'Juan Pérez',
    customerEmail: 'cliente@example.com',
    customerPhone: '+34 600 000 000',
    totalPrice: '150.00',
    notes: 'Entrega urgente - Cliente premium',
    adminUrl: 'https://dtfprint.com/admin/pedidos/ORD-2024-001',
    items: [
      { productName: 'DTF Textil Premium', quantity: '10', subtotal: '85.00', fileName: 'logo-empresa.png' },
      { productName: 'UV DTF Rígidos', quantity: '5', subtotal: '60.00', fileName: 'diseño-taza.pdf' },
    ],
  },
  CUSTOM: {},
}

// Labels para los tipos de email
export const EMAIL_TEMPLATE_TYPE_LABELS: Record<EmailTemplateType, string> = {
  ORDER_CREATED: 'Pedido Creado',
  ORDER_STATUS_CHANGE: 'Cambio de Estado del Pedido',
  ORDER_SHIPPED: 'Pedido Enviado',
  ORDER_DELIVERED: 'Pedido Entregado',
  VOUCHER_EXPIRING: 'Bono Próximo a Caducar',
  VOUCHER_ACTIVATED: 'Bono Activado',
  USER_WELCOME: 'Bienvenida de Usuario',
  USER_PASSWORD_RESET: 'Recuperar Contraseña',
  ADMIN_NEW_ORDER: 'Notificación Admin - Nuevo Pedido',
  CUSTOM: 'Personalizado',
}

// Función para reemplazar variables en una cadena
export function replaceVariables(template: string, data: Record<string, any>): string {
  let result = template

  // Reemplazar variables simples {{variable}}
  Object.keys(data).forEach((key) => {
    const value = data[key]
    const regex = new RegExp(`{{${key}}}`, 'g')

    if (Array.isArray(value)) {
      // Para arrays, no reemplazamos directamente, se debe manejar con loops en el HTML
      result = result.replace(regex, JSON.stringify(value))
    } else if (typeof value === 'object' && value !== null) {
      result = result.replace(regex, JSON.stringify(value))
    } else {
      result = result.replace(regex, String(value ?? ''))
    }
  })

  return result
}

// Función para validar que todas las variables requeridas están presentes
export function validateRequiredVariables(
  type: EmailTemplateType,
  data: Record<string, any>
): { valid: boolean; missing: string[] } {
  const requiredVars = EMAIL_TEMPLATE_VARIABLES[type]
    .filter((v) => v.required)
    .map((v) => v.name)

  const missing = requiredVars.filter((varName) => !(varName in data))

  return {
    valid: missing.length === 0,
    missing,
  }
}
