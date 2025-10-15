"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Download, Save, Sparkles, Check } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import ShipmentPanel from "@/components/admin/ShipmentPanel"

export default function PedidoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    adminNotes: '',
    trackingNumber: ''
  })

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        setFormData({
          status: data.status,
          paymentStatus: data.paymentStatus,
          adminNotes: data.adminNotes || '',
          trackingNumber: data.trackingNumber || ''
        })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Pedido actualizado correctamente')
        fetchOrder()
      } else {
        toast.error('Error al actualizar el pedido')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Error al actualizar el pedido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-gray-500 mb-4">Pedido no encontrado</div>
        <Link href="/admin/pedidos">
          <Button>Volver a Pedidos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/pedidos">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pedidos
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Pedido {order.orderNumber}
        </h1>
        <p className="text-gray-600 mt-2">
          Realizado el {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Información del Pedido */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles del Producto */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items del pedido */}
              {order.items && order.items.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3 font-medium">Productos del pedido:</p>
                  <div className="space-y-2">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.product?.unit || 'unidades'} × {formatCurrency(Number(item.unitPrice))}
                          </p>
                        </div>
                        <p className="font-bold text-primary-600">
                          {formatCurrency(Number(item.subtotal))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span className="font-semibold">-{formatCurrency(Number(order.discountAmount))}</span>
                  </div>
                )}
                {order.pointsDiscount > 0 && (
                  <div className="flex justify-between text-primary-600">
                    <span>Descuento por puntos ({order.pointsUsed} puntos)</span>
                    <span className="font-semibold">-{formatCurrency(Number(order.pointsDiscount))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (21%)</span>
                  <span className="font-semibold">{formatCurrency(Number(order.taxAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-semibold">{formatCurrency(Number(order.shippingCost))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(Number(order.totalPrice))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archivo de Diseño */}
          <Card>
            <CardHeader>
              <CardTitle>Archivo de Diseño</CardTitle>
            </CardHeader>
            <CardContent>
              {order.designFileUrl ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{order.designFileName}</p>
                    <p className="text-sm text-gray-600">Archivo subido por el cliente</p>
                  </div>
                  <a
                    href={order.designFileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </a>
                </div>
              ) : (
                <p className="text-gray-500">No hay archivo de diseño</p>
              )}
            </CardContent>
          </Card>

          {/* Extras Seleccionados */}
          {order.items && order.items.some((item: any) => item.customizations?.extras) && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  Extras Seleccionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.items.map((item: any, index: number) => {
                  if (!item.customizations?.extras) return null

                  return (
                    <div key={index} className="mb-4 last:mb-0">
                      <p className="font-semibold text-sm text-gray-700 mb-2">{item.productName}</p>
                      <div className="space-y-2 pl-4">
                        {item.customizations.extras.prioritize && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">Priorizar mi Pedido</span>
                            <span className="text-orange-700">
                              (+{formatCurrency(item.customizations.extras.prioritize.price)})
                            </span>
                          </div>
                        )}
                        {item.customizations.extras.layout && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Maquetación</span>
                            <span className="text-blue-700">
                              (+{formatCurrency(item.customizations.extras.layout.price)})
                            </span>
                          </div>
                        )}
                        {item.customizations.extras.cutting && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Servicio de Corte</span>
                            <span className="text-purple-700">
                              (+{formatCurrency(item.customizations.extras.cutting.price)})
                            </span>
                          </div>
                        )}
                      </div>
                      {item.customizations.extrasTotal && (
                        <div className="mt-2 pt-2 border-t border-orange-200">
                          <p className="text-sm font-bold text-orange-900">
                            Total extras: {formatCurrency(item.customizations.extrasTotal)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{order.customerEmail}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-semibold">{order.customerPhone}</p>
                </div>
              )}
              {order.shippingAddress && (
                <div>
                  <p className="text-sm text-gray-600">Dirección de envío</p>
                  <p className="font-semibold">
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                  </p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notas del cliente</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de Gestión y Envío */}
        <div className="space-y-6">
          {/* Panel de envío GLS */}
          <ShipmentPanel
            orderId={order.id}
            shipment={order.shipment || null}
            onUpdate={fetchOrder}
          />

          <Card>
            <CardHeader>
              <CardTitle>Gestión del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Pedido
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="IN_PRODUCTION">En Producción</option>
                  <option value="READY">Listo</option>
                  <option value="SHIPPED">Enviado</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Pago
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="PAID">Pagado</option>
                  <option value="FAILED">Fallido</option>
                  <option value="REFUNDED">Reembolsado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Seguimiento
                </label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del Administrador
                </label>
                <textarea
                  value={formData.adminNotes}
                  onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Notas internas sobre este pedido..."
                />
              </div>

              <Button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
