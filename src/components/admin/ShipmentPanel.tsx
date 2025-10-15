"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Package, Truck, Download, RefreshCw } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

interface ShipmentEvent {
  id: string
  status: string
  description: string
  location: string | null
  eventDate: string
}

interface Shipment {
  id: string
  glsReference: string | null
  trackingNumber: string | null
  status: string
  carrier: string
  recipientName: string
  recipientAddress: string
  recipientCity: string
  recipientPostal: string
  trackingEvents: ShipmentEvent[]
  createdAt: string
}

interface ShipmentPanelProps {
  orderId: string
  shipment: Shipment | null
  onUpdate: () => void
}

export default function ShipmentPanel({ orderId, shipment, onUpdate }: ShipmentPanelProps) {
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleCreateShipment = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/shipments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Envío creado exitosamente en GLS')
        onUpdate()
      } else {
        toast.error(data.error || 'Error al crear el envío')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear el envío')
    } finally {
      setCreating(false)
    }
  }

  const handleDownloadLabel = async () => {
    if (!shipment) return

    setDownloading(true)
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/label`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `etiqueta-${shipment.glsReference}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Etiqueta descargada')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al descargar la etiqueta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al descargar la etiqueta')
    } finally {
      setDownloading(false)
    }
  }

  const handleRefreshTracking = async () => {
    if (!shipment) return

    setRefreshing(true)
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/tracking`)

      if (res.ok) {
        toast.success('Seguimiento actualizado')
        onUpdate()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar el seguimiento')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el seguimiento')
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CREATED: 'bg-blue-100 text-blue-800',
      PICKED_UP: 'bg-indigo-100 text-indigo-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      EXCEPTION: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CREATED: 'Creado',
      PICKED_UP: 'Recogido',
      IN_TRANSIT: 'En Tránsito',
      OUT_FOR_DELIVERY: 'En Reparto',
      DELIVERED: 'Entregado',
      EXCEPTION: 'Incidencia',
      CANCELLED: 'Cancelado',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (!shipment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Envío GLS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">
              Este pedido aún no tiene un envío creado en GLS
            </p>
            <Button onClick={handleCreateShipment} disabled={creating}>
              <Package className="h-4 w-4 mr-2" />
              {creating ? 'Creando...' : 'Crear Envío en GLS'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Envío GLS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del envío */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Referencia GLS</p>
            <p className="font-mono font-semibold">{shipment.glsReference}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Número de seguimiento</p>
            <p className="font-mono font-semibold">{shipment.trackingNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <div className="mt-1">{getStatusBadge(shipment.status)}</div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Transportista</p>
            <p className="font-semibold">{shipment.carrier}</p>
          </div>
        </div>

        {/* Dirección de destino */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Dirección de envío</p>
          <p className="font-semibold">{shipment.recipientName}</p>
          <p className="text-sm text-gray-600">{shipment.recipientAddress}</p>
          <p className="text-sm text-gray-600">
            {shipment.recipientPostal} {shipment.recipientCity}
          </p>
        </div>

        {/* Eventos de seguimiento */}
        {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Seguimiento</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshTracking}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {shipment.trackingEvents.map((event) => (
                <div key={event.id} className="flex gap-3 text-sm">
                  <div className="text-gray-500 whitespace-nowrap">
                    {new Date(event.eventDate).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.description}</p>
                    {event.location && (
                      <p className="text-gray-500 text-xs">{event.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de descarga de etiqueta */}
        <div className="border-t pt-4">
          <Button
            onClick={handleDownloadLabel}
            disabled={downloading}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Descargando...' : 'Descargar Etiqueta PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
