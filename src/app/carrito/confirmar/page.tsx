"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, CreditCard, Package, MapPin, User, AlertCircle, Loader2, FileText, Ticket, Gift } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface CartItem {
  productId: string
  productName: string
  productImageUrl?: string
  productUnit: string
  quantity: number
  unitPrice: number
  subtotal: number
  fileUrl?: string
  fileName?: string
  customizations?: any
}

interface OrderConfirmData {
  // Datos del cliente
  customerName: string
  customerEmail: string
  customerPhone: string

  // Dirección
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }

  // Items
  items: CartItem[]

  // Totales
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingCost: number
  totalPrice: number
  pointsUsed: number
  pointsDiscount: number

  // Códigos
  voucherId?: string
  discountCodeId?: string
  useMeterVouchers: boolean
  meterVouchersInfo?: {
    metersNeeded: number
    voucherIds: string[]
  }

  // Envío
  shippingMethodId?: string | null
}

export default function ConfirmCartOrderPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderConfirmData | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Cargar datos del pedido desde sessionStorage
    const stored = sessionStorage.getItem('cart_order_confirm')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setOrderData(data)
      } catch (error) {
        console.error('Error parsing order data:', error)
        toast.error('Error al cargar los datos del pedido')
        router.push('/carrito')
      }
    } else {
      // Si no hay datos, redirigir al carrito
      toast.error('No hay datos de pedido. Por favor, completa el formulario.')
      router.push('/carrito')
    }
  }, [router])

  const handleConfirmAndPay = async () => {
    if (!orderData) return

    setProcessing(true)
    setLoading(true)

    try {
      // Crear el pedido
      const orderPayload: any = {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        shippingAddress: orderData.shippingAddress,
        items: orderData.items.map((item: CartItem) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          fileUrl: item.fileUrl || undefined,
          fileName: item.fileName || undefined,
          customizations: item.customizations || undefined,
        })),
        subtotal: orderData.subtotal,
        discountAmount: orderData.discountAmount,
        taxAmount: orderData.taxAmount,
        shippingCost: orderData.shippingCost,
        totalPrice: orderData.totalPrice,
        pointsUsed: orderData.pointsUsed,
        pointsDiscount: orderData.pointsDiscount,
        voucherId: orderData.voucherId,
        discountCodeId: orderData.discountCodeId,
        useMeterVouchers: orderData.useMeterVouchers,
        meterVouchersInfo: orderData.meterVouchersInfo,
      }

      // Solo incluir shippingMethodId si es un valor válido (no vacío)
      if (orderData.shippingMethodId && orderData.shippingMethodId.trim() !== '') {
        orderPayload.shippingMethodId = orderData.shippingMethodId
      }

      console.log('Order payload:', JSON.stringify(orderPayload, null, 2))

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!orderRes.ok) {
        const errorData = await orderRes.json()
        console.error('Order creation error:', errorData)
        if (errorData.details) {
          const detailsStr = errorData.details.map((d: any) => `${d.path}: ${d.message}`).join(', ')
          throw new Error(`${errorData.error || 'Error al crear el pedido'} (${detailsStr})`)
        }
        throw new Error(errorData.error || 'Error al crear el pedido')
      }

      const order = await orderRes.json()

      // Limpiar carrito
      await fetch('/api/cart', { method: 'DELETE' })

      // Disparar evento para actualizar el botón del carrito
      window.dispatchEvent(new Event('cartUpdated'))

      // Si el total es 0 (usando bonos o descuentos), confirmar el pedido automáticamente
      if (orderData.totalPrice === 0 || orderData.useMeterVouchers) {
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

        sessionStorage.removeItem('cart_order_confirm')
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
          amount: orderData.totalPrice,
          customerEmail: orderData.customerEmail,
          lineItems: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Pedido #${order.orderNumber}`,
                description: `${orderData.items.length} producto(s)`,
              },
              unit_amount: Math.round(orderData.totalPrice * 100),
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
      sessionStorage.removeItem('cart_order_confirm')

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
            <Link href="/carrito">
              <Button variant="ghost" size="sm" disabled={processing}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Carrito
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
              Confirmar Pedido
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Revisa los detalles de tu pedido antes de {orderData.totalPrice > 0 ? 'pagar' : 'confirmar'}
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
                  {orderData.totalPrice > 0
                    ? 'Al hacer clic en "Pagar", serás redirigido a nuestro procesador de pagos seguro (Stripe) para completar la transacción.'
                    : 'Al hacer clic en "Confirmar Pedido", tu pedido será procesado utilizando tus bonos.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Detalles del pedido */}
            <div className="lg:col-span-2 space-y-6">
              {/* Productos */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos ({orderData.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderData.items.map((item, index) => {
                    const isVoucher = item.customizations?.voucherTemplateId
                    const voucherName = item.customizations?.voucherName
                    const voucherMeters = item.customizations?.voucherMeters

                    return (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isVoucher ? (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                              <Ticket className="h-10 w-10 text-white" />
                            </div>
                          ) : item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-primary-400">
                              {item.productName.charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{isVoucher ? voucherName : item.productName}</h4>
                              {isVoucher && (
                                <Badge variant="success" className="mt-1">
                                  <Gift className="h-3 w-3 mr-1" />
                                  {voucherMeters} metros
                                </Badge>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                {item.quantity} {item.productUnit}
                                {!isVoucher && ` × ${formatCurrency(item.unitPrice)}`}
                              </p>
                            </div>
                            <p className="font-bold text-primary-600">{formatCurrency(item.subtotal)}</p>
                          </div>

                          {item.fileName && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-blue-900">Archivo adjunto:</p>
                                <p className="text-xs text-blue-700 truncate">{item.fileName}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Datos del Cliente */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Datos del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-900">{orderData.customerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900 truncate">{orderData.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium text-gray-900">{orderData.customerPhone}</p>
                    </div>
                  </div>
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
                    <p className="font-medium text-gray-900">{orderData.shippingAddress.street}</p>
                    <p className="text-gray-700">
                      {orderData.shippingAddress.postalCode} {orderData.shippingAddress.city}, {orderData.shippingAddress.state}
                    </p>
                    <p className="text-gray-700">{orderData.shippingAddress.country}</p>
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

                      {orderData.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Descuento:</span>
                          <span className="font-semibold">-{formatCurrency(orderData.discountAmount)}</span>
                        </div>
                      )}

                      {orderData.pointsDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Puntos ({orderData.pointsUsed}):</span>
                          <span className="font-semibold">-{formatCurrency(orderData.pointsDiscount)}</span>
                        </div>
                      )}

                      {orderData.useMeterVouchers && orderData.meterVouchersInfo && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Bonos ({orderData.meterVouchersInfo.metersNeeded}m):</span>
                          <span className="font-semibold">-{formatCurrency(orderData.subtotal)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IVA (21%):</span>
                        <span className="font-semibold">{formatCurrency(orderData.taxAmount)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Envío:</span>
                        <span className="font-semibold">
                          {orderData.shippingCost === 0 ? 'GRATIS' : formatCurrency(orderData.shippingCost)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-2xl font-bold text-primary-600">
                          {formatCurrency(orderData.totalPrice)}
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
                            {orderData.totalPrice > 0
                              ? `Pagar ${formatCurrency(orderData.totalPrice)}`
                              : 'Confirmar Pedido'}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-500 text-center mt-4">
                        {orderData.totalPrice > 0
                          ? 'Pago seguro procesado por Stripe'
                          : 'Tu bono será descontado al confirmar'}
                      </p>
                    </div>

                    {orderData.totalPrice > 0 && (
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
