'use client'

import { useState, useEffect } from 'react'
import { pointsToEuros, calculateMaxDiscount, validatePointsUsage } from '@/lib/loyalty'

interface LoyaltyPointsSliderProps {
  availablePoints: number
  orderTotal: number
  onPointsChange: (points: number, discount: number) => void
}

export function LoyaltyPointsSlider({
  availablePoints,
  orderTotal,
  onPointsChange,
}: LoyaltyPointsSliderProps) {
  const [pointsToUse, setPointsToUse] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const { maxDiscountEuros, maxPointsUsable } = calculateMaxDiscount(orderTotal, availablePoints)
  const currentDiscount = pointsToEuros(pointsToUse)

  // Validar si hay suficientes puntos para usar
  const canUsePoints = availablePoints >= 100

  useEffect(() => {
    onPointsChange(pointsToUse, currentDiscount)
  }, [pointsToUse, currentDiscount, onPointsChange])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    // Redondear al múltiplo de 100 más cercano
    const roundedValue = Math.round(value / 100) * 100
    setPointsToUse(Math.min(roundedValue, maxPointsUsable))
  }

  const handlePresetClick = (percentage: number) => {
    const targetPoints = Math.floor((maxPointsUsable * percentage) / 100)
    const roundedPoints = Math.floor(targetPoints / 100) * 100
    setPointsToUse(roundedPoints)
  }

  if (!canUsePoints) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg">⭐</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Puntos de Fidelidad</h3>
            <p className="text-sm text-gray-600">
              Tienes <span className="font-semibold">{availablePoints}</span> puntos. Necesitas al menos 100 puntos para canjear descuentos.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-300 shadow-md">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">⭐</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Puntos de Fidelidad</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              {isExpanded ? 'Ocultar' : 'Usar Puntos'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600">
              Disponibles: <span className="font-semibold">{availablePoints}</span> puntos
            </p>
            {pointsToUse > 0 && (
              <p className="text-sm font-bold text-green-600">
                -{currentDiscount.toFixed(2)}€
              </p>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                Puntos a usar: <span className="text-primary-600">{pointsToUse}</span>
              </label>
              <span className="text-sm font-bold text-gray-900">
                Descuento: {currentDiscount.toFixed(2)}€
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max={maxPointsUsable}
              step="100"
              value={pointsToUse}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />

            {/* Indicadores del slider */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{maxPointsUsable}</span>
            </div>
          </div>

          {/* Botones preset */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => handlePresetClick(25)}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-primary-400 transition-colors"
            >
              25%
            </button>
            <button
              onClick={() => handlePresetClick(50)}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-primary-400 transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => handlePresetClick(75)}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-primary-400 transition-colors"
            >
              75%
            </button>
            <button
              onClick={() => handlePresetClick(100)}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-primary-400 transition-colors"
            >
              Máx
            </button>
          </div>

          {/* Info adicional */}
          <div className="bg-white/70 rounded p-2 text-xs text-gray-600">
            <p className="mb-1">
              💡 <span className="font-semibold">100 puntos = 5€ de descuento</span>
            </p>
            <p>
              ⚠️ Máximo descuento: {maxDiscountEuros.toFixed(2)}€ (20% del pedido)
            </p>
          </div>

          {/* Botón para resetear */}
          {pointsToUse > 0 && (
            <button
              onClick={() => setPointsToUse(0)}
              className="w-full mt-3 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              No usar puntos
            </button>
          )}
        </div>
      )}
    </div>
  )
}
