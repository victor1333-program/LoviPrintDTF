"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { FileUpload } from "@/components/FileUpload"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, CreditCard, Tag, Ticket, AlertCircle } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [orderData, setOrderData] = useState<any>(null)
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const [userVouchers, setUserVouchers] = useState<any[]>([])
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [showVoucherPrompt, setShowVoucherPrompt] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  })

  useEffect(() => {
    const stored = localStorage.getItem('dtf_order')
    if (stored) {
      setOrderData(JSON.parse(stored))
    } else {
      router.push('/')
    }
  }, [router])

  // Cargar bonos del usuario si está autenticado
  useEffect(() => {
    if (session?.user && orderData) {
      loadUserVouchers()
    }
  }, [session, orderData])

  const loadUserVouchers = async () => {
    try {
      const res = await fetch('/api/vouchers/user')
      if (res.ok) {
        const vouchers = await res.json()
        const activeVouchers = vouchers.filter((v: any) =>
          v.isActive && v.type === 'METERS' && Number(v.remainingMeters) >= orderData.meters
        )
        setUserVouchers(activeVouchers)

        // Mostrar prompt si tiene bonos disponibles
        if (activeVouchers.length > 0) {
          setShowVoucherPrompt(true)
        }
      }
    } catch (error) {
      console.error('Error loading vouchers:', error)
    }
  }

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("Introduce un código de descuento")
      return
    }

    setCheckingCode(true)
    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode,
          subtotal: orderData.subtotal
        })
      })

      if (res.ok) {
        const discount = await res.json()
        setAppliedDiscount(discount)
        recalculateOrder(discount, selectedVoucher)
        toast.success(`¡Código aplicado! ${discount.discountPct}% de descuento`)
      } else {
        const error = await res.json()
        toast.error(error.message || "Código inválido")
      }
    } catch (error) {
      toast.error("Error al validar el código")
    } finally {
      setCheckingCode(false)
    }
  }

  const selectVoucher = (voucherId: string | null) => {
    setSelectedVoucher(voucherId)
    setShowVoucherPrompt(false)
    recalculateOrder(appliedDiscount, voucherId)
    if (voucherId) {
      toast.success("Bono seleccionado para este pedido")
    }
  }

  const recalculateOrder = (discount: any, voucherId: string | null) => {
    let subtotal = orderData.meters * orderData.pricePerMeter
    let discountAmount = 0

    // Aplicar código de descuento
    if (discount) {
      if (discount.type === 'PERCENT') {
        discountAmount = subtotal * (Number(discount.discountPct) / 100)
      } else if (discount.type === 'AMOUNT') {
        discountAmount = Number(discount.discountAmount)
      }
    }

    // Si usa bono de metros, el precio base es 0
    if (voucherId) {
      subtotal = 0
      discountAmount = 0
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const tax = afterDiscount * 0.21
    const shipping = afterDiscount >= 100 ? 0 : 5.95
    const total = afterDiscount + tax + shipping

    setOrderData({
      ...orderData,
      subtotal: subtotal,
      discount: discountAmount,
      tax: tax,
      shipping: shipping,
      total: total,
      usingVoucher: !!voucherId,
      voucherId: voucherId,
      discountCodeId: discount?.id
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!designFile) {
      toast.error("Por favor, sube tu archivo de diseño")
      return
    }

    setLoading(true)

    try {
      // 1. Subir el archivo
      const fileFormData = new FormData()
      fileFormData.append('file', designFile)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: fileFormData,
      })

      if (!uploadRes.ok) {
        throw new Error('Error al subir el archivo')
      }

      const { fileUrl, fileName } = await uploadRes.json()

      // 2. Crear el pedido
      const orderPayload = {
        ...formData,
        metersOrdered: orderData.meters,
        pricePerMeter: orderData.pricePerMeter,
        subtotal: orderData.subtotal,
        discountAmount: orderData.discount || 0,
        taxAmount: orderData.tax,
        shippingCost: orderData.shipping,
        totalPrice: orderData.total,
        designFileUrl: fileUrl,
        designFileName: fileName,
        voucherCode: selectedVoucher,
        discountCodeId: orderData.discountCodeId,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        }
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!orderRes.ok) {
        throw new Error('Error al crear el pedido')
      }

      const order = await orderRes.json()

      // Limpiar localStorage
      localStorage.removeItem('dtf_order')

      // Mostrar éxito y redirigir
      toast.success('¡Pedido creado con éxito!')
      router.push(`/pedido/${order.orderNumber}`)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar el pedido. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!orderData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              Finalizar Pedido
            </h1>
            <p className="text-gray-600 mt-2">
              Completa tus datos y sube tu diseño
            </p>
          </div>

          {/* Prompt de Bonos */}
          {showVoucherPrompt && userVouchers.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-2">
                    ¡Tienes bonos disponibles!
                  </h3>
                  <p className="text-green-800 mb-4">
                    Tienes {userVouchers.length} bono(s) con metros suficientes para este pedido.
                    ¿Quieres usar uno de tus bonos?
                  </p>
                  <div className="space-y-3">
                    {userVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{voucher.code}</p>
                          <p className="text-sm text-gray-600">
                            {Number(voucher.remainingMeters).toFixed(1)} metros disponibles
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => selectVoucher(voucher.code)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Usar Este Bono
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => selectVoucher(null)}
                      className="w-full"
                    >
                      No, prefiero pagar este pedido
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aviso si está usando bono */}
          {selectedVoucher && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    Usando bono: {selectedVoucher}
                  </p>
                  <p className="text-sm text-green-700">
                    Se descontarán {orderData.meters} metros de tu bono
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => selectVoucher(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Formulario */}
              <div className="lg:col-span-2 space-y-6">
                {/* Datos de Contacto */}
                <Card>
                  <CardHeader>
                    <CardTitle>Datos de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Nombre Completo"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Juan Pérez"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="juan@ejemplo.com"
                      />
                      <Input
                        label="Teléfono"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dirección de Envío */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dirección de Envío</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Dirección"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Calle Principal 123"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Ciudad"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Madrid"
                      />
                      <Input
                        label="Código Postal"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        placeholder="28001"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Subir Diseño */}
                <Card>
                  <CardHeader>
                    <CardTitle>Archivo de Diseño</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      onFileUpload={setDesignFile}
                      currentFile={designFile}
                      onRemove={() => setDesignFile(null)}
                    />
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium mb-2">
                        📋 Recomendaciones para tu diseño:
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Resolución mínima: 300 DPI</li>
                        <li>• Formato vectorial (AI, PDF) preferible</li>
                        <li>• Fondo transparente para mejores resultados</li>
                        <li>• Colores en modo CMYK</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Notas Adicionales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notas Adicionales (Opcional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Instrucciones especiales para tu pedido..."
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Resumen del Pedido */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  <Card>
                    <CardHeader className="bg-gray-50">
                      <CardTitle>Resumen del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Metros:</span>
                          <span className="font-semibold">{orderData.meters}m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Precio/metro:</span>
                          <span className="font-semibold">
                            {formatCurrency(orderData.pricePerMeter)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">
                            {formatCurrency(orderData.subtotal)}
                          </span>
                        </div>

                        {orderData.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Descuento:</span>
                            <span className="font-semibold">
                              -{formatCurrency(orderData.discount)}
                            </span>
                          </div>
                        )}

                        {selectedVoucher && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Bono aplicado:</span>
                            <span className="font-semibold">
                              -{formatCurrency(orderData.meters * orderData.pricePerMeter)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">IVA (21%):</span>
                          <span className="font-semibold">
                            {formatCurrency(orderData.tax)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Envío:</span>
                          <span className="font-semibold">
                            {orderData.shipping === 0 ? 'GRATIS' : formatCurrency(orderData.shipping)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Total:</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(orderData.total)}
                          </span>
                        </div>
                      </div>

                      {/* Código de Descuento */}
                      {!selectedVoucher && (
                        <div className="border-t pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Tag className="inline h-4 w-4 mr-1" />
                            ¿Tienes un código de descuento?
                          </label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="CODIGO10"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                              disabled={!!appliedDiscount}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={applyDiscountCode}
                              disabled={checkingCode || !!appliedDiscount}
                            >
                              {checkingCode ? '...' : appliedDiscount ? '✓' : 'Aplicar'}
                            </Button>
                          </div>
                          {appliedDiscount && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                              <Badge variant="success">Código aplicado</Badge>
                              <button
                                type="button"
                                onClick={() => {
                                  setAppliedDiscount(null)
                                  setDiscountCode("")
                                  recalculateOrder(null, selectedVoucher)
                                }}
                                className="text-xs underline"
                              >
                                Quitar
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={loading || !designFile}
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {loading ? 'Procesando...' : 'Realizar Pedido'}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Al hacer clic en "Realizar Pedido", aceptas nuestros términos y condiciones
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
