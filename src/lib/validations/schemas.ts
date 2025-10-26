/**
 * Esquemas de validación Zod centralizados
 * Para validar inputs en API routes y prevenir errores e inyecciones
 */

import { z } from 'zod'

// ==================== COMMON SCHEMAS ====================

export const emailSchema = z.string().email('Email inválido')

export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Número de teléfono inválido'
).optional()

export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

export const idSchema = z.string().cuid('ID inválido')

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
  productId: idSchema,
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
  shippingMethodId: z.string().uuid('ID de método de envío inválido').optional(),
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
    productId: idSchema,
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
  shippingMethodId: z.string().uuid('ID de método de envío inválido').optional(),
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
  name: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo').optional(),
  phone: phoneSchema,
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
