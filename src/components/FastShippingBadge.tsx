'use client'

import { Zap } from 'lucide-react'

interface FastShippingBadgeProps {
  className?: string
}

export function FastShippingBadge({ className = '' }: FastShippingBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full shadow-lg animate-pulse ${className}`}>
      <Zap className="w-4 h-4 fill-white" />
      <span className="text-sm font-bold">Envío 24h</span>
    </div>
  )
}

// Badge flotante para esquina de productos
export function FloatingShippingBadge() {
  return (
    <div className="absolute top-3 right-3 z-10">
      <div className="relative">
        {/* Badge principal */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <Zap className="w-4 h-4 fill-white animate-pulse" />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold">Envío</span>
            <span className="text-sm font-black">24h</span>
          </div>
        </div>

        {/* Efecto de pulso */}
        <div className="absolute inset-0 bg-green-400 rounded-lg animate-ping opacity-20"></div>
      </div>
    </div>
  )
}
