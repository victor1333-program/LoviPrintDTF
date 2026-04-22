'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProspectStatusBadge } from './ProspectStatusBadge'
import toast from 'react-hot-toast'

interface ProspectMarkDoneModalProps {
  isOpen: boolean
  onClose: () => void
  prospect: {
    id: string
    empresa: string
    contacto: string
    telefono: string | null
    estado: 'VERDE' | 'AMARILLO' | 'ROJO'
    proximaAccion: string | null
  } | null
  onSuccess: () => void
}

export function ProspectMarkDoneModal({
  isOpen,
  onClose,
  prospect,
  onSuccess
}: ProspectMarkDoneModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    resultado: '',
    nuevaProximaAccion: '',
    nuevaFechaProximaAccion: '',
    nuevoEstado: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prospect) return
    if (!formData.resultado.trim()) {
      toast.error('Describe qué pasó en la acción')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/prospects/${prospect.id}/mark-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultado: formData.resultado,
          nuevaProximaAccion: formData.nuevaProximaAccion || undefined,
          nuevaFechaProximaAccion: formData.nuevaFechaProximaAccion
            ? new Date(formData.nuevaFechaProximaAccion).toISOString()
            : undefined,
          nuevoEstado: formData.nuevoEstado || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al marcar como hecho')
      }

      toast.success('Acción completada y registrada')
      setFormData({
        resultado: '',
        nuevaProximaAccion: '',
        nuevaFechaProximaAccion: '',
        nuevoEstado: ''
      })
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      resultado: '',
      nuevaProximaAccion: '',
      nuevaFechaProximaAccion: '',
      nuevoEstado: ''
    })
    onClose()
  }

  const estadoOptions = [
    { value: '', label: 'Sin cambio' },
    { value: 'VERDE', label: 'Verde (Activo)' },
    { value: 'AMARILLO', label: 'Amarillo (Seguimiento)' },
    { value: 'ROJO', label: 'Rojo (Frío)' }
  ]

  if (!prospect) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Marcar acción como hecha"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info del prospecto */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{prospect.empresa}</span>
            <ProspectStatusBadge status={prospect.estado} />
          </div>
          <p className="text-sm text-gray-600">{prospect.contacto}</p>
          {prospect.proximaAccion && (
            <p className="text-sm text-gray-800 mt-2">
              <span className="font-medium">Acción pendiente:</span> {prospect.proximaAccion}
            </p>
          )}
        </div>

        {/* Resultado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Qué pasó? *
          </label>
          <textarea
            value={formData.resultado}
            onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
            placeholder="Describe brevemente el resultado del contacto..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            maxLength={2000}
            autoFocus
          />
        </div>

        {/* Próxima acción */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Programar siguiente acción (opcional)</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Próxima acción
              </label>
              <textarea
                value={formData.nuevaProximaAccion}
                onChange={(e) => setFormData({ ...formData, nuevaProximaAccion: e.target.value })}
                placeholder="¿Qué hay que hacer a continuación?"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={formData.nuevaFechaProximaAccion}
                  onChange={(e) => setFormData({ ...formData, nuevaFechaProximaAccion: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cambiar estado
                </label>
                <select
                  value={formData.nuevoEstado}
                  onChange={(e) => setFormData({ ...formData, nuevoEstado: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {estadoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
