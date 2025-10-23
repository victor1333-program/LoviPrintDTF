"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Plus, Trash2 } from "lucide-react"
import { ProductWithRelations } from "@/types"
import toast from "react-hot-toast"

interface Category {
  id: string
  name: string
  slug: string
}

interface PriceRange {
  fromQty: string
  toQty: string
  price: string
  discountPct: string
}

interface ProductFormProps {
  product?: ProductWithRelations | null
  onSuccess: () => void
  onCancel: () => void
}

const STOCK_STATUS = [
  { value: "IN_STOCK", label: "En Stock" },
  { value: "LOW_STOCK", label: "Stock Bajo" },
  { value: "OUT_OF_STOCK", label: "Sin Stock" },
  { value: "PREORDER", label: "Pre-orden" },
]

const UNITS = [
  { value: "metros", label: "Metros" },
  { value: "unidades", label: "Unidades" },
  { value: "packs", label: "Packs" },
]

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    categoryId: product?.categoryId || "",
    basePrice: product?.basePrice?.toString() || "",
    unit: product?.unit || "metros",
    minQuantity: product?.minQuantity?.toString() || "0.5",
    maxQuantity: product?.maxQuantity?.toString() || "100",
    imageUrl: product?.imageUrl || "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    stockStatus: product?.stockStatus || "IN_STOCK",
  })

  const [priceRanges, setPriceRanges] = useState<PriceRange[]>(
    product?.priceRanges?.map(range => ({
      fromQty: range.fromQty.toString(),
      toQty: range.toQty?.toString() || "",
      price: range.price.toString(),
      discountPct: range.discountPct?.toString() || "",
    })) || []
  )

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // Auto-generate slug from name
    if (!product && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, product])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      // Excluir la categoría de bonos ya que se gestionan aparte
      setCategories(data.filter((cat: Category) => cat.slug !== 'bonos'))
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error al cargar categorías')
    }
  }

  // Determinar productType basado en la categoría
  const getProductTypeFromCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return 'DTF_TEXTILE'

    switch (category.slug) {
      case 'dtf-textil':
        return 'DTF_TEXTILE'
      case 'uv-dtf':
        return 'DTF_UV'
      case 'consumibles':
        return 'CONSUMABLE'
      default:
        return 'DTF_TEXTILE'
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addPriceRange = () => {
    setPriceRanges([...priceRanges, { fromQty: "", toQty: "", price: "", discountPct: "" }])
  }

  const removePriceRange = (index: number) => {
    setPriceRanges(priceRanges.filter((_, i) => i !== index))
  }

  const updatePriceRange = (index: number, field: keyof PriceRange, value: string) => {
    const updated = [...priceRanges]
    updated[index] = { ...updated[index], [field]: value }
    setPriceRanges(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const productType = getProductTypeFromCategory(formData.categoryId)

      const payload = {
        ...formData,
        productType,
        basePrice: parseFloat(formData.basePrice),
        minQuantity: parseFloat(formData.minQuantity),
        maxQuantity: parseFloat(formData.maxQuantity),
        priceRanges: priceRanges
          .filter(range => range.fromQty && range.price)
          .map(range => ({
            fromQty: parseFloat(range.fromQty),
            toQty: range.toQty ? parseFloat(range.toQty) : null,
            price: parseFloat(range.price),
            discountPct: range.discountPct ? parseFloat(range.discountPct) : null,
          })),
      }

      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'

      const method = product ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar producto')
      }

      toast.success(product ? 'Producto actualizado' : 'Producto creado')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al guardar producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Información Básica</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="DTF Textil Premium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              placeholder="dtf-textil-premium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción Corta
          </label>
          <Input
            type="text"
            value={formData.shortDescription}
            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            placeholder="Descripción breve del producto"
            maxLength={150}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción Completa
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descripción detallada del producto..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Categoría */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Categoría</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría del Producto *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Los bonos se gestionan en la sección de Bonos
          </p>
        </div>
      </div>

      {/* Precios y Cantidades */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Precios y Cantidades</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Base *
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Stock
            </label>
            <select
              value={formData.stockStatus}
              onChange={(e) => handleInputChange('stockStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {STOCK_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad Mínima
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.minQuantity}
              onChange={(e) => handleInputChange('minQuantity', e.target.value)}
              placeholder="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad Máxima
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.maxQuantity}
              onChange={(e) => handleInputChange('maxQuantity', e.target.value)}
              placeholder="100"
            />
          </div>
        </div>
      </div>

      {/* Rangos de Precio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Rangos de Precio por Volumen</h3>
          <Button type="button" variant="outline" size="sm" onClick={addPriceRange}>
            <Plus className="h-4 w-4 mr-1" />
            Añadir Rango
          </Button>
        </div>

        {priceRanges.length > 0 ? (
          <div className="space-y-3">
            {priceRanges.map((range, index) => (
              <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Desde (qty)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={range.fromQty}
                      onChange={(e) => updatePriceRange(index, 'fromQty', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hasta (qty)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={range.toQty}
                      onChange={(e) => updatePriceRange(index, 'toQty', e.target.value)}
                      placeholder="Sin límite"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={range.price}
                      onChange={(e) => updatePriceRange(index, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Descuento %
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={range.discountPct}
                      onChange={(e) => updatePriceRange(index, 'discountPct', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePriceRange(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay rangos de precio configurados
          </p>
        )}
      </div>

      {/* Imagen */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Imagen</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de Imagen
          </label>
          <Input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            placeholder="https://example.com/imagen.jpg"
          />
          {formData.imageUrl && (
            <div className="mt-2">
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/128?text=Error'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Estado</h3>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Producto Activo</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Producto Destacado</span>
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando...' : product ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
