'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface ProspectFormData {
  empresa: string
  contacto: string
  telefono: string
  ciudad: string
  provincia: string
  canalEntrada: 'LLAMADA_FRIA' | 'REFERIDO' | 'WEB' | 'RRSS'
  estado: 'VERDE' | 'AMARILLO' | 'ROJO'
  notaClave: string
  proximaAccion: string
  fechaProximaAccion: string
  historialInicial: string
}

interface ProspectFormProps {
  prospect?: {
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
  }
  onSuccess: () => void
  onCancel: () => void
}

export function ProspectForm({ prospect, onSuccess, onCancel }: ProspectFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProspectFormData>({
    empresa: prospect?.empresa || '',
    contacto: prospect?.contacto || '',
    telefono: prospect?.telefono || '',
    ciudad: prospect?.ciudad || '',
    provincia: prospect?.provincia || '',
    canalEntrada: prospect?.canalEntrada || 'LLAMADA_FRIA',
    estado: prospect?.estado || 'VERDE',
    notaClave: prospect?.notaClave || '',
    proximaAccion: prospect?.proximaAccion || '',
    fechaProximaAccion: prospect?.fechaProximaAccion
      ? new Date(prospect.fechaProximaAccion).toISOString().split('T')[0]
      : '',
    historialInicial: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = prospect
        ? `/api/admin/prospects/${prospect.id}`
        : '/api/admin/prospects'

      const method = prospect ? 'PATCH' : 'POST'

      // Preparar datos
      const dataToSend = {
        ...formData,
        telefono: formData.telefono || undefined,
        ciudad: formData.ciudad || undefined,
        provincia: formData.provincia || undefined,
        notaClave: formData.notaClave || undefined,
        proximaAccion: formData.proximaAccion || undefined,
        fechaProximaAccion: formData.fechaProximaAccion
          ? new Date(formData.fechaProximaAccion).toISOString()
          : null,
        historialInicial: !prospect && formData.historialInicial
          ? formData.historialInicial
          : undefined
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar prospecto')
      }

      toast.success(prospect ? 'Prospecto actualizado' : 'Prospecto creado')
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const canalOptions = [
    { value: 'LLAMADA_FRIA', label: 'Llamada fría' },
    { value: 'REFERIDO', label: 'Referido' },
    { value: 'WEB', label: 'Web' },
    { value: 'RRSS', label: 'Redes Sociales' }
  ]

  const estadoOptions = [
    { value: 'VERDE', label: 'Verde (Activo)' },
    { value: 'AMARILLO', label: 'Amarillo (Seguimiento)' },
    { value: 'ROJO', label: 'Rojo (Frío)' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Empresa *"
          value={formData.empresa}
          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          required
          placeholder="Nombre de la empresa"
        />

        <Input
          label="Contacto *"
          value={formData.contacto}
          onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
          required
          placeholder="Nombre del contacto"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Teléfono"
          type="tel"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          placeholder="+34 600 000 000"
        />

        <Input
          label="Ciudad"
          value={formData.ciudad}
          onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
          placeholder="Ciudad"
        />

        <Input
          label="Provincia"
          value={formData.provincia}
          onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
          placeholder="Provincia"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Canal de entrada *
          </label>
          <select
            value={formData.canalEntrada}
            onChange={(e) => setFormData({
              ...formData,
              canalEntrada: e.target.value as typeof formData.canalEntrada
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            {canalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData({
              ...formData,
              estado: e.target.value as typeof formData.estado
            })}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nota clave
        </label>
        <textarea
          value={formData.notaClave}
          onChange={(e) => setFormData({ ...formData, notaClave: e.target.value })}
          placeholder="Lo más importante que dijeron..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          maxLength={500}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Próxima acción</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué hay que hacer?
            </label>
            <textarea
              value={formData.proximaAccion}
              onChange={(e) => setFormData({ ...formData, proximaAccion: e.target.value })}
              placeholder="Llamar para seguimiento, enviar presupuesto..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Cuándo?
            </label>
            <Input
              type="date"
              value={formData.fechaProximaAccion}
              onChange={(e) => setFormData({ ...formData, fechaProximaAccion: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {!prospect && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Primer contacto</h4>
          <textarea
            value={formData.historialInicial}
            onChange={(e) => setFormData({ ...formData, historialInicial: e.target.value })}
            placeholder="Describe el primer contacto con este prospecto..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            maxLength={2000}
          />
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : prospect ? 'Actualizar' : 'Crear prospecto'}
        </Button>
      </div>
    </form>
  )
}
