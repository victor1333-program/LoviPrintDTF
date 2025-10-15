"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Download, CheckCircle2, Printer, Zap, Scissors, Ruler, Eye } from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

interface QueueOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  createdAt: string
  items: any[]
  isPrioritized: boolean
}

export default function ColaImpresionPage() {
  const [orders, setOrders] = useState<QueueOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [processingOrder, setProcessingOrder] = useState<string | null>(null)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    try {
      const res = await fetch('/api/admin/print-queue')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error loading queue:', error)
      toast.error('Error al cargar la cola de impresión')
    } finally {
      setLoading(false)
    }
  }

  const handleReceived = async (orderId: string) => {
    setProcessingOrder(orderId)
    try {
      const res = await fetch(`/api/admin/print-queue/${orderId}/receive`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Pedido marcado como recibido - En Producción')
        await loadQueue()
      } else {
        toast.error('Error al marcar como recibido')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar')
    } finally {
      setProcessingOrder(null)
    }
  }

  const handlePrinted = async (orderId: string) => {
    setProcessingOrder(orderId)
    try {
      const res = await fetch(`/api/admin/print-queue/${orderId}/printed`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Pedido marcado como impreso - Etiqueta GLS generada')
        await loadQueue()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al marcar como impreso')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar')
    } finally {
      setProcessingOrder(null)
    }
  }

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const prioritizedOrders = orders.filter(o => o.isPrioritized)
  const normalOrders = orders.filter(o => !o.isPrioritized)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cola de Impresión</h1>
        <p className="text-gray-600">
          Gestiona los pedidos pendientes de producción en orden de prioridad
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total en Cola</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <Printer className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Priorizados</p>
                <p className="text-2xl font-bold text-orange-600">{prioritizedOrders.length}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Normales</p>
                <p className="text-2xl font-bold text-blue-600">{normalOrders.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-600">
                  {orders.filter(o => o.status === 'CONFIRMED').length}
                </p>
              </div>
              <Printer className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Printer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay pedidos en cola
            </h3>
            <p className="text-gray-600">
              Los pedidos pagados aparecerán automáticamente aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pedidos Priorizados */}
          {prioritizedOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-bold text-orange-900">
                  Pedidos Priorizados ({prioritizedOrders.length})
                </h2>
              </div>
              <div className="space-y-4">
                {prioritizedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onReceived={handleReceived}
                    onPrinted={handlePrinted}
                    onDownload={downloadFile}
                    processing={processingOrder === order.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pedidos Normales */}
          {normalOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Pedidos Normales ({normalOrders.length})
                </h2>
              </div>
              <div className="space-y-4">
                {normalOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onReceived={handleReceived}
                    onPrinted={handlePrinted}
                    onDownload={downloadFile}
                    processing={processingOrder === order.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderCard({
  order,
  onReceived,
  onPrinted,
  onDownload,
  processing
}: {
  order: QueueOrder
  onReceived: (id: string) => void
  onPrinted: (id: string) => void
  onDownload: (url: string, name: string) => void
  processing: boolean
}) {
  const extras = order.items[0]?.customizations?.extras

  return (
    <Card className={order.isPrioritized ? 'border-2 border-orange-400 bg-orange-50' : ''}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold">#{order.orderNumber}</h3>
              {order.isPrioritized && (
                <Badge className="bg-orange-600 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  PRIORITARIO
                </Badge>
              )}
              <Badge variant={order.status === 'CONFIRMED' ? 'warning' : 'info'}>
                {order.status === 'CONFIRMED' ? 'Pendiente' : 'En Producción'}
              </Badge>
            </div>
            <p className="text-gray-600">
              Cliente: <span className="font-semibold">{order.customerName}</span> • {order.customerEmail}
            </p>
            <p className="text-sm text-gray-500">
              Recibido: {formatDate(new Date(order.createdAt))}
            </p>
          </div>

          <Link href={`/admin/pedidos/${order.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver Pedido
            </Button>
          </Link>
        </div>

        {/* Detalles de productos */}
        <div className="space-y-3 mb-4">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="bg-white rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{item.productName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {item.quantity} {item.product?.unit || 'metros'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(Number(item.subtotal))}
                    </span>
                  </div>
                </div>

                {/* Botón de descarga */}
                {item.fileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(item.fileUrl, item.fileName || 'diseño.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Diseño
                  </Button>
                )}
              </div>

              {/* Extras */}
              {item.customizations?.extras && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-600 mb-2">EXTRAS SOLICITADOS:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.customizations.extras.prioritize && (
                      <Badge variant="warning" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Priorizar Pedido (+{formatCurrency(item.customizations.extras.prioritize.price)})
                      </Badge>
                    )}
                    {item.customizations.extras.layout && (
                      <Badge variant="info" className="text-xs">
                        Maquetación (+{formatCurrency(item.customizations.extras.layout.price)})
                      </Badge>
                    )}
                    {item.customizations.extras.cutting && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        <Scissors className="h-3 w-3 mr-1" />
                        Servicio de Corte (+{formatCurrency(item.customizations.extras.cutting.price)})
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          {order.status === 'CONFIRMED' && (
            <Button
              onClick={() => onReceived(order.id)}
              disabled={processing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {processing ? 'Procesando...' : 'Pedido Recibido → En Producción'}
            </Button>
          )}

          {order.status === 'IN_PRODUCTION' && (
            <Button
              onClick={() => onPrinted(order.id)}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              {processing ? 'Generando etiqueta...' : 'Marcar como Impreso → Generar Etiqueta GLS'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
