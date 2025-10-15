"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CheckCircle2, CreditCard, Download, Home, Loader2, Mail, Sparkles } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingCost: number
  totalPrice: number
  pointsUsed: number
  pointsDiscount: number
  status: string
  paymentStatus: string
  shippingAddress?: any
  items: any[]
  createdAt: string
}

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = params.orderNumber as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)

  useEffect(() => {
    const initPage = async () => {
      const loadedOrder = await loadOrder()

      // Si viene de un pago exitoso, verificar el estado del pedido
      const paymentStatus = searchParams.get('payment')
      if (paymentStatus === 'success' && loadedOrder) {
        setCheckingPayment(true)
        await checkPaymentStatus(loadedOrder)
      }
    }

    initPage()
  }, [orderNumber])

  const loadOrder = async (): Promise<Order | null> => {
    try {
      const res = await fetch(`/api/orders?orderNumber=${orderNumber}`)
      if (!res.ok) {
        throw new Error('Pedido no encontrado')
      }
      const data = await res.json()
      setOrder(data)
      return data
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('No se pudo cargar el pedido')
      router.push('/')
      return null
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async (orderData: Order) => {
    if (!orderData) {
      console.error('[Client] No order available for payment verification')
      setCheckingPayment(false)
      return
    }

    let attempts = 0
    const maxAttempts = 8
    const interval = 3000 // 3 segundos

    const verifyPaymentDirectly = async (): Promise<boolean> => {
      try {
        if (!orderData) {
          console.error('[Client] Order became null during verification')
          return false
        }

        console.log('[Client] Verificando pago directamente con Stripe...')

        const res = await fetch('/api/payments/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderData.id }),
        })

        if (!res.ok) {
          console.error('[Client] Verify payment API returned error:', res.status)
          return false
        }

        const data = await res.json()
        console.log('[Client] Verify payment response:', data)

        if (data.success && data.paid) {
          // Recargar el pedido para obtener los datos actualizados
          await loadOrder()
          setCheckingPayment(false)
          toast.success('¡Pago confirmado! Tu pedido está siendo procesado.')
          window.history.replaceState({}, '', `/pedidos/${orderNumber}`)
          return true
        }

        return false
      } catch (error) {
        console.error('[Client] Error verificando pago:', error)
        return false
      }
    }

    const checkStatus = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/orders?orderNumber=${orderNumber}`)
        if (!res.ok) return false

        const data = await res.json()
        setOrder(data)

        if (data.paymentStatus === 'PAID') {
          setCheckingPayment(false)
          toast.success('¡Pago confirmado! Tu pedido está siendo procesado.')
          window.history.replaceState({}, '', `/pedidos/${orderNumber}`)
          return true
        }

        return false
      } catch (error) {
        console.error('[Client] Error checking payment status:', error)
        return false
      }
    }

    // Primer intento: verificar directamente con Stripe
    const isPaidDirect = await verifyPaymentDirectly()
    if (isPaidDirect) return

    // Si no está pagado aún, hacer polling
    const intervalId = setInterval(async () => {
      attempts++

      // Cada 2 intentos, intentar verificar directamente con Stripe
      const shouldVerifyDirect = attempts % 2 === 0
      const isPaid = shouldVerifyDirect
        ? await verifyPaymentDirectly()
        : await checkStatus()

      if (isPaid || attempts >= maxAttempts) {
        clearInterval(intervalId)

        if (!isPaid && attempts >= maxAttempts) {
          setCheckingPayment(false)
          toast.error(
            'El pago puede tardar unos minutos en procesarse. Por favor, actualiza la página en unos momentos.',
            { duration: 6000 }
          )
        }
      }
    }, interval)
  }

  const handlePayment = async () => {
    if (!order) return

    setProcessingPayment(true)
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pago')
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error processing payment:', error)
      toast.error(error.message || 'Error al procesar el pago')
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Pedido no encontrado</h2>
          <Link href="/">
            <Button>Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.paymentStatus === 'PAID'

  // Verificar si el pedido contiene un producto de tipo VOUCHER (bono)
  const isVoucherOrder = order.items.some((item: any) => item.product?.productType === 'VOUCHER')

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isPaid ? '¡Pedido Confirmado!' : '¡Pedido Creado con Éxito!'}
            </h1>
            <p className="text-gray-600">
              {isPaid
                ? 'Tu pago ha sido procesado correctamente'
                : 'Completa el pago para confirmar tu pedido'}
            </p>
          </div>

          {/* Checking Payment Status */}
          {checkingPayment && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Verificando tu pago...
                    </h3>
                    <p className="text-sm text-gray-600">
                      Estamos confirmando tu pago con Stripe. Esto solo tomará unos segundos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Status */}
          {!isPaid && !checkingPayment && (
            <Card className="mb-6 border-primary-200 bg-primary-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Pago Pendiente
                    </h3>
                    <p className="text-sm text-gray-600">
                      Haz clic en el botón para completar el pago de forma segura con Stripe
                    </p>
                  </div>
                  <Button
                    onClick={handlePayment}
                    disabled={processingPayment}
                    size="lg"
                    className="ml-4"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pagar {formatCurrency(order.totalPrice)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader className="bg-primary-50 border-b">
              <CardTitle className="flex items-center justify-between">
                <span>Pedido {order.orderNumber}</span>
                <span className="text-sm font-normal text-gray-600">
                  {formatDate(new Date(order.createdAt))}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Productos
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity} {item.product?.unit || 'unidades'}
                          </p>
                          {item.fileName && (
                            <p className="text-xs text-gray-500 mt-1">
                              Archivo: {item.fileName}
                            </p>
                          )}
                          {/* Mostrar extras si los hay */}
                          {item.customizations?.extras && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.customizations.extras.prioritize && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                  <Sparkles className="h-3 w-3" />
                                  Priorizado (+{formatCurrency(item.customizations.extras.prioritize.price)})
                                </span>
                              )}
                              {item.customizations.extras.layout && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  Maquetación (+{formatCurrency(item.customizations.extras.layout.price)})
                                </span>
                              )}
                              {item.customizations.extras.cutting && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  Servicio de Corte (+{formatCurrency(item.customizations.extras.cutting.price)})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.unitPrice)}/{item.product?.unit || 'ud'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Resumen del Pedido
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">
                        {formatCurrency(order.subtotal)}
                      </span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span className="font-semibold">
                          -{formatCurrency(order.discountAmount)}
                        </span>
                      </div>
                    )}
                    {order.pointsDiscount > 0 && (
                      <div className="flex justify-between text-primary-600">
                        <span>Descuento por puntos ({order.pointsUsed} puntos):</span>
                        <span className="font-semibold">
                          -{formatCurrency(order.pointsDiscount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA (21%):</span>
                      <span className="font-semibold">
                        {formatCurrency(order.taxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío:</span>
                      <span className="font-semibold">
                        {order.shippingCost === 0 ? 'GRATIS' : formatCurrency(order.shippingCost)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Información de Contacto
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <p className="font-semibold">{order.customerName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-semibold">{order.customerEmail}</p>
                    </div>
                    {order.customerPhone && (
                      <div>
                        <span className="text-sm text-gray-600">Teléfono:</span>
                        <p className="font-semibold">{order.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Dirección de Envío
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold">
                        {order.shippingAddress.address}
                      </p>
                      <p className="text-gray-600">
                        {order.shippingAddress.postalCode}{' '}
                        {order.shippingAddress.city}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          {isPaid && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>¿Qué sigue?</CardTitle>
              </CardHeader>
              <CardContent>
                {isVoucherOrder ? (
                  // Mensaje para pedidos de bonos
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                        1
                      </div>
                      <div>
                        <p className="font-semibold">Confirmación por Email</p>
                        <p className="text-sm text-gray-600">
                          Recibirás un email de confirmación en {order.customerEmail}
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                        2
                      </div>
                      <div>
                        <p className="font-semibold">Bono Activado</p>
                        <p className="text-sm text-gray-600">
                          Su bono ha sido activado automáticamente en su cuenta. Ya puede realizar sus pedidos de metros sin coste adicional
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                        3
                      </div>
                      <div>
                        <p className="font-semibold">Consultar Bonos</p>
                        <p className="text-sm text-gray-600">
                          Puede consultar sus bonos disponibles en su perfil de usuario
                        </p>
                      </div>
                    </li>
                  </ol>
                ) : (
                  // Mensaje para pedidos normales
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                        1
                      </div>
                      <div>
                        <p className="font-semibold">Confirmación por Email</p>
                        <p className="text-sm text-gray-600">
                          Recibirás un email de confirmación en {order.customerEmail}
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                        2
                      </div>
                      <div>
                        <p className="font-semibold">Producción</p>
                        <p className="text-sm text-gray-600">
                          Comenzaremos a producir tu pedido en las próximas horas
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                        3
                      </div>
                      <div>
                        <p className="font-semibold">Envío</p>
                        <p className="text-sm text-gray-600">
                          Recibirás tu pedido en 24-48 horas laborables
                        </p>
                      </div>
                    </li>
                  </ol>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" size="lg">
                <Home className="h-5 w-5 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
            <Link href="/cuenta">
              <Button size="lg">
                Ver Mis Pedidos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
