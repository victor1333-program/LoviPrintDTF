"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import {
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Calculator,
  CreditCard,
  Download,
  Loader2,
  ExternalLink,
  Phone,
} from "lucide-react"
import toast from "react-hot-toast"

interface Quote {
  id: string
  quoteNumber: string
  status: string
  estimatedMeters: number | null
  pricePerMeter: number | null
  estimatedTotal: number | null
  needsCutting: boolean
  needsLayout: boolean
  isPriority: boolean
  paymentMethod: string | null
  paymentLinkUrl: string | null
  orderId: string | null
}

export default function QuoteActions({ quote }: { quote: Quote }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(!quote.estimatedMeters)

  // Form para cotización
  const [quoteForm, setQuoteForm] = useState({
    estimatedMeters: quote.estimatedMeters || '',
    needsCutting: quote.needsCutting || false,
    // Si el presupuesto ya fue cotizado (tiene estimatedMeters), usar el valor guardado
    // Si es nuevo (sin estimatedMeters), marcar needsLayout como true por defecto
    needsLayout: quote.estimatedMeters ? quote.needsLayout : true,
    isPriority: quote.isPriority || false,
    shippingMethodId: '',
    adminNotes: '',
  })

  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null)

  // Cargar métodos de envío
  useEffect(() => {
    fetch('/api/shipping-methods')
      .then(res => res.json())
      .then(data => {
        // La API devuelve directamente un array
        if (Array.isArray(data)) {
          setShippingMethods(data)
          // Seleccionar el primer método por defecto si hay alguno
          if (data.length > 0 && !quoteForm.shippingMethodId) {
            setQuoteForm(prev => ({ ...prev, shippingMethodId: data[0].id }))
          }
        }
      })
      .catch(err => console.error('Error loading shipping methods:', err))
  }, [])

  const handleQuoteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setQuoteForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmitQuote = async () => {
    if (!quoteForm.estimatedMeters || parseFloat(quoteForm.estimatedMeters as string) <= 0) {
      toast.error('Los metros deben ser mayores a 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'quote',
          estimatedMeters: parseFloat(quoteForm.estimatedMeters as string),
          needsCutting: quoteForm.needsCutting,
          needsLayout: quoteForm.needsLayout,
          isPriority: quoteForm.isPriority,
          shippingMethodId: quoteForm.shippingMethodId || null,
          adminNotes: quoteForm.adminNotes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cotizar')
      }

      toast.success('Presupuesto cotizado correctamente')
      setShowQuoteForm(false)
      setCalculatedPrice(data.calculation)
      router.refresh()
    } catch (error) {
      console.error('Error submitting quote:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cotizar')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePaymentLink = async () => {
    if (!confirm('¿Generar enlace de pago de Stripe para este presupuesto?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_payment_link',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar enlace')
      }

      toast.success('Enlace de pago generado correctamente')

      // Copiar al portapapeles
      if (data.paymentUrl) {
        await navigator.clipboard.writeText(data.paymentUrl)
        toast.success('Enlace copiado al portapapeles')
      }

      router.refresh()
    } catch (error) {
      console.error('Error generating payment link:', error)
      toast.error(error instanceof Error ? error.message : 'Error al generar enlace')
    } finally {
      setLoading(false)
    }
  }

  const handleSetBizum = async () => {
    if (!confirm('¿Configurar este presupuesto para pago por Bizum? Se enviará email al cliente con el número.')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'set_bizum',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al configurar Bizum')
      }

      toast.success('Configurado para pago por Bizum')
      router.refresh()
    } catch (error) {
      console.error('Error setting Bizum:', error)
      toast.error(error instanceof Error ? error.message : 'Error al configurar Bizum')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!confirm('¿Marcar este presupuesto como PAGADO? Esta acción indica que el cliente ya realizó el pago.')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_paid',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al marcar como pagado')
      }

      toast.success('Marcado como pagado. Ahora convierte a pedido.')
      router.refresh()
    } catch (error) {
      console.error('Error marking as paid:', error)
      toast.error(error instanceof Error ? error.message : 'Error al marcar como pagado')
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (!confirm('¿Convertir este presupuesto en pedido? Se creará un pedido confirmado automáticamente.')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}/convert-to-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al convertir')
      }

      toast.success(`Pedido ${data.order.orderNumber} creado correctamente`)

      // Redirigir al pedido
      router.push(`/admin/pedidos/${data.order.id}`)
    } catch (error) {
      console.error('Error converting to order:', error)
      toast.error(error instanceof Error ? error.message : 'Error al convertir')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    const reason = prompt('¿Motivo de cancelación? (opcional)')

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          adminNotes: reason || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar')
      }

      toast.success('Presupuesto cancelado')
      router.refresh()
    } catch (error) {
      console.error('Error canceling quote:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cancelar')
    } finally {
      setLoading(false)
    }
  }

  const handleExpire = async () => {
    if (!confirm('¿Marcar este presupuesto como CADUCADO?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'expire',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al caducar')
      }

      toast.success('Presupuesto caducado')
      router.refresh()
    } catch (error) {
      console.error('Error expiring quote:', error)
      toast.error(error instanceof Error ? error.message : 'Error al caducar')
    } finally {
      setLoading(false)
    }
  }

  // Si ya está pagado y convertido
  if (quote.status === 'PAID' && quote.orderId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Presupuesto Completado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-medium text-green-900">Convertido en pedido</p>
            </div>
            <p className="text-sm text-green-700">
              Este presupuesto ya fue pagado y convertido en pedido.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PASO 1: Cotizar (si aún no está cotizado) */}
        {quote.status === 'PENDING_REVIEW' && (
          <div>
            {showQuoteForm ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Paso 1: Cotizar presupuesto
                  </p>
                  <p className="text-xs text-blue-700">
                    Calcula los metros necesarios y establece el precio
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Metros calculados *</label>
                  <Input
                    type="number"
                    name="estimatedMeters"
                    value={quoteForm.estimatedMeters}
                    onChange={handleQuoteInputChange}
                    placeholder="Ej: 5.5"
                    step="0.1"
                    min="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Método de envío</label>
                  <select
                    name="shippingMethodId"
                    value={quoteForm.shippingMethodId}
                    onChange={handleQuoteInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Sin envío</option>
                    {shippingMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name} - {Number(method.price).toFixed(2)}€
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Envío GRATIS en pedidos superiores a 100€ (sin IVA)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Extras</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="needsCutting"
                        checked={quoteForm.needsCutting}
                        onChange={handleQuoteInputChange}
                        className="rounded"
                      />
                      <span className="text-sm">Necesita corte</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="needsLayout"
                        checked={quoteForm.needsLayout}
                        onChange={handleQuoteInputChange}
                        className="rounded"
                      />
                      <span className="text-sm">Necesita maquetación</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isPriority"
                        checked={quoteForm.isPriority}
                        onChange={handleQuoteInputChange}
                        className="rounded"
                      />
                      <span className="text-sm">Priorización</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notas internas (opcional)</label>
                  <textarea
                    name="adminNotes"
                    value={quoteForm.adminNotes}
                    onChange={handleQuoteInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Notas para el equipo..."
                  />
                </div>

                <Button
                  onClick={handleSubmitQuote}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular y Cotizar
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowQuoteForm(true)}
                variant="outline"
                className="w-full"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Editar cotización
              </Button>
            )}
          </div>
        )}

        {/* PASO 2: Generar pago (si ya está cotizado) */}
        {(quote.status === 'QUOTED' || quote.status === 'PAYMENT_SENT') && quote.estimatedTotal && (
          <div className="space-y-3">
            {quote.status === 'QUOTED' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Paso 2: Generar enlace de pago
                </p>
                <p className="text-xs text-purple-700">
                  Crea un Payment Link de Stripe o configura Bizum
                </p>
              </div>
            )}

            {!quote.paymentLinkUrl && quote.status !== 'PAYMENT_SENT' && (
              <>
                <Button
                  onClick={handleGeneratePaymentLink}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Generar Payment Link (Stripe)
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">O</span>
                  </div>
                </div>

                <Button
                  onClick={handleSetBizum}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Configurar Bizum (611066997)
                </Button>
              </>
            )}

            {quote.paymentLinkUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-2">
                  ✅ Enlace de pago generado
                </p>
                <a
                  href={quote.paymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:underline flex items-center gap-1"
                >
                  Ver enlace <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: Marcar como pagado (para Bizum) */}
        {quote.status === 'PAYMENT_SENT' && quote.paymentMethod === 'BIZUM' && (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Esperando pago por Bizum
              </p>
              <p className="text-xs text-yellow-700">
                Cuando el cliente pague, márcalo como pagado aquí
              </p>
              <p className="text-xs text-yellow-700 mt-2 font-medium">
                📱 Bizum: 611066997
              </p>
            </div>

            <Button
              onClick={handleMarkPaid}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Pagado
                </>
              )}
            </Button>
          </div>
        )}

        {/* PASO 4: Convertir a pedido (si está pagado) */}
        {quote.status === 'PAID' && !quote.orderId && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-1">
                ✅ Presupuesto pagado
              </p>
              <p className="text-xs text-green-700">
                Ahora puedes convertirlo en pedido oficial
              </p>
            </div>

            <Button
              onClick={handleConvertToOrder}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Convertir a Pedido
                </>
              )}
            </Button>
          </div>
        )}

        {/* Acciones adicionales */}
        {quote.status !== 'PAID' && quote.status !== 'CANCELLED' && quote.status !== 'EXPIRED' && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium text-gray-600 mb-2">Otras acciones</p>

            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              className="w-full text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar presupuesto
            </Button>

            <Button
              onClick={handleExpire}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Marcar como caducado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
