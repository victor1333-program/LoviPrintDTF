'use client'

import { cn } from '@/lib/utils'

interface ProspectSourceBadgeProps {
  source: 'LLAMADA_FRIA' | 'REFERIDO' | 'WEB' | 'RRSS'
  className?: string
}

const sourceConfig = {
  LLAMADA_FRIA: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Llamada fría'
  },
  REFERIDO: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Referido'
  },
  WEB: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    label: 'Web'
  },
  RRSS: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    label: 'RRSS'
  }
}

export function ProspectSourceBadge({ source, className }: ProspectSourceBadgeProps) {
  const config = sourceConfig[source]

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
