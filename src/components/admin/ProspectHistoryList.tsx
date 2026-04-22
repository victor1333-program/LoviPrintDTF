'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'

interface HistoryEntry {
  id: string
  texto: string
  createdAt: string
}

interface ProspectHistoryListProps {
  historial: HistoryEntry[]
}

export function ProspectHistoryList({ historial }: ProspectHistoryListProps) {
  if (historial.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No hay entradas en el historial</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {historial.map((entry, index) => (
        <div
          key={entry.id}
          className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
        >
          {/* Dot */}
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary-500"></div>

          {/* Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {entry.texto}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(entry.createdAt), {
                addSuffix: true,
                locale: es
              })}
              {' · '}
              {new Date(entry.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
