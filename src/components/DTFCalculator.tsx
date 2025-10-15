"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { formatCurrency } from "@/lib/utils"
import { Upload, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"

export function DTFCalculator() {
  const router = useRouter()
  const [meters, setMeters] = useState(1)
  const [pricePerMeter] = useState(15) // Esto vendría de la configuración
  const [taxRate] = useState(0.21) // 21% IVA
  const [shippingCost] = useState(5)

  const subtotal = meters * pricePerMeter
  const tax = subtotal * taxRate
  const total = subtotal + tax + shippingCost

  const incrementMeters = () => {
    setMeters(prev => Math.min(prev + 0.5, 100))
  }

  const decrementMeters = () => {
    setMeters(prev => Math.max(prev - 0.5, 0.5))
  }

  const handleMetersChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 100) {
      setMeters(numValue)
    }
  }

  const handleContinue = () => {
    // Guardar en localStorage para el checkout
    localStorage.setItem('dtf_order', JSON.stringify({
      meters,
      pricePerMeter,
      subtotal,
      tax,
      shipping: shippingCost,
      total
    }))
    router.push('/checkout')
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-primary-50 border-b">
        <CardTitle className="text-center text-primary-900">
          Calcula tu Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Selector de Metros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cantidad de Metros
            </label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={decrementMeters}
                disabled={meters <= 0.5}
                className="w-12 h-12 p-0"
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="flex-1">
                <Input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={meters}
                  onChange={(e) => handleMetersChange(e.target.value)}
                  className="text-center text-2xl font-bold h-14"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={incrementMeters}
                disabled={meters >= 100}
                className="w-12 h-12 p-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Mínimo: 0.5m | Máximo: 100m
            </p>
          </div>

          {/* Resumen de Precios */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Precio por metro:</span>
              <span className="font-semibold">{formatCurrency(pricePerMeter)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({meters}m):</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (21%):</span>
              <span className="font-semibold">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Envío:</span>
              <span className="font-semibold">{formatCurrency(shippingCost)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Botón de Continuar */}
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full"
          >
            <Upload className="h-5 w-5 mr-2" />
            Continuar y Subir Diseño
          </Button>

          {/* Info adicional */}
          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>✓ Entrega en 24-48 horas</p>
            <p>✓ Film DTF de alta calidad</p>
            <p>✓ Listo para aplicar</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
