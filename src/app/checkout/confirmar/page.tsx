"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, CreditCard, Package, MapPin, User, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface OrderConfirmData {
  // Datos del pedido
  meters: number
  pricePerMeter: number
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  usingVoucher: boolean
  voucherId?: string
  discountCodeId?: string
  shippingMethodId?: string

  // Datos del cliente
  name: string
  email: string
  phone: string
  company: string
  taxId: string
  isProfessional: boolean

  // Dirección de envío
  address: string
  city: string
  state: string
  postalCode: string
  country: string

  // Archivo y notas
  designFile: {
    url: string
    name: string
    size: number
    publicId?: string
  }
  notes: string
  selectedVoucher: string | null
  saveAddress: boolean
  useNewAddress: boolean
}

export default function ConfirmOrderPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [orderData, setOrderData] = useState<OrderConfirmData | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Cargar datos del pedido desde sessionStorage
    const stored = sessionStorage.getItem('dtf_order_confirm')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setOrderData(data)
      } catch (error) {
        console.error('Error parsing order data:', error)
        toast.error('Error al cargar los datos del pedido')
        router.push('/checkout')
      }
    } else {
      // Si no hay datos, redirigir al checkout
      toast.error('No hay datos de pedido. Por favor, completa el formulario.')
      router.push('/checkout')
    }
  }, [router])

  const handleConfirmAndPay = async () => {
    if (!orderData) return

    setProcessing(true)
    setLoading(true)

    try {
      // Crear el pedido
      const orderPayload = {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        company: orderData.company || null,
        taxId: orderData.taxId || null,
        isProfessional: orderData.isProfessional,
        metersOrdered: orderData.meters,
        pricePerMeter: orderData.pricePerMeter,
        subtotal: orderData.subtotal,
        discountAmount: orderData.discount || 0,
        taxAmount: orderData.tax,
        shippingCost: orderData.shipping,
        totalPrice: orderData.total,
        designFileUrl: orderData.designFile.url,
        designFileName: orderData.designFile.name,
        voucherCode: orderData.selectedVoucher,
        discountCodeId: orderData.discountCodeId,
        shippingMethodId: orderData.shippingMethodId,
        notes: orderData.notes,
        shippingAddress: {
          street: orderData.address,
          city: orderData.city,
          state: orderData.state,
          postalCode: orderData.postalCode,
          country: orderData.country,
        },
        saveProfile: session?.user ? true : false,
        saveAddress: session?.user && orderData.saveAddress && orderData.useNewAddress ? true : false,
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!orderRes.ok) {
        const errorData = await orderRes.json()
        throw new Error(errorData.error || 'Error al crear el pedido')
      }

      const order = await orderRes.json()

      // Si el total es 0 o usando bono
      if (orderData.total === 0 || orderData.usingVoucher) {
        // Si está usando bono, ya está confirmado en el API
        // Si total es 0 por otros motivos (descuentos), necesitamos confirmar
        if (orderData.total === 0 && !orderData.usingVoucher) {
          // Llamar al endpoint de confirmación de pedidos gratuitos
          const confirmRes = await fetch('/api/orders/confirm-free', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId: order.id }),
          })

          if (!confirmRes.ok) {
            const errorData = await confirmRes.json()
            throw new Error(errorData.error || 'Error al confirmar el pedido gratuito')
          }
        }

        sessionStorage.removeItem('dtf_order_confirm')
        localStorage.removeItem('dtf_order')
        toast.success('¡Pedido confirmado con éxito!')
        router.push(`/pedidos/gracias?order=${order.orderNumber}`)
        return
      }

      // Si hay que pagar, crear sesión de Stripe
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: orderData.total,
          customerEmail: orderData.email,
          lineItems: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Pedido #${order.orderNumber}`,
                description: `Impresión DTF - ${orderData.meters}m`,
              },
              unit_amount: Math.round(orderData.total * 100),
            },
            quantity: 1,
          }],
        }),
      })

      if (!checkoutRes.ok) {
        const errorData = await checkoutRes.json()
        throw new Error(errorData.error || 'Error al procesar el pago')
      }

      const { url } = await checkoutRes.json()

      // Limpiar datos y redirigir a Stripe
      sessionStorage.removeItem('dtf_order_confirm')
      localStorage.removeItem('dtf_order')

      // Redirigir a Stripe Checkout
      window.location.href = url

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al procesar el pedido. Inténtalo de nuevo.')
      setProcessing(false)
      setLoading(false)
    }
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Cargando datos del pedido...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/checkout">
              <Button variant="ghost" size="sm" disabled={processing}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
              Confirmar Pedido
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Revisa los detalles de tu pedido antes de {orderData.total > 0 ? 'pagar' : 'confirmar'}
            </p>
          </div>

          {/* Alerta de seguridad */}
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  Último paso
                </h3>
                <p className="text-blue-800">
                  {orderData.total > 0
                    ? 'Al hacer clic en "Pagar", serás redirigido a nuestro procesador de pagos seguro (Stripe) para completar la transacción.'
                    : 'Al hacer clic en "Confirmar Pedido", tu pedido será procesado utilizando tu bono de metros.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Detalles del pedido */}
            <div className="lg:col-span-2 space-y-6">
              {/* Resumen del Producto */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detalles del Producto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Impresión DTF</p>
                      <p className="text-sm text-gray-600">{orderData.meters} metros</p>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(orderData.subtotal)}</p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Archivo de diseño:</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{orderData.designFile.name}</span>
                    </div>
                  </div>

                  {orderData.notes && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Notas adicionales:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{orderData.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Datos del Cliente */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Datos de Facturación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-900">{orderData.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900 truncate">{orderData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium text-gray-900">{orderData.phone}</p>
                    </div>
                  </div>
                  {orderData.isProfessional && (
                    <div className="border-t pt-3">
                      <Badge variant="info" className="mb-2">Profesional/Empresa</Badge>
                      {orderData.company && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">Empresa</p>
                          <p className="font-medium text-gray-900">{orderData.company}</p>
                        </div>
                      )}
                      {orderData.taxId && (
                        <div>
                          <p className="text-sm text-gray-600">NIF/CIF</p>
                          <p className="font-medium text-gray-900">{orderData.taxId}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dirección de Envío */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección de Envío
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{orderData.address}</p>
                    <p className="text-gray-700">
                      {orderData.postalCode} {orderData.city}, {orderData.state}
                    </p>
                    <p className="text-gray-700">{orderData.country}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de Pago */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader className="bg-primary-50">
                    <CardTitle>Resumen del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(orderData.subtotal)}</span>
                      </div>

                      {orderData.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Descuento:</span>
                          <span className="font-semibold">-{formatCurrency(orderData.discount)}</span>
                        </div>
                      )}

                      {orderData.selectedVoucher && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Bono aplicado:</span>
                          <span className="font-semibold">
                            -{formatCurrency(orderData.meters * orderData.pricePerMeter)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IVA (21%):</span>
                        <span className="font-semibold">{formatCurrency(orderData.tax)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Envío:</span>
                        <span className="font-semibold">
                          {orderData.shipping === 0 ? 'GRATIS' : formatCurrency(orderData.shipping)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-2xl font-bold text-primary-600">
                          {formatCurrency(orderData.total)}
                        </span>
                      </div>

                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handleConfirmAndPay}
                        disabled={processing || loading}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            {orderData.total > 0
                              ? `Pagar ${formatCurrency(orderData.total)}`
                              : 'Confirmar Pedido'}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-500 text-center mt-4">
                        {orderData.total > 0
                          ? 'Pago seguro procesado por Stripe'
                          : 'Tu bono será descontado al confirmar'}
                      </p>
                    </div>

                    {orderData.total > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                          </svg>
                          <span>Pago 100% seguro y encriptado</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
