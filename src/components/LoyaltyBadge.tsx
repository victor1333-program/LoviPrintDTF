import { LoyaltyTier } from '@prisma/client'
import { getTierConfig } from '@/lib/loyalty'

interface LoyaltyBadgeProps {
  tier: LoyaltyTier
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export function LoyaltyBadge({
  tier,
  size = 'md',
  showName = true,
  className = '',
}: LoyaltyBadgeProps) {
  const config = getTierConfig(tier)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-white font-bold shadow-lg ${sizeClasses[size]} ${className}`}
      title={`Cliente ${config.name}`}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showName && <span>{config.name}</span>}
    </div>
  )
}

interface LoyaltyProgressProps {
  totalSpent: number
  tier: LoyaltyTier
  className?: string
}

export function LoyaltyProgress({ totalSpent, tier, className = '' }: LoyaltyProgressProps) {
  const currentConfig = getTierConfig(tier)

  // Determinar el siguiente tier
  let nextTier: LoyaltyTier | null = null
  if (tier === 'BRONZE') nextTier = 'SILVER'
  else if (tier === 'SILVER') nextTier = 'GOLD'
  else if (tier === 'GOLD') nextTier = 'PLATINUM'

  if (!nextTier) {
    // Ya está en el tier máximo
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            ¡Nivel Máximo Alcanzado!
          </span>
          <LoyaltyBadge tier={tier} size="sm" />
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${currentConfig.gradient} transition-all duration-500`} style={{ width: '100%' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Has gastado {totalSpent.toFixed(2)}€ en total
        </p>
      </div>
    )
  }

  const nextConfig = getTierConfig(nextTier)
  const rangeSize = nextConfig.minSpent - currentConfig.minSpent
  const currentProgress = totalSpent - currentConfig.minSpent
  const progressPercentage = Math.min(100, (currentProgress / rangeSize) * 100)
  const amountToNextTier = Math.max(0, nextConfig.minSpent - totalSpent)

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LoyaltyBadge tier={tier} size="sm" />
          <span className="text-xs text-gray-500">→</span>
          <LoyaltyBadge tier={nextTier} size="sm" />
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {progressPercentage.toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${currentConfig.gradient} transition-all duration-500`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {amountToNextTier > 0 ? (
          <>
            Gasta <span className="font-semibold">{amountToNextTier.toFixed(2)}€</span> más para alcanzar {nextConfig.name}
          </>
        ) : (
          <>¡Felicidades! Alcanzaste el nivel {nextConfig.name}</>
        )}
      </p>
    </div>
  )
}
