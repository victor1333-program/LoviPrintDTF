'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProspectStatusBadge } from './ProspectStatusBadge'
import { AlertCircle, Phone, CheckCircle, Clock } from 'lucide-react'

export interface ProspectAlert {
  id: string
  empresa: string
  contacto: string
  telefono: string | null
  estado: 'VERDE' | 'AMARILLO' | 'ROJO'
  proximaAccion: string | null
  fechaProximaAccion: string | null
  notaClave: string | null
  diasVencidos: number
}

interface ProspectAlertPanelProps {
  onMarkDone: (prospect: ProspectAlert) => void
  refreshTrigger?: number
}

export function ProspectAlertPanel({ onMarkDone, refreshTrigger }: ProspectAlertPanelProps) {
  const [alerts, setAlerts] = useState<ProspectAlert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/prospects/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [refreshTrigger])

  if (loading) {
    return (
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
            Cargando alertas...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Hoy no tienes acciones pendientes
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          Acciones de hoy ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-red-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">
                      {alert.empresa}
                    </span>
                    <ProspectStatusBadge status={alert.estado} />
                    {alert.diasVencidos > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                        {alert.diasVencidos} día{alert.diasVencidos > 1 ? 's' : ''} vencido
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.contacto}
                  </p>
                  {alert.proximaAccion && (
                    <p className="text-sm text-gray-800 mt-1 font-medium">
                      {alert.proximaAccion}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.telefono && (
                    <a
                      href={`tel:${alert.telefono}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">{alert.telefono}</span>
                      <span className="sm:hidden">Llamar</span>
                    </a>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onMarkDone(alert)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Hecho
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
