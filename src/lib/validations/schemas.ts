/**
 * Esquemas de validación Zod centralizados
 * Para validar inputs en API routes y prevenir errores e inyecciones
 */

import { z } from 'zod'

// ==================== COMMON SCHEMAS ====================

export const emailSchema = z.string().email('Email inválido')

/**
 * Normaliza un teléfono: quita espacios, guiones y paréntesis.
 * Si son 9 dígitos y empieza por 6/7/8/9, antepone +34 (España).
 */
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()\.]/g, '')
  // Número español de 9 dígitos sin prefijo → añadir +34
  if (/^[6789]\d{8}$/.test(cleaned)) {
    return `+34${cleaned}`
  }
  return cleaned
}

export const phoneSchema = z.string()
  .transform((val) => normalizePhone(val))
  .refine(
    (val) => /^\+?[1-9]\d{6,14}$/.test(val),
    { message: 'Número de teléfono inválido' }
  )
  .optional()

export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')

export const idSchema = z.string().cuid('ID inválido')

// Schema más flexible para productId que acepta CUIDs o IDs personalizados de productos (como voucher_prod_*)
export const productIdSchema = z.string().min(1, 'Product ID requerido')

// Schema más flexible para shippingMethodId que acepta UUIDs, CUIDs o cualquier ID personalizado
export const shippingMethodIdSchema = z.string().min(1, 'Shipping Method ID requerido')

export const positiveNumberSchema = z.number().positive('Debe ser un número positivo')

export const nonNegativeNumberSchema = z.number().nonnegative('No puede ser negativo')

// ==================== ADDRESS SCHEMA ====================

export const addressSchema = z.object({
  street: z.string().min(3, 'Dirección muy corta').max(200, 'Dirección muy larga'),
  city: z.string().min(2, 'Ciudad muy corta').max(100, 'Ciudad muy larga'),
  state: z.string().min(2, 'Provincia muy corta').max(100, 'Provincia muy larga').optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos'),
  country: z.string().min(2, 'País muy corto').max(100, 'País muy largo').default('España'),
  phone: phoneSchema,
  firstName: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo').optional(),
  lastName: z.string().min(2, 'Apellido muy corto').max(100, 'Apellido muy largo').optional(),
})

// ==================== CART SCHEMAS ====================

export const addToCartSchema = z.object({
  productId: productIdSchema, // Usar productIdSchema para soportar IDs de productos de bonos
  quantity: positiveNumberSchema,
  customizations: z.object({
    width: positiveNumberSchema.optional(),
    height: positiveNumberSchema.optional(),
    extras: z.object({
      layout: z.union([z.boolean(), z.object({ price: z.number() })]).optional(),
      cutting: z.union([z.boolean(), z.object({ price: z.number() })]).optional(),
      prioritize: z.union([z.boolean(), z.object({ price: z.number() })]).optional(),
    }).optional(),
    voucherTemplateId: z.string().optional(),
  }).optional(),
  // Aceptar URLs absolutas (Cloudinary) o rutas relativas (almacenamiento local)
  fileUrl: z.string().refine(
    (val) => {
      // Permitir URLs absolutas (http/https) o rutas que empiecen con /
      return /^https?:\/\/.+/.test(val) || /^\/[^/].*/.test(val)
    },
    { message: 'URL de archivo inválida' }
  ).optional(),
  fileName: z.string().max(255, 'Nombre de archivo muy largo').optional(),
  fileSize: nonNegativeNumberSchema.optional(),
  fileMetadata: z.any().optional(),
})

export const updateCartItemSchema = z.object({
  quantity: positiveNumberSchema.optional(),
  customizations: z.object({
    width: positiveNumberSchema.optional(),
    height: positiveNumberSchema.optional(),
    extras: z.object({
      layout: z.boolean().optional(),
      cutting: z.boolean().optional(),
      prioritize: z.boolean().optional(),
    }).optional(),
  }).optional(),
})

// ==================== ORDER SCHEMAS ====================

// Schema para formato checkout DTF
export const createCheckoutOrderSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().max(200, 'Nombre de empresa muy largo').optional(),
  taxId: z.string().max(20, 'NIF/CIF muy largo').optional(),
  isProfessional: z.boolean().optional(),
  metersOrdered: positiveNumberSchema,
  pricePerMeter: positiveNumberSchema,
  subtotal: nonNegativeNumberSchema,
  discountAmount: nonNegativeNumberSchema.optional(),
  taxAmount: nonNegativeNumberSchema,
  shippingCost: nonNegativeNumberSchema,
  totalPrice: nonNegativeNumberSchema,
  // Aceptar URLs absolutas (Cloudinary) o rutas relativas (almacenamiento local)
  designFileUrl: z.string().refine(
    (val) => {
      return /^https?:\/\/.+/.test(val) || /^\/[^/].*/.test(val)
    },
    { message: 'URL de archivo inválida' }
  ),
  designFileName: z.string().max(255, 'Nombre de archivo muy largo'),
  voucherCode: z.string().max(50, 'Código muy largo').optional(),
  discountCodeId: idSchema.optional(),
  shippingMethodId: shippingMethodIdSchema.optional(),
  notes: z.string().max(1000, 'Notas muy largas').optional(),
  shippingAddress: addressSchema,
  saveProfile: z.boolean().optional(),
  saveAddress: z.boolean().optional(),
})

// Schema para formato antiguo (productos regulares)
export const createRegularOrderSchema = z.object({
  customerName: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  customerEmail: emailSchema,
  customerPhone: phoneSchema.optional(),
  items: z.array(z.object({
    productId: productIdSchema, // Usar productIdSchema en lugar de idSchema para soportar IDs de productos de bonos
    productName: z.string().min(1, 'Nombre de producto requerido'),
    quantity: positiveNumberSchema,
    unitPrice: positiveNumberSchema,
    subtotal: nonNegativeNumberSchema,
    // Aceptar URLs absolutas (Cloudinary) o rutas relativas (almacenamiento local)
    fileUrl: z.string().refine(
      (val) => {
        return /^https?:\/\/.+/.test(val) || /^\/[^/].*/.test(val)
      },
      { message: 'URL de archivo inválida' }
    ).optional(),
    fileName: z.string().max(255, 'Nombre de archivo muy largo').optional(),
    fileMetadata: z.any().optional(),
    customizations: z.any().optional(),
  })).min(1, 'Debe haber al menos un item'),
  subtotal: nonNegativeNumberSchema,
  discountAmount: nonNegativeNumberSchema.optional(),
  taxAmount: nonNegativeNumberSchema,
  shippingCost: nonNegativeNumberSchema,
  totalPrice: nonNegativeNumberSchema,
  shippingAddress: addressSchema.optional(),
  notes: z.string().max(1000, 'Notas muy largas').optional(),
  voucherId: idSchema.optional(),
  shippingMethodId: shippingMethodIdSchema.optional(),
  pointsUsed: nonNegativeNumberSchema.optional(),
  pointsDiscount: nonNegativeNumberSchema.optional(),
  useMeterVouchers: z.boolean().optional(),
  meterVouchersInfo: z.any().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'IN_PRODUCTION',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ], {
    errorMap: () => ({ message: 'Estado de pedido inválido' })
  }),
})

// ==================== USER SCHEMAS ====================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo').optional(),
  phone: phoneSchema,
  taxId: z.string().max(20, 'NIF/CIF muy largo').optional(),
  companyName: z.string().max(200, 'Nombre de empresa muy largo').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmación requerida'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// ==================== VOUCHER SCHEMAS ====================

export const purchaseVoucherSchema = z.object({
  templateId: idSchema,
  quantity: z.number().int().min(1, 'Cantidad mínima: 1').max(100, 'Cantidad máxima: 100'),
})

export const validateVoucherSchema = z.object({
  code: z.string().min(1, 'Código requerido').max(50, 'Código muy largo'),
})

export const assignVoucherSchema = z.object({
  voucherId: idSchema,  // ID de la plantilla
  userId: idSchema,     // ID del usuario
  // Campos para generar pedido opcionalmente
  createOrder: z.boolean().default(false),
  paymentMethod: z.enum(['BIZUM', 'TRANSFERENCIA', 'EFECTIVO', 'CONTRA_REEMBOLSO']).optional(),
  notes: z.string().max(1000).optional(),
})

// ==================== PAYMENT SCHEMAS ====================

export const createCheckoutSchema = z.object({
  orderId: idSchema,
  orderNumber: z.string().min(1, 'Número de pedido requerido'),
  successUrl: z.string().url('URL de éxito inválida').optional(),
  cancelUrl: z.string().url('URL de cancelación inválida').optional(),
})

export const verifyPaymentSchema = z.object({
  sessionId: z.string().min(1, 'Session ID requerido'),
})

// ==================== UPLOAD SCHEMAS ====================

export const uploadMetadataSchema = z.object({
  folder: z.enum(['customer-designs', 'products', 'invoices'], {
    errorMap: () => ({ message: 'Folder inválido' })
  }).optional(),
})

// ==================== ADMIN SCHEMAS ====================

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  description: z.string().max(5000, 'Descripción muy larga').optional(),
  pricePerMeter: positiveNumberSchema,
  categoryId: idSchema,
  isActive: z.boolean().default(true),
  minQuantity: nonNegativeNumberSchema.default(0),
  maxQuantity: positiveNumberSchema.optional(),
  // Aceptar URLs absolutas (Cloudinary) o rutas relativas (almacenamiento local)
  imageUrl: z.string().refine(
    (val) => {
      return /^https?:\/\/.+/.test(val) || /^\/[^/].*/.test(val)
    },
    { message: 'URL de imagen inválida' }
  ).optional(),
  requiresFile: z.boolean().default(false),
})

export const updateProductSchema = createProductSchema.partial()

export const createDiscountCodeSchema = z.object({
  code: z.string().min(3, 'Código muy corto').max(50, 'Código muy largo').toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED'], {
    errorMap: () => ({ message: 'Tipo de descuento inválido' })
  }),
  value: positiveNumberSchema,
  minOrderAmount: nonNegativeNumberSchema.optional(),
  maxUses: z.number().int().positive('Usos máximos debe ser positivo').optional(),
  expiresAt: z.string().datetime('Fecha de expiración inválida').optional(),
  isActive: z.boolean().default(true),
})

export const createVoucherTemplateSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  description: z.string().max(1000, 'Descripción muy larga').optional(),
  meters: positiveNumberSchema,
  shipments: z.number().int().positive('Envíos debe ser positivo'),
  price: positiveNumberSchema,
  discount: z.number().min(0).max(100, 'Descuento debe estar entre 0 y 100').optional(),
  expiryDays: z.number().int().positive('Días de expiración debe ser positivo').optional(),
  isActive: z.boolean().default(true),
})

// ==================== MANUAL ORDER SCHEMA ====================

export const createManualOrderSchema = z.object({
  customerName: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  customerEmail: emailSchema,
  customerPhone: z.string().min(9, 'Teléfono inválido').max(15, 'Teléfono muy largo'),

  metersOrdered: positiveNumberSchema,
  pricePerMeter: positiveNumberSchema,
  subtotal: nonNegativeNumberSchema,
  taxAmount: nonNegativeNumberSchema,
  shippingCost: nonNegativeNumberSchema,
  totalPrice: nonNegativeNumberSchema,

  designFileUrl: z.string().url('URL de archivo inválida'),
  designFileName: z.string().max(255, 'Nombre de archivo muy largo'),

  shippingMethodId: shippingMethodIdSchema,
  shippingAddress: addressSchema,

  paymentMethod: z.enum(['BIZUM', 'TRANSFERENCIA', 'EFECTIVO', 'CONTRA_REEMBOLSO'], {
    errorMap: () => ({ message: 'Método de pago inválido' })
  }),

  notes: z.string().max(1000, 'Notas muy largas').optional(),

  // Campos opcionales para funcionalidades avanzadas
  associateUserId: z.string().cuid('ID de usuario inválido').optional(), // ID del usuario encontrado para asociar
  sendConfirmationEmail: z.boolean().optional(), // Si enviar email de confirmación

  // Campos para uso de bonos
  useVoucher: z.boolean().optional(),
  voucherIds: z.array(z.string().cuid()).optional(), // Bonos a usar (ordenados FIFO)
  voucherId: z.string().cuid().optional(), // Bono único a usar (pedidos manuales)

  customizations: z.object({
    extras: z.object({
      layout: z.object({
        selected: z.boolean(),
        price: z.number().optional()
      }).optional(),
      cutting: z.object({
        selected: z.boolean(),
        price: z.number().optional()
      }).optional(),
      prioritize: z.object({
        selected: z.boolean(),
        price: z.number().optional()
      }).optional(),
    }).optional()
  }).optional(),
})

// ==================== INVOICE SCHEMAS ====================

// Schema para items de factura manual
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida').max(500, 'Descripción muy larga'),
  quantity: positiveNumberSchema,
  unitPrice: positiveNumberSchema,
  subtotal: nonNegativeNumberSchema
})

// Schema para crear factura manual
export const createManualInvoiceSchema = z.object({
  // Datos del cliente
  customerName: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  customerEmail: emailSchema,
  customerPhone: phoneSchema.optional(),
  customerTaxId: z.string().max(20, 'NIF/CIF muy largo').optional(),
  customerAddress: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    postalCode: z.string().max(10).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional()
  }).optional(),

  // Items
  items: z.array(invoiceItemSchema).min(1, 'Debe haber al menos un item'),

  // Importes
  subtotal: nonNegativeNumberSchema,
  discountAmount: nonNegativeNumberSchema.optional(),
  taxRate: z.number().min(0).max(100, 'IVA debe estar entre 0 y 100'),
  taxAmount: nonNegativeNumberSchema,
  shippingCost: nonNegativeNumberSchema.optional(),
  totalPrice: nonNegativeNumberSchema,

  // Metadatos
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Notas muy largas').optional()
})

export const updateManualInvoiceSchema = createManualInvoiceSchema.partial()

export const sendInvoiceEmailSchema = z.object({
  recipientEmail: emailSchema.optional(),
  message: z.string().max(1000, 'Mensaje muy largo').optional()
})

// ==================== PROSPECT CRM SCHEMAS ====================

export const prospectSourceEnum = z.enum(['LLAMADA_FRIA', 'REFERIDO', 'WEB', 'RRSS'])
export const prospectStatusEnum = z.enum(['VERDE', 'AMARILLO', 'ROJO'])

export const createProspectSchema = z.object({
  empresa: z.string().min(1, 'Empresa requerida').max(200, 'Empresa muy larga'),
  contacto: z.string().min(1, 'Contacto requerido').max(200, 'Contacto muy largo'),
  telefono: z.string().max(20, 'Teléfono muy largo').optional(),
  ciudad: z.string().max(100, 'Ciudad muy larga').optional(),
  provincia: z.string().max(100, 'Provincia muy larga').optional(),
  canalEntrada: prospectSourceEnum,
  estado: prospectStatusEnum.optional(),
  notaClave: z.string().max(500, 'Nota muy larga').optional(),
  proximaAccion: z.string().max(500, 'Acción muy larga').optional(),
  fechaProximaAccion: z.string().datetime().optional().nullable(),
  historialInicial: z.string().max(2000, 'Historial muy largo').optional()
})

export const updateProspectSchema = createProspectSchema.partial()

export const addProspectHistorySchema = z.object({
  texto: z.string().min(1, 'Texto requerido').max(2000, 'Texto muy largo')
})

export const markProspectDoneSchema = z.object({
  resultado: z.string().min(1, 'Resultado requerido').max(2000, 'Resultado muy largo'),
  nuevaProximaAccion: z.string().max(500, 'Acción muy larga').optional(),
  nuevaFechaProximaAccion: z.string().datetime().optional().nullable(),
  nuevoEstado: prospectStatusEnum.optional()
})

// ==================== HELPER TYPES ====================

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderSchema>
export type CreateRegularOrderInput = z.infer<typeof createRegularOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type PurchaseVoucherInput = z.infer<typeof purchaseVoucherSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>
export type CreateVoucherTemplateInput = z.infer<typeof createVoucherTemplateSchema>
export type AssignVoucherInput = z.infer<typeof assignVoucherSchema>
export type CreateManualOrderInput = z.infer<typeof createManualOrderSchema>
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type CreateManualInvoiceInput = z.infer<typeof createManualInvoiceSchema>
export type UpdateManualInvoiceInput = z.infer<typeof updateManualInvoiceSchema>
export type SendInvoiceEmailInput = z.infer<typeof sendInvoiceEmailSchema>

// Prospect CRM Types
export type CreateProspectInput = z.infer<typeof createProspectSchema>
export type UpdateProspectInput = z.infer<typeof updateProspectSchema>
export type AddProspectHistoryInput = z.infer<typeof addProspectHistorySchema>
export type MarkProspectDoneInput = z.infer<typeof markProspectDoneSchema>
