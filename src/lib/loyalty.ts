import { LoyaltyTier } from '@prisma/client'

// Configuración de tiers
export const TIER_CONFIG = {
  BRONZE: {
    name: 'Bronce',
    minSpent: 0,
    maxSpent: 200,
    multiplier: 1,
    color: '#CD7F32',
    gradient: 'from-amber-700 to-amber-900',
    icon: '🥉',
  },
  SILVER: {
    name: 'Plata',
    minSpent: 200,
    maxSpent: 500,
    multiplier: 1.25,
    color: '#C0C0C0',
    gradient: 'from-gray-300 to-gray-500',
    icon: '🥈',
  },
  GOLD: {
    name: 'Oro',
    minSpent: 500,
    maxSpent: 1000,
    multiplier: 1.5,
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
  },
  PLATINUM: {
    name: 'Platino',
    minSpent: 1000,
    maxSpent: Infinity,
    multiplier: 2,
    color: '#E5E4E2',
    gradient: 'from-slate-200 to-slate-400',
    icon: '💎',
  },
} as const

// Configuración de puntos
export const POINTS_CONFIG = {
  VOUCHER_BONUS: 1.25, // 25% extra de puntos por comprar bonos
  POINTS_PER_EURO: 1, // 1 punto por cada euro gastado
  POINTS_TO_EURO_RATIO: 0.05, // 100 puntos = 5€ (5% de valor)
  MIN_POINTS_TO_REDEEM: 100,
  MAX_DISCOUNT_PERCENTAGE: 0.2, // Máximo 20% del pedido puede pagarse con puntos
} as const

/**
 * Calcula el tier basándose en el total gastado
 */
export function calculateTier(totalSpent: number): LoyaltyTier {
  if (totalSpent >= TIER_CONFIG.PLATINUM.minSpent) return 'PLATINUM'
  if (totalSpent >= TIER_CONFIG.GOLD.minSpent) return 'GOLD'
  if (totalSpent >= TIER_CONFIG.SILVER.minSpent) return 'SILVER'
  return 'BRONZE'
}

/**
 * Obtiene la configuración del tier
 */
export function getTierConfig(tier: LoyaltyTier) {
  return TIER_CONFIG[tier]
}

/**
 * Calcula puntos ganados por una compra
 */
export function calculatePointsEarned(
  amountSpent: number,
  tier: LoyaltyTier,
  isVoucherPurchase: boolean = false
): number {
  const tierConfig = getTierConfig(tier)
  let points = Math.floor(amountSpent * POINTS_CONFIG.POINTS_PER_EURO * tierConfig.multiplier)

  // Bonus del 25% por comprar bonos
  if (isVoucherPurchase) {
    points = Math.floor(points * POINTS_CONFIG.VOUCHER_BONUS)
  }

  return points
}

/**
 * Convierte puntos a euros de descuento
 */
export function pointsToEuros(points: number): number {
  return Math.floor(points / 100) * 5 // 100 puntos = 5€
}

/**
 * Convierte euros a puntos necesarios
 */
export function eurosToPoints(euros: number): number {
  return Math.ceil(euros / POINTS_CONFIG.POINTS_TO_EURO_RATIO)
}

/**
 * Calcula el máximo descuento permitido para un pedido
 */
export function calculateMaxDiscount(orderTotal: number, availablePoints: number): {
  maxDiscountEuros: number
  maxPointsUsable: number
} {
  // Máximo 20% del pedido
  const maxDiscountEuros = orderTotal * POINTS_CONFIG.MAX_DISCOUNT_PERCENTAGE
  const maxPointsByOrderValue = eurosToPoints(maxDiscountEuros)

  // El menor entre lo que tiene el usuario y el máximo permitido
  const maxPointsUsable = Math.min(
    availablePoints,
    maxPointsByOrderValue,
    Math.floor(availablePoints / 100) * 100 // Solo múltiplos de 100
  )

  const actualDiscount = pointsToEuros(maxPointsUsable)

  return {
    maxDiscountEuros: actualDiscount,
    maxPointsUsable,
  }
}

/**
 * Calcula progreso hacia el siguiente tier
 */
export function calculateTierProgress(totalSpent: number, currentTier: LoyaltyTier): {
  currentTier: LoyaltyTier
  nextTier: LoyaltyTier | null
  progressPercentage: number
  amountToNextTier: number
} {
  const tierConfig = getTierConfig(currentTier)

  // Determinar el siguiente tier
  let nextTier: LoyaltyTier | null = null
  if (currentTier === 'BRONZE') nextTier = 'SILVER'
  else if (currentTier === 'SILVER') nextTier = 'GOLD'
  else if (currentTier === 'GOLD') nextTier = 'PLATINUM'

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercentage: 100,
      amountToNextTier: 0,
    }
  }

  const nextTierConfig = getTierConfig(nextTier)
  const rangeSize = nextTierConfig.minSpent - tierConfig.minSpent
  const currentProgress = totalSpent - tierConfig.minSpent
  const progressPercentage = Math.min(100, (currentProgress / rangeSize) * 100)
  const amountToNextTier = Math.max(0, nextTierConfig.minSpent - totalSpent)

  return {
    currentTier,
    nextTier,
    progressPercentage,
    amountToNextTier,
  }
}

/**
 * Valida si se pueden usar puntos en un pedido
 */
export function validatePointsUsage(
  pointsToUse: number,
  availablePoints: number,
  orderTotal: number
): { valid: boolean; error?: string } {
  // Mínimo 100 puntos
  if (pointsToUse < POINTS_CONFIG.MIN_POINTS_TO_REDEEM) {
    return {
      valid: false,
      error: `Debes canjear al menos ${POINTS_CONFIG.MIN_POINTS_TO_REDEEM} puntos`,
    }
  }

  // Debe ser múltiplo de 100
  if (pointsToUse % 100 !== 0) {
    return {
      valid: false,
      error: 'Los puntos deben canjearse en múltiplos de 100',
    }
  }

  // No puede exceder puntos disponibles
  if (pointsToUse > availablePoints) {
    return {
      valid: false,
      error: 'No tienes suficientes puntos disponibles',
    }
  }

  // No puede exceder el 20% del pedido
  const { maxPointsUsable } = calculateMaxDiscount(orderTotal, availablePoints)
  if (pointsToUse > maxPointsUsable) {
    return {
      valid: false,
      error: `Máximo ${maxPointsUsable} puntos usables para este pedido (20% del total)`,
    }
  }

  return { valid: true }
}

/**
 * Otorga puntos de fidelidad a un usuario por un pedido
 * Función compartida para evitar duplicación en webhook y verify-payment
 */
export async function awardLoyaltyPointsForOrder(
  prisma: any,
  userId: string,
  orderId: string,
  orderNumber: string,
  totalPrice: number,
  isVoucherPurchase: boolean = false
): Promise<{ pointsEarned: number; newTier: string }> {
  // Obtener el usuario para calcular el nuevo totalSpent
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalSpent: true },
  })

  // Obtener o crear registro de loyalty points
  let loyaltyRecord = await prisma.loyaltyPoints.findUnique({
    where: { userId: userId },
  })

  if (!loyaltyRecord) {
    loyaltyRecord = await prisma.loyaltyPoints.create({
      data: {
        userId: userId,
        totalPoints: 0,
        availablePoints: 0,
        lifetimePoints: 0,
        tier: 'BRONZE',
      },
    })
  }

  // Calcular puntos ganados basado en el tier actual
  const amountSpent = parseFloat(totalPrice.toString())
  const pointsEarned = calculatePointsEarned(amountSpent, loyaltyRecord.tier, isVoucherPurchase)

  // Calcular nuevo total gastado y tier basado en EUROS, no puntos
  const currentTotalSpent = user ? parseFloat(user.totalSpent.toString()) : 0
  const newTotalSpent = currentTotalSpent + amountSpent
  const newTier = calculateTier(newTotalSpent)

  // Actualizar loyalty points
  await prisma.loyaltyPoints.update({
    where: { id: loyaltyRecord.id },
    data: {
      availablePoints: { increment: pointsEarned },
      totalPoints: { increment: pointsEarned },
      lifetimePoints: { increment: pointsEarned },
      tier: newTier,
    },
  })

  // Actualizar users table también
  await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: { increment: pointsEarned },
      totalSpent: { increment: amountSpent },
      loyaltyTier: newTier,
    },
  })

  // Crear transacción de puntos
  await prisma.pointTransaction.create({
    data: {
      pointsId: loyaltyRecord.id,
      points: pointsEarned,
      type: 'earned',
      description: `Puntos ganados por pedido ${orderNumber} (${amountSpent.toFixed(2)}€)${isVoucherPurchase ? ' - Bono +25%' : ''}`,
      orderId: orderId,
    },
  })

  return { pointsEarned, newTier }
}
