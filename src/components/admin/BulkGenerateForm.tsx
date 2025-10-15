"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Download } from "lucide-react"
import toast from "react-hot-toast"
import { format } from "date-fns"

interface Product {
  id: string
  name: string
  slug: string
}

interface BulkGenerateFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function BulkGenerateForm({ onSuccess, onCancel }: BulkGenerateFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    quantity: "10",
    prefix: "",
    codeLength: "8",
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    isEnabled: true,
    isGlobal: true,
    productId: "",
    minPurchase: "",
    maxDiscount: "",
    maxUses: "",
    maxUsesPerUser: "1",
    validFrom: "",
    validUntil: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const quantity = parseInt(formData.quantity)

      if (quantity < 1 || quantity > 1000) {
        throw new Error('La cantidad debe estar entre 1 y 1000')
      }

      const payload = {
        quantity,
        prefix: formData.prefix || undefined,
        codeLength: parseInt(formData.codeLength),
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

      const res = await fetch('/api/admin/discount-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al generar códigos')
      }

      const result = await res.json()
      setGeneratedCodes(result.codes)
      toast.success(`${result.count} códigos generados correctamente`)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al generar códigos')
    } finally {
      setLoading(false)
    }
  }

  const downloadCodes = () => {
    const csv = [
      ['Código', 'Nombre', 'Tipo', 'Valor', 'Válido Hasta'].join(','),
      ...generatedCodes.map(code => [
        code.code,
        code.name,
        code.type,
        code.value,
        code.validUntil ? format(new Date(code.validUntil), 'yyyy-MM-dd') : 'Sin límite'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codigos-generados-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    if (generatedCodes.length > 0) {
      onSuccess()
    } else {
      onCancel()
    }
  }

  if (generatedCodes.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">
            ¡Códigos generados exitosamente!
          </h3>
          <p className="text-sm text-green-700">
            Se han generado {generatedCodes.length} códigos de descuento.
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Código</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {generatedCodes.map((code) => (
                <tr key={code.id}>
                  <td className="px-4 py-2">
                    <code className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-mono">
                      {code.code}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{code.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={downloadCodes} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Descargar CSV
          </Button>
          <Button onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cantidad y formato */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Cantidad y Formato</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder="10"
              required
              min="1"
              max="1000"
            />
            <p className="mt-1 text-sm text-gray-500">
              Máximo 1000 códigos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefijo
            </label>
            <Input
              type="text"
              value={formData.prefix}
              onChange={(e) => handleInputChange('prefix', e.target.value.toUpperCase())}
              placeholder="PROMO"
            />
            <p className="mt-1 text-sm text-gray-500">
              Opcional
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitud *
            </label>
            <Input
              type="number"
              value={formData.codeLength}
              onChange={(e) => handleInputChange('codeLength', e.target.value)}
              placeholder="8"
              required
              min="4"
              max="20"
            />
          </div>
        </div>
      </div>

      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Información Básica</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Base *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Promoción Black Friday"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Se agregará un número consecutivo a cada código
          </p>
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
              Usos Máximos por Código
            </label>
            <Input
              type="number"
              value={formData.maxUses}
              onChange={(e) => handleInputChange('maxUses', e.target.value)}
              placeholder="Ilimitado"
              min="1"
            />
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
          {loading ? 'Generando...' : `Generar ${formData.quantity} Códigos`}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
