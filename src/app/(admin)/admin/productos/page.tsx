"use client"

import { useEffect, useState } from "react"
import { ProductWithRelations } from "@/types"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { ProductForm } from "@/components/admin/ProductForm"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"
import Link from "next/link"

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null)

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
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (res.ok) {
        toast.success('Producto actualizado')
        loadProducts()
      } else {
        toast.error('Error al actualizar producto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar producto')
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Producto eliminado correctamente')
        loadProducts()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al eliminar producto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar producto')
    }
  }

  const filteredProducts = products.filter((product) =>
    search
      ? product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona el catálogo de productos</p>
        </div>
        <Button onClick={() => {
          setEditingProduct(null)
          setShowModal(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-400">
                        {product.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="info">{product.category?.name}</Badge>
                          <Badge variant={product.isActive ? 'success' : 'error'}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {product.isFeatured && <Badge variant="warning">Destacado</Badge>}
                          <Badge>{product.stockStatus}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/productos/${product.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product)
                            setShowModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-red-600" />
                          Eliminar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(product.id, product.isActive)}
                        >
                          {product.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.shortDescription || product.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Precio Base:</p>
                        <p className="text-xl font-bold text-primary-600">
                          {formatCurrency(Number(product.basePrice))} / {product.unit}
                        </p>
                      </div>

                      {product.priceRanges && product.priceRanges.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            Rangos de Precio ({product.priceRanges.length}):
                          </p>
                          <div className="space-y-1">
                            {product.priceRanges.slice(0, 2).map((range) => (
                              <p key={range.id} className="text-sm text-gray-700">
                                {Number(range.fromQty)}
                                {range.toQty ? ` - ${Number(range.toQty)}` : '+'}
                                {' '}{product.unit}: {formatCurrency(Number(range.price))}
                                {range.discountPct && Number(range.discountPct) > 0 && (
                                  <Badge variant="success" className="ml-2 text-xs">
                                    -{Number(range.discountPct).toFixed(0)}%
                                  </Badge>
                                )}
                              </p>
                            ))}
                            {product.priceRanges.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{product.priceRanges.length - 2} más...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No se encontraron productos</p>
          </CardContent>
        </Card>
      )}

      {/* Modal para crear/editar producto */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="4xl"
      >
        <ProductForm
          product={editingProduct}
          onSuccess={() => {
            setShowModal(false)
            setEditingProduct(null)
            loadProducts()
          }}
          onCancel={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
        />
      </Modal>
    </div>
  )
}
