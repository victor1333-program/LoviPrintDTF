"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { DiscountCodeForm } from "@/components/admin/DiscountCodeForm"
import { BulkGenerateForm } from "@/components/admin/BulkGenerateForm"
import { Plus, Edit, Trash2, Download, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import toast from "react-hot-toast"

interface DiscountCode {
  id: string
  code: string
  name: string
  description: string | null
  type: 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING' | 'FREE_PRODUCT'
  value: number
  isEnabled: boolean
  isGlobal: boolean
  productId: string | null
  minPurchase: number | null
  maxDiscount: number | null
  maxUses: number | null
  maxUsesPerUser: number
  usageCount: number
  validFrom: string | null
  validUntil: string | null
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    usageHistory: number
  }
}

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null)

  useEffect(() => {
    loadCodes()
  }, [])

  const loadCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/discount-codes')

      if (!res.ok) {
        const errorData = await res.json()
        if (res.status === 403) {
          throw new Error('No tienes permisos para acceder a esta sección')
        }
        throw new Error(errorData.error || 'Error al cargar códigos')
      }

      const data = await res.json()
      setCodes(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Error loading discount codes:', error)
      toast.error(error.message || 'Error al cargar códigos de descuento')
      setCodes([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      FIXED: 'Descuento Fijo',
      PERCENTAGE: 'Porcentaje',
      FREE_SHIPPING: 'Envío Gratis',
      FREE_PRODUCT: 'Producto Gratis',
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      FIXED: 'default',
      PERCENTAGE: 'success',
      FREE_SHIPPING: 'info',
      FREE_PRODUCT: 'warning',
    }
    return colors[type as keyof typeof colors] as 'default' | 'success' | 'info' | 'warning'
  }

  const getCodeStatus = (code: DiscountCode) => {
    if (!code.isEnabled) return { label: 'Deshabilitado', variant: 'default' as const }

    const now = new Date()
    const validFrom = code.validFrom ? new Date(code.validFrom) : null
    const validUntil = code.validUntil ? new Date(code.validUntil) : null

    if (validFrom && validFrom > now) return { label: 'Programado', variant: 'info' as const }
    if (validUntil && validUntil < now) return { label: 'Expirado', variant: 'error' as const }
    if (code.maxUses && code.usageCount >= code.maxUses) return { label: 'Agotado', variant: 'default' as const }

    return { label: 'Activo', variant: 'success' as const }
  }

  const formatValue = (code: DiscountCode) => {
    if (code.type === 'FIXED') return formatCurrency(code.value)
    if (code.type === 'PERCENTAGE') return `${code.value}%`
    return '-'
  }

  const handleEditCode = (code: DiscountCode) => {
    setSelectedCode(code)
    setShowEditModal(true)
  }

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este código de descuento?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/discount-codes/${codeId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Error al eliminar código')
      }

      toast.success('Código eliminado correctamente')
      loadCodes()
    } catch (error) {
      console.error('Error deleting code:', error)
      toast.error('Error al eliminar código')
    }
  }

  const exportCodes = () => {
    const csv = [
      ['Código', 'Nombre', 'Tipo', 'Valor', 'Estado', 'Usos', 'Límite'].join(','),
      ...codes.map(code => [
        code.code,
        code.name,
        getTypeLabel(code.type),
        formatValue(code),
        getCodeStatus(code).label,
        code.usageCount,
        code.maxUses || 'Ilimitado'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codigos-descuento-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Códigos de Descuento</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestiona los códigos de descuento para tus clientes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportCodes} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowBulkModal(true)} variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Generar Masivo
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Código
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alcance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validez</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No hay códigos de descuento. Crea el primer código para empezar.
                      </td>
                    </tr>
                  ) : (
                    codes.map((code) => {
                      const status = getCodeStatus(code)
                      return (
                        <tr key={code.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <code className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded font-mono font-semibold">
                              {code.code}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-sm">{code.name}</p>
                              {code.description && (
                                <p className="text-xs text-gray-500 mt-1">{code.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={getTypeColor(code.type)}>{getTypeLabel(code.type)}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-primary-600">{formatValue(code)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {code.isGlobal ? (
                                <span className="text-gray-600">Global</span>
                              ) : (
                                <span className="text-gray-900">{code.product?.name}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <span className="font-semibold">{code.usageCount}</span>
                              <span className="text-gray-400">
                                {code.maxUses ? ` / ${code.maxUses}` : ' / ∞'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {code.validFrom && code.validUntil ? (
                              <div>
                                <div>{format(new Date(code.validFrom), 'dd/MM/yy', { locale: es })}</div>
                                <div className="text-gray-500">{format(new Date(code.validUntil), 'dd/MM/yy', { locale: es })}</div>
                              </div>
                            ) : code.validUntil ? (
                              `Hasta ${format(new Date(code.validUntil), 'dd/MM/yyyy', { locale: es })}`
                            ) : (
                              'Sin límite'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCode(code)}
                                title="Editar código"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCode(code.id)}
                                title="Eliminar código"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Crear Código */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Código de Descuento"
        maxWidth="3xl"
      >
        <DiscountCodeForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadCodes()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal Editar Código */}
      {selectedCode && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCode(null)
          }}
          title="Editar Código de Descuento"
          maxWidth="3xl"
        >
          <DiscountCodeForm
            code={selectedCode}
            onSuccess={() => {
              setShowEditModal(false)
              setSelectedCode(null)
              loadCodes()
            }}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedCode(null)
            }}
          />
        </Modal>
      )}

      {/* Modal Generación Masiva */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Generar Códigos Masivamente"
        maxWidth="2xl"
      >
        <BulkGenerateForm
          onSuccess={() => {
            setShowBulkModal(false)
            loadCodes()
          }}
          onCancel={() => setShowBulkModal(false)}
        />
      </Modal>
    </div>
  )
}
