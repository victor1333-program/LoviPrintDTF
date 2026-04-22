"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"
import {
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  UserPlus,
} from "lucide-react"

interface TrackingOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  paymentStatus: string
  subtotal: string
  taxAmount: string
  shippingCost: string
  discountAmount: string
  totalPrice: string
  shippingAddress: any
  trackingNumber: string | null
  trackingUrl: string | null
  estimatedDelivery: string | null
  isGuestOrder: boolean
  createdAt: string
  items: Array<{
    id: string
    productName: string
    quantity: string
    unitPrice: string
    subtotal: string
    fileName: string | null
  }>
  statusHistory: Array<{
    status: string
    notes: string | null
    createdAt: string
  }>
  canClaimAccount: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendiente de pago", color: "warning", icon: Clock },
  CONFIRMED: { label: "Confirmado", color: "info", icon: CheckCircle2 },
  IN_PRODUCTION: { label: "En producción", color: "info", icon: Package },
  READY: { label: "Listo para envío", color: "info", icon: Package },
  SHIPPED: { label: "Enviado", color: "success", icon: Truck },
  DELIVERED: { label: "Entregado", color: "success", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", color: "error", icon: AlertCircle },
}

export default function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [token])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/track/${token}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "No se pudo cargar el pedido")
        return
      }
      const data = await res.json()
      setOrder(data)
    } catch (err) {
      setError("Error al cargar el pedido")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Pedido no encontrado</h2>
            <p className="text-gray-600 mb-4">
              {error || "No pudimos encontrar el pedido con este enlace."}
            </p>
            <Link href="/">
              <Button>Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon
  const shipping = order.shippingAddress as any

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Seguimiento de Pedido
          </h1>
          <p className="text-gray-600 mt-2">
            Pedido <strong>#{order.orderNumber}</strong>
          </p>
        </div>

        {/* Estado principal */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <StatusIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <Badge variant={statusConfig.color as any} className="mb-2">
                  {statusConfig.label}
                </Badge>
                <h2 className="text-xl font-bold">
                  Hola {order.customerName.split(" ")[0]},
                </h2>
                <p className="text-gray-600 text-sm">
                  {order.status === "DELIVERED"
                    ? "Tu pedido ha sido entregado correctamente"
                    : order.status === "SHIPPED"
                    ? "Tu pedido está en camino"
                    : order.status === "CANCELLED"
                    ? "Este pedido fue cancelado"
                    : "Te mantendremos informado por email"}
                </p>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Número de seguimiento GLS
                    </p>
                    <p className="text-lg font-mono font-bold text-green-700 mt-1">
                      {order.trackingNumber}
                    </p>
                    <a
                      href="https://gls-group.com/ES/es/recibir-paquetes/seguimiento-envio/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 underline hover:text-green-800"
                    >
                      Seguir en GLS →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA crear cuenta (solo invitados) */}
        {order.canClaimAccount && (
          <Card className="mb-6 border-primary-200 bg-gradient-to-r from-primary-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <UserPlus className="h-8 w-8 text-primary-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    ¿Quieres ver todos tus pedidos en un solo lugar?
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Crea tu cuenta con el email <strong>{order.customerEmail}</strong>{" "}
                    y este pedido se vinculará automáticamente.
                  </p>
                  <Link href={`/auth/signup?email=${encodeURIComponent(order.customerEmail)}`}>
                    <Button size="sm">Crear mi cuenta</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Items */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start pb-3 border-b last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice))}
                      </p>
                      {item.fileName && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {item.fileName}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-primary-600 ml-4">
                      {formatCurrency(Number(item.subtotal))}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Dirección */}
            {shipping && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección de envío
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{shipping.street}</p>
                  <p className="text-gray-600">
                    {shipping.postalCode} {shipping.city}
                    {shipping.state ? `, ${shipping.state}` : ""}
                  </p>
                  <p className="text-gray-600">{shipping.country}</p>
                </CardContent>
              </Card>
            )}

            {/* Historial */}
            {order.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {order.statusHistory.map((h, i) => {
                      const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.PENDING
                      return (
                        <li key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary-600 mt-2" />
                            {i < order.statusHistory.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="font-medium text-sm">{cfg.label}</p>
                            {h.notes && (
                              <p className="text-xs text-gray-600 mt-0.5">{h.notes}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(h.createdAt).toLocaleString("es-ES")}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(Number(order.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA</span>
                  <span>{formatCurrency(Number(order.taxAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span>
                    {Number(order.shippingCost) === 0
                      ? "GRATIS"
                      : formatCurrency(Number(order.shippingCost))}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatCurrency(Number(order.totalPrice))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 pt-3 border-t">
                  Pedido realizado el{" "}
                  {new Date(order.createdAt).toLocaleDateString("es-ES")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            ¿Alguna duda?{" "}
            <a
              href="mailto:info@loviprintdtf.es"
              className="text-primary-600 hover:underline font-medium"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
