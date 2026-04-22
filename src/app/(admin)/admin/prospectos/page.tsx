'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProspectStatsCards } from '@/components/admin/ProspectStatsCards'
import { ProspectAlertPanel, type ProspectAlert } from '@/components/admin/ProspectAlertPanel'
import { ProspectTable } from '@/components/admin/ProspectTable'
import { ProspectForm } from '@/components/admin/ProspectForm'
import { ProspectMarkDoneModal } from '@/components/admin/ProspectMarkDoneModal'
import { Plus, Search, Filter } from 'lucide-react'

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
  proximaAccion: string | null
  fechaProximaAccion: string | null
  _count: {
    historial: number
  }
}

// Tipo mínimo para el modal de marcar como hecho
interface MarkDoneProspect {
  id: string
  empresa: string
  contacto: string
  telefono: string | null
  estado: 'VERDE' | 'AMARILLO' | 'ROJO'
  proximaAccion: string | null
}

export default function ProspectosPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [selectedForMarkDone, setSelectedForMarkDone] = useState<MarkDoneProspect | null>(null)

  const fetchProspects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (estadoFilter !== 'TODOS') {
        params.set('estado', estadoFilter)
      }
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(`/api/admin/prospects?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProspects(data)
      }
    } catch (error) {
      console.error('Error fetching prospects:', error)
    } finally {
      setLoading(false)
    }
  }, [estadoFilter, searchTerm])

  useEffect(() => {
    fetchProspects()
  }, [fetchProspects, refreshTrigger])

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleMarkDone = (prospect: MarkDoneProspect) => {
    setSelectedForMarkDone(prospect)
    setShowMarkDoneModal(true)
  }

  const handleMarkDoneFromTable = (prospect: Prospect) => {
    setSelectedForMarkDone(prospect)
    setShowMarkDoneModal(true)
  }

  const handleEdit = (prospect: Prospect) => {
    setSelectedProspect(prospect)
    setShowEditModal(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    handleRefresh()
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setSelectedProspect(null)
    handleRefresh()
  }

  const handleMarkDoneSuccess = () => {
    handleRefresh()
  }

  const estadoOptions = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'VERDE', label: 'Verde' },
    { value: 'AMARILLO', label: 'Amarillo' },
    { value: 'ROJO', label: 'Rojo' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Prospectos CRM
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gestiona tus prospectos B2B y seguimiento de acciones
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Prospecto
        </Button>
      </div>

      {/* Stats Cards */}
      <ProspectStatsCards />

      {/* Alert Panel - Acciones de hoy */}
      <ProspectAlertPanel
        onMarkDone={handleMarkDone}
        refreshTrigger={refreshTrigger}
      />

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empresa, contacto, ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {estadoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de prospectos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando prospectos...</p>
        </div>
      ) : (
        <ProspectTable
          prospects={prospects}
          onMarkDone={handleMarkDoneFromTable}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modal Crear */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Prospecto"
        maxWidth="2xl"
      >
        <ProspectForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedProspect(null)
        }}
        title="Editar Prospecto"
        maxWidth="2xl"
      >
        {selectedProspect && (
          <ProspectForm
            prospect={selectedProspect}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedProspect(null)
            }}
          />
        )}
      </Modal>

      {/* Modal Marcar como Hecho */}
      <ProspectMarkDoneModal
        isOpen={showMarkDoneModal}
        onClose={() => {
          setShowMarkDoneModal(false)
          setSelectedForMarkDone(null)
        }}
        prospect={selectedForMarkDone}
        onSuccess={handleMarkDoneSuccess}
      />
    </div>
  )
}
