'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProspectStatusBadge } from '@/components/admin/ProspectStatusBadge'
import { ProspectSourceBadge } from '@/components/admin/ProspectSourceBadge'
import { ProspectHistoryList } from '@/components/admin/ProspectHistoryList'
import { ProspectMarkDoneModal } from '@/components/admin/ProspectMarkDoneModal'
import { ProspectForm } from '@/components/admin/ProspectForm'
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface HistoryEntry {
  id: string
  texto: string
  createdAt: string
}

interface Prospect {
  id: string
  empresa: string
  contacto: string
  telefono: string | null
  ciudad: string | null
  provincia: string | null
  canalEntrada: 'LLAMADA_FRIA' | 'REFERIDO' | 'WEB' | 'RRSS'
  estado: 'VERDE' | 'AMARILLO' | 'ROJO'
  notaClave: string | null
  fechaPrimerContacto: string
  proximaAccion: string | null
  fechaProximaAccion: string | null
  createdAt: string
  updatedAt: string
  historial: HistoryEntry[]
}

export default function ProspectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [loading, setLoading] = useState(true)

  // Modales
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false)
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false)

  // Form para añadir historial
  const [newHistoryText, setNewHistoryText] = useState('')
  const [savingHistory, setSavingHistory] = useState(false)

  const fetchProspect = async () => {
    try {
      const response = await fetch(`/api/admin/prospects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProspect(data)
      } else if (response.status === 404) {
        toast.error('Prospecto no encontrado')
        router.push('/admin/prospectos')
      }
    } catch (error) {
      console.error('Error fetching prospect:', error)
      toast.error('Error al cargar prospecto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProspect()
  }, [id])

  const handleDelete = async () => {
    if (!prospect) return
    if (!confirm(`¿Eliminar el prospecto "${prospect.empresa}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/prospects/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Prospecto eliminado')
        router.push('/admin/prospectos')
      } else {
        throw new Error('Error al eliminar')
      }
    } catch {
      toast.error('Error al eliminar prospecto')
    }
  }

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHistoryText.trim()) {
      toast.error('Escribe algo para el historial')
      return
    }

    setSavingHistory(true)

    try {
      const response = await fetch(`/api/admin/prospects/${id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: newHistoryText })
      })

      if (response.ok) {
        toast.success('Entrada añadida al historial')
        setNewHistoryText('')
        setShowAddHistoryModal(false)
        fetchProspect()
      } else {
        throw new Error('Error al añadir historial')
      }
    } catch {
      toast.error('Error al añadir entrada')
    } finally {
      setSavingHistory(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Prospecto no encontrado</p>
        <Link href="/admin/prospectos">
          <Button className="mt-4">Volver a prospectos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Link href="/admin/prospectos">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {prospect.empresa}
            </h1>
            <ProspectStatusBadge status={prospect.estado} />
            <ProspectSourceBadge source={prospect.canalEntrada} />
          </div>
          <p className="text-gray-600 mt-1">
            {prospect.contacto}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {prospect.proximaAccion && (
            <Button
              onClick={() => setShowMarkDoneModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Hecho
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Datos de contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Datos de contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prospect.telefono && (
                <a
                  href={`tel:${prospect.telefono}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Phone className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">{prospect.telefono}</span>
                </a>
              )}

              {(prospect.ciudad || prospect.provincia) && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">
                    {prospect.ciudad}{prospect.ciudad && prospect.provincia ? ', ' : ''}{prospect.provincia}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Primer contacto</p>
                  <p className="text-gray-700">{formatDate(prospect.fechaPrimerContacto)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nota clave */}
          {prospect.notaClave && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nota clave</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{prospect.notaClave}</p>
              </CardContent>
            </Card>
          )}

          {/* Próxima acción */}
          <Card className={prospect.fechaProximaAccion ? 'border-orange-200' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Próxima acción</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.proximaAccion ? (
                <div className="space-y-2">
                  <p className="text-gray-800 font-medium">{prospect.proximaAccion}</p>
                  {prospect.fechaProximaAccion && (
                    <p className="text-sm text-orange-600">
                      {formatDate(prospect.fechaProximaAccion)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No hay acción programada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Historial */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Historial de contactos ({prospect.historial.length})
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddHistoryModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </CardHeader>
            <CardContent>
              <ProspectHistoryList historial={prospect.historial} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Editar */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Prospecto"
        maxWidth="2xl"
      >
        <ProspectForm
          prospect={prospect}
          onSuccess={() => {
            setShowEditModal(false)
            fetchProspect()
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Modal Marcar como Hecho */}
      <ProspectMarkDoneModal
        isOpen={showMarkDoneModal}
        onClose={() => setShowMarkDoneModal(false)}
        prospect={prospect}
        onSuccess={() => {
          fetchProspect()
        }}
      />

      {/* Modal Añadir Historial */}
      <Modal
        isOpen={showAddHistoryModal}
        onClose={() => {
          setShowAddHistoryModal(false)
          setNewHistoryText('')
        }}
        title="Añadir entrada al historial"
        maxWidth="lg"
      >
        <form onSubmit={handleAddHistory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué ocurrió?
            </label>
            <textarea
              value={newHistoryText}
              onChange={(e) => setNewHistoryText(e.target.value)}
              placeholder="Describe el contacto o acción realizada..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddHistoryModal(false)
                setNewHistoryText('')
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={savingHistory}>
              {savingHistory ? 'Guardando...' : 'Añadir'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
