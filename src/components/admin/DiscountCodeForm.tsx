"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

interface Product {
  id: string
  name: string
  slug: string
}

interface DiscountCodeFormProps {
  code?: any
  onSuccess: () => void
  onCancel: () => void
}

export function DiscountCodeForm({ code, onSuccess, onCancel }: DiscountCodeFormProps) {
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    code: code?.code || "",
    name: code?.name || "",
    description: code?.description || "",
    type: code?.type || "PERCENTAGE",
    value: code?.value ? String(code.value) : "",
    isEnabled: code?.isEnabled ?? true,
    isGlobal: code?.isGlobal ?? true,
    productId: code?.productId || "",
    minPurchase: code?.minPurchase ? String(code.minPurchase) : "",
    maxDiscount: code?.maxDiscount ? String(code.maxDiscount) : "",
    maxUses: code?.maxUses ? String(code.maxUses) : "",
    maxUsesPerUser: code?.maxUsesPerUser ? String(code.maxUsesPerUser) : "1",
    validFrom: code?.validFrom ? new Date(code.validFrom).toISOString().split('T')[0] : "",
    validUntil: code?.validUntil ? new Date(code.validUntil).toISOString().split('T')[0] : "",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar productos')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await fetch('/api/admin/discount-codes/generate')

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al generar código')
      }

      const data = await res.json()
      handleInputChange('code', data.code)
      toast.success('Código generado')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al generar código')
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        isEnabled: formData.isEnabled,
        isGlobal: formData.isGlobal,
        productId: formData.isGlobal ? null : formData.productId || null,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        maxUsesPerUser: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : 1,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      }

      const url = code
        ? `/api/admin/discount-codes/${code.id}`
        : '/api/admin/discount-codes'

      const res = await fetch(url, {
        method: code ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar código')
      }

      toast.success(code ? 'Código actualizado correctamente' : 'Código creado correctamente')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Información Básica</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="VERANO2024"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateCode}
                disabled={generatingCode}
                title="Generar código automáticamente"
              >
                <RefreshCw className={`h-4 w-4 ${generatingCode ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Descuento de Verano 2024"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descripción del código de descuento..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isEnabled"
            checked={formData.isEnabled}
            onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-900">
            Código habilitado
          </label>
        </div>
      </div>

      {/* Tipo y Valor */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Tipo de Descuento</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="FIXED">Descuento Fijo (€)</option>
              <option value="PERCENTAGE">Porcentaje (%)</option>
              <option value="FREE_SHIPPING">Envío Gratuito</option>
              <option value="FREE_PRODUCT">Producto Gratuito</option>
            </select>
          </div>

          {(formData.type === 'FIXED' || formData.type === 'PERCENTAGE') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor {formData.type === 'FIXED' ? '(€)' : '(%)'} *
              </label>
              <Input
                type="number"
                step={formData.type === 'FIXED' ? '0.01' : '1'}
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder={formData.type === 'FIXED' ? '10.00' : '20'}
                required
                min="0"
                max={formData.type === 'PERCENTAGE' ? '100' : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Alcance */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Alcance</h3>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="isGlobal"
            checked={formData.isGlobal}
            onChange={(e) => handleInputChange('isGlobal', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isGlobal" className="ml-2 block text-sm text-gray-900">
            Aplicar a todos los productos (Global)
          </label>
        </div>

        {!formData.isGlobal && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto Específico *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required={!formData.isGlobal}
            >
              <option value="">Seleccionar producto</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Restricciones */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Restricciones</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compra Mínima (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.minPurchase}
              onChange={(e) => handleInputChange('minPurchase', e.target.value)}
              placeholder="0.00"
              min="0"
            />
            <p className="mt-1 text-sm text-gray-500">
              Monto mínimo de compra requerido
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descuento Máximo (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.maxDiscount}
              onChange={(e) => handleInputChange('maxDiscount', e.target.value)}
              placeholder="0.00"
              min="0"
            />
            <p className="mt-1 text-sm text-gray-500">
              Útil para descuentos porcentuales
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usos Máximos Totales
            </label>
            <Input
              type="number"
              value={formData.maxUses}
              onChange={(e) => handleInputChange('maxUses', e.target.value)}
              placeholder="Ilimitado"
              min="1"
            />
            <p className="mt-1 text-sm text-gray-500">
              Dejar vacío para ilimitado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usos por Usuario *
            </label>
            <Input
              type="number"
              value={formData.maxUsesPerUser}
              onChange={(e) => handleInputChange('maxUsesPerUser', e.target.value)}
              placeholder="1"
              required
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Validez */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Período de Validez</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Válido Desde
            </label>
            <Input
              type="date"
              value={formData.validFrom}
              onChange={(e) => handleInputChange('validFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Válido Hasta
            </label>
            <Input
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleInputChange('validUntil', e.target.value)}
              min={formData.validFrom || undefined}
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando...' : code ? 'Actualizar Código' : 'Crear Código'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
