'use client'

import { cn } from '@/lib/utils'

interface ProspectStatusBadgeProps {
  status: 'VERDE' | 'AMARILLO' | 'ROJO'
  className?: string
}

const statusConfig = {
  VERDE: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Activo'
  },
  AMARILLO: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Seguimiento'
  },
  ROJO: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'Frío'
  }
}

export function ProspectStatusBadge({ status, className }: ProspectStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  )
}
