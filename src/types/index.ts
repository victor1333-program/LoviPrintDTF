import {
  Order,
  User,
  OrderStatus,
  PaymentStatus,
  Role,
  Product,
  Category,
  ProductType,
  StockStatus,
  PriceRange,
  Cart,
  CartItem,
  Voucher,
  VoucherType,
  LoyaltyPoints,
  Template,
  OrderItem,
  ShippingMethod,
} from '@prisma/client'

export type {
  Order,
  User,
  OrderStatus,
  PaymentStatus,
  Role,
  Product,
  Category,
  ProductType,
  StockStatus,
  PriceRange,
  Cart,
  CartItem,
  Voucher,
  VoucherType,
  LoyaltyPoints,
  Template,
  OrderItem,
  ShippingMethod,
}

// Extended types
export interface ProductWithRelations extends Product {
  category?: Category
  priceRanges?: PriceRange[]
}

export interface CartWithItems extends Cart {
  items: (CartItem & { product: Product })[]
}

export interface OrderWithRelations extends Order {
  user?: User | null
  items: (OrderItem & { product: Product })[]
  voucher?: Voucher | null
  shippingMethod?: ShippingMethod | null
}

export interface UserWithRelations extends Omit<User, 'loyaltyPoints'> {
  loyaltyPoints?: number
  loyaltyPointsData?: LoyaltyPoints | null
  vouchers?: Voucher[]
}

// Calculation interfaces
export interface DTFCalculation {
  quantity: number
  unitPrice: number
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  pointsEarned?: number
}

export interface PriceCalculationResult {
  unitPrice: number
  subtotal: number
  discountPct: number
  discountAmount: number
  appliedRange?: PriceRange
  extrasTotal?: number
}

// File upload
export interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
  metadata?: {
    width?: number
    height?: number
    dpi?: number
    format?: string
  }
}

// Cart types
export interface AddToCartData {
  productId: string
  quantity: number
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileMetadata?: any
  customizations?: any
}

// Voucher validation
export interface VoucherValidation {
  isValid: boolean
  error?: string
  voucher?: Voucher
  discountAmount?: number
}

// Settings
export interface CompanyInfo {
  name: string
  email: string
  phone: string
  address: string
  schedule: string
}

export interface SystemSettings {
  taxRate: number
  shippingCost: number
  freeShippingThreshold: number
  professionalDiscount: number
  pointsPerEuro: number
  companyInfo: CompanyInfo
}
