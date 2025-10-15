"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"

interface Product {
  id: string
  name: string
  slug: string
}

interface Voucher {
  id: string
  name: string
  code: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  price: number
  productId?: string | null
  initialMeters: number
  initialShipments: number
  expiresAt?: string | null
}

interface VoucherFormProps {
  voucher?: Voucher | null
  onSuccess: () => void
  onCancel: () => void
}

export function VoucherForm({ voucher, onSuccess, onCancel }: VoucherFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    name: voucher?.name || "",
    slug: voucher?.slug || "",
    description: voucher?.description || "",
    imageUrl: voucher?.imageUrl || "",
    price: voucher?.price?.toString() || "",
    productId: voucher?.productId || "",
    initialMeters: voucher?.initialMeters?.toString() || "",
    initialShipments: voucher?.initialShipments?.toString() || "2",
    expiresAt: voucher?.expiresAt ? new Date(voucher.expiresAt).toISOString().split('T')[0] : "",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    // Auto-generate slug from name
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name])

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
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        imageUrl: formData.imageUrl || null,
        price: parseFloat(formData.price),
        productId: formData.productId || null,
        initialMeters: parseFloat(formData.initialMeters),
        remainingMeters: parseFloat(formData.initialMeters),
        initialShipments: parseInt(formData.initialShipments),
        remainingShipments: parseInt(formData.initialShipments),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isTemplate: true, // Es una plantilla para vender
        isActive: true,
      }

      const url = voucher
        ? `/api/admin/vouchers/${voucher.id}`
        : '/api/admin/vouchers'

      const method = voucher ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || `Error al ${voucher ? 'actualizar' : 'crear'} bono`)
      }

      toast.success(`Bono ${voucher ? 'actualizado' : 'creado'} correctamente`)
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || `Error al ${voucher ? 'actualizar' : 'crear'} bono`)
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
              Nombre del Bono *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Bono 100 metros DTF Textil"
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
              placeholder="bono-100-metros-dtf-textil"
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
            placeholder="Descripción del bono..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Producto Asociado */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Producto Asociado</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto *
          </label>
          <select
            value={formData.productId}
            onChange={(e) => handleInputChange('productId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar producto</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            El bono solo será válido para este producto específico
          </p>
        </div>
      </div>

      {/* Precio y Metros */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Precio y Metros</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio del Bono (€) *
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="500.00"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Precio que pagará el cliente al comprar el bono
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metros Incluidos *
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.initialMeters}
              onChange={(e) => handleInputChange('initialMeters', e.target.value)}
              placeholder="100"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Cantidad de metros disponibles en el bono
            </p>
          </div>
        </div>
      </div>

      {/* Envíos y Caducidad */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Envíos y Caducidad</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Envíos Incluidos *
            </label>
            <Input
              type="number"
              value={formData.initialShipments}
              onChange={(e) => handleInputChange('initialShipments', e.target.value)}
              placeholder="2"
              required
              min="0"
            />
            <p className="mt-1 text-sm text-gray-500">
              Número de envíos gratis incluidos en el bono
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Caducidad
            </label>
            <Input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => handleInputChange('expiresAt', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-sm text-gray-500">
              Si no se especifica, el bono no caduca
            </p>
          </div>
        </div>
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
            placeholder="https://example.com/imagen-bono.jpg"
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

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading
            ? (voucher ? 'Actualizando...' : 'Creando...')
            : (voucher ? 'Actualizar Bono' : 'Crear Bono')
          }
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
