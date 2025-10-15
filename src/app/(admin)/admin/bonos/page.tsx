"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { VoucherForm } from "@/components/admin/VoucherForm"
import { AssignVoucherForm } from "@/components/admin/AssignVoucherForm"
import { EditAssignedVoucherForm } from "@/components/admin/EditAssignedVoucherForm"
import { Plus, UserPlus, Edit, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import toast from "react-hot-toast"

interface VoucherTemplate {
  id: string
  name: string
  code: string
  slug: string
  price: number
  initialMeters: number
  initialShipments: number
  imageUrl: string | null
  expiresAt: string | null
  isActive: boolean
  product?: {
    id: string
    name: string
  }
}

interface AssignedVoucher {
  id: string
  name: string
  code: string
  initialMeters: number
  remainingMeters: number
  initialShipments: number
  remainingShipments: number
  expiresAt: string | null
  isActive: boolean
  usageCount: number
  createdAt: string
  user?: {
    id: string
    name: string | null
    email: string
  }
  product?: {
    id: string
    name: string
  }
}

export default function AdminBonosPage() {
  const [templates, setTemplates] = useState<VoucherTemplate[]>([])
  const [assigned, setAssigned] = useState<AssignedVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<AssignedVoucher | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<VoucherTemplate | null>(null)

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    setLoading(true)
    try {
      // Cargar plantillas (bonos para vender)
      const resTemplates = await fetch('/api/admin/vouchers?templates=true')

      if (!resTemplates.ok) {
        throw new Error('Error al cargar bonos')
      }

      const templatesData = await resTemplates.json()
      setTemplates(Array.isArray(templatesData) ? templatesData : [])

      // Cargar bonos asignados
      const resAssigned = await fetch('/api/admin/vouchers?assigned=true')

      if (!resAssigned.ok) {
        throw new Error('Error al cargar bonos asignados')
      }

      const assignedData = await resAssigned.json()
      setAssigned(Array.isArray(assignedData) ? assignedData : [])
    } catch (error) {
      console.error('Error loading vouchers:', error)
      toast.error('Error al cargar bonos')
      setTemplates([])
      setAssigned([])
    } finally {
      setLoading(false)
    }
  }

  const getVoucherStatus = (voucher: AssignedVoucher) => {
    const now = new Date()
    const isExpired = voucher.expiresAt && new Date(voucher.expiresAt) < now
    const isExhausted = Number(voucher.remainingMeters) <= 0

    if (isExpired) return { label: 'Caducado', variant: 'error' as const }
    if (isExhausted) return { label: 'Agotado', variant: 'default' as const }
    if (voucher.isActive) return { label: 'Activo', variant: 'success' as const }
    return { label: 'Inactivo', variant: 'default' as const }
  }

  const handleEditVoucher = (voucher: AssignedVoucher) => {
    setSelectedVoucher(voucher)
    setShowEditModal(true)
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bono asignado?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Error al eliminar bono')
      }

      toast.success('Bono eliminado correctamente')
      loadVouchers()
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error('Error al eliminar bono')
    }
  }

  const handleEditTemplate = (template: VoucherTemplate) => {
    setSelectedTemplate(template)
    setShowEditTemplateModal(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla de bono? Esto no afectará a los bonos ya asignados.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/vouchers/${templateId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Error al eliminar plantilla')
      }

      toast.success('Plantilla eliminada correctamente')
      loadVouchers()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar plantilla')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bonos</h1>
          <p className="text-gray-600">Gestiona los bonos de metros prepagados</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAssignModal(true)} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Asignar Bono
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Bono
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Tabla de Bonos Creados (Plantillas) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Bonos Disponibles para Vender</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metros</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envíos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {templates.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                            No hay bonos creados. Crea el primer bono para empezar.
                          </td>
                        </tr>
                      ) : (
                        templates.map((voucher) => (
                          <tr key={voucher.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {voucher.imageUrl && (
                                  <img
                                    src={voucher.imageUrl}
                                    alt={voucher.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <span className="font-medium">{voucher.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{voucher.code}</code>
                            </td>
                            <td className="px-6 py-4 text-sm">{voucher.product?.name || '-'}</td>
                            <td className="px-6 py-4 text-sm font-semibold">{voucher.initialMeters}m</td>
                            <td className="px-6 py-4 text-sm">{voucher.initialShipments}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-primary-600">
                              {formatCurrency(voucher.price)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={voucher.isActive ? 'success' : 'default'}>
                                {voucher.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditTemplate(voucher)}
                                  title="Editar plantilla"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTemplate(voucher.id)}
                                  title="Eliminar plantilla"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Bonos Asignados a Usuarios */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Bonos Asignados a Usuarios</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metros</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envíos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caducidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usos</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assigned.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                            No hay bonos asignados a usuarios todavía.
                          </td>
                        </tr>
                      ) : (
                        assigned.map((voucher) => {
                          const status = getVoucherStatus(voucher)
                          return (
                            <tr key={voucher.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-sm">{voucher.user?.name || 'Sin nombre'}</p>
                                  <p className="text-xs text-gray-500">{voucher.user?.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-sm">{voucher.name}</p>
                                <code className="text-xs text-gray-500">{voucher.code}</code>
                              </td>
                              <td className="px-6 py-4 text-sm">{voucher.product?.name || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  <span className="font-semibold text-primary-600">
                                    {Number(voucher.remainingMeters)}m
                                  </span>
                                  <span className="text-gray-400"> / {Number(voucher.initialMeters)}m</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  <span className="font-semibold">
                                    {voucher.remainingShipments}
                                  </span>
                                  <span className="text-gray-400"> / {voucher.initialShipments}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {voucher.expiresAt
                                  ? format(new Date(voucher.expiresAt), 'dd/MM/yyyy', { locale: es })
                                  : 'Sin límite'}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-center">{voucher.usageCount}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditVoucher(voucher)}
                                    title="Editar metros y envíos"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteVoucher(voucher.id)}
                                    title="Eliminar bono"
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
          </div>
        </>
      )}

      {/* Modal Crear Bono */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Bono"
        maxWidth="3xl"
      >
        <VoucherForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadVouchers()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal Asignar Bono */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Asignar Bono a Usuario"
        maxWidth="2xl"
      >
        <AssignVoucherForm
          onSuccess={() => {
            setShowAssignModal(false)
            loadVouchers()
          }}
          onCancel={() => setShowAssignModal(false)}
        />
      </Modal>

      {/* Modal Editar Bono Asignado */}
      {selectedVoucher && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedVoucher(null)
          }}
          title="Editar Bono Asignado"
          maxWidth="xl"
        >
          <EditAssignedVoucherForm
            voucher={selectedVoucher}
            onSuccess={() => {
              setShowEditModal(false)
              setSelectedVoucher(null)
              loadVouchers()
            }}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedVoucher(null)
            }}
          />
        </Modal>
      )}

      {/* Modal Editar Plantilla de Bono */}
      {selectedTemplate && (
        <Modal
          isOpen={showEditTemplateModal}
          onClose={() => {
            setShowEditTemplateModal(false)
            setSelectedTemplate(null)
          }}
          title="Editar Plantilla de Bono"
          maxWidth="3xl"
        >
          <VoucherForm
            voucher={selectedTemplate}
            onSuccess={() => {
              setShowEditTemplateModal(false)
              setSelectedTemplate(null)
              loadVouchers()
            }}
            onCancel={() => {
              setShowEditTemplateModal(false)
              setSelectedTemplate(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
