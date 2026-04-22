'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ProspectStatusBadge } from './ProspectStatusBadge'
import { ProspectSourceBadge } from './ProspectSourceBadge'
import { Eye, Phone, Edit, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Prospect {
  id: string
  empresa: string
  contacto: string
  telefono: string | null
  ciudad: string | null
  provincia: string | null
  canalEntrada: 'LLAMADA_FRIA' | 'REFERIDO' | 'WEB' | 'RRSS'
  estado: 'VERDE' | 'AMARILLO' | 'ROJO'
  proximaAccion: string | null
  fechaProximaAccion: string | null
  notaClave: string | null
  _count: {
    historial: number
  }
}

interface ProspectTableProps {
  prospects: Prospect[]
  onMarkDone: (prospect: Prospect) => void
  onEdit: (prospect: Prospect) => void
  onRefresh: () => void
}

export function ProspectTable({ prospects, onMarkDone, onEdit, onRefresh }: ProspectTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (prospect: Prospect) => {
    if (!confirm(`¿Eliminar el prospecto "${prospect.empresa}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeletingId(prospect.id)

    try {
      const response = await fetch(`/api/admin/prospects/${prospect.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      toast.success('Prospecto eliminado')
      onRefresh()
    } catch {
      toast.error('Error al eliminar prospecto')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isToday = (dateString: string | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  if (prospects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">No hay prospectos que mostrar</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista Desktop */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Próxima Acción</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prospects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{prospect.empresa}</p>
                      {prospect.ciudad && (
                        <p className="text-xs text-gray-500">
                          {prospect.ciudad}{prospect.provincia ? `, ${prospect.provincia}` : ''}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900">{prospect.contacto}</p>
                      {prospect.telefono && (
                        <a
                          href={`tel:${prospect.telefono}`}
                          className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {prospect.telefono}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ProspectStatusBadge status={prospect.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <ProspectSourceBadge source={prospect.canalEntrada} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 max-w-xs truncate">
                      {prospect.proximaAccion || '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${
                      isOverdue(prospect.fechaProximaAccion)
                        ? 'text-red-600 font-medium'
                        : isToday(prospect.fechaProximaAccion)
                        ? 'text-orange-600 font-medium'
                        : 'text-gray-600'
                    }`}>
                      {formatDate(prospect.fechaProximaAccion)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {prospect.proximaAccion && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onMarkDone(prospect)}
                          title="Marcar como hecho"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Link href={`/admin/prospectos/${prospect.id}`}>
                        <Button size="sm" variant="ghost" title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(prospect)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(prospect)}
                        disabled={deletingId === prospect.id}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Mobile (Cards) */}
      <div className="md:hidden space-y-3">
        {prospects.map((prospect) => (
          <div
            key={prospect.id}
            className="bg-white rounded-lg border p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{prospect.empresa}</p>
                <p className="text-sm text-gray-600">{prospect.contacto}</p>
              </div>
              <ProspectStatusBadge status={prospect.estado} />
            </div>

            {prospect.telefono && (
              <a
                href={`tel:${prospect.telefono}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium mb-3"
              >
                <Phone className="h-4 w-4" />
                {prospect.telefono}
              </a>
            )}

            {prospect.proximaAccion && (
              <div className="mb-3 p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500 mb-1">Próxima acción:</p>
                <p className="text-sm text-gray-800">{prospect.proximaAccion}</p>
                {prospect.fechaProximaAccion && (
                  <p className={`text-xs mt-1 ${
                    isOverdue(prospect.fechaProximaAccion)
                      ? 'text-red-600 font-medium'
                      : isToday(prospect.fechaProximaAccion)
                      ? 'text-orange-600 font-medium'
                      : 'text-gray-500'
                  }`}>
                    {formatDate(prospect.fechaProximaAccion)}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <ProspectSourceBadge source={prospect.canalEntrada} />

              <div className="flex items-center gap-1">
                {prospect.proximaAccion && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMarkDone(prospect)}
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                <Link href={`/admin/prospectos/${prospect.id}`}>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(prospect)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(prospect)}
                  disabled={deletingId === prospect.id}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
