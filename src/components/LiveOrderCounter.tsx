'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Zap } from 'lucide-react'

export function LiveOrderCounter() {
  const [ordersToday, setOrdersToday] = useState<number>(12) // Número inicial
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Simular actualización periódica cada 2-5 minutos
    const interval = setInterval(() => {
      // Incrementar aleatoriamente entre 1-3
      const increment = Math.floor(Math.random() * 3) + 1
      setOrdersToday(prev => prev + increment)

      // Trigger animation
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }, Math.random() * 180000 + 120000) // Entre 2-5 minutos

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-in slide-in-from-right duration-500">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform duration-300">
        {/* Icono animado */}
        <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
          <div className="absolute -inset-1 bg-white opacity-30 rounded-full animate-ping"></div>
          <div className="relative bg-white/20 rounded-full p-2">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Texto */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isAnimating ? 'scale-110' : ''} transition-transform`}>
              {ordersToday}
            </span>
            <span className="text-sm font-medium opacity-90">pedidos hoy</span>
          </div>
          <div className="flex items-center gap-1 text-xs opacity-80">
            <Zap className="w-3 h-3" />
            <span>En tiempo real</span>
          </div>
        </div>
      </div>
    </div>
  )
}
