"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Ticket } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"
import { LoyaltyPointsSlider } from "@/components/LoyaltyPointsSlider"

interface CartItem {
  id: string
  quantity: number
  product: any
  fileName?: string
  fileUrl?: string
  calculatedPrice?: any
  customizations?: any
}

export default function CarritoPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [pointsDiscount, setPointsDiscount] = useState(0)
  const [availablePoints, setAvailablePoints] = useState(0)
  const [useMeterVouchers, setUseMeterVouchers] = useState(true)

  useEffect(() => {
    loadCart()
    if (session?.user) {
      loadUserPoints()
    }
  }, [session])

  const loadCart = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      setCart(data)
    } catch (error) {
      console.error('Error loading cart:', error)
      toast.error('Error al cargar el carrito')
    } finally {
      setLoading(false)
    }
  }

  const loadUserPoints = async () => {
    try {
      const res = await fetch('/api/user/me')
      if (res.ok) {
        const data = await res.json()
        setAvailablePoints(data.loyaltyPoints || 0)
      }
    } catch (error) {
      console.error('Error loading user points:', error)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (res.ok) {
        await loadCart()
        // Disparar evento para actualizar el botón del carrito
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        toast.error('Error al actualizar cantidad')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Error al actualizar cantidad')
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadCart()
        // Disparar evento para actualizar el botón del carrito
        window.dispatchEvent(new Event('cartUpdated'))
        toast.success('Producto eliminado del carrito')
      } else {
        toast.error('Error al eliminar producto')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Error al eliminar producto')
    }
  }

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Por favor ingresa un código de bono')
      return
    }

    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          orderTotal: cart.subtotal,
        }),
      })

      const data = await res.json()

      if (data.isValid) {
        setAppliedVoucher(data)
        toast.success('Bono aplicado correctamente')
      } else {
        toast.error(data.error || 'Bono no válido')
      }
    } catch (error) {
      console.error('Error applying voucher:', error)
      toast.error('Error al aplicar bono')
    }
  }

  const handlePointsChange = (points: number, discount: number) => {
    setPointsToUse(points)
    setPointsDiscount(discount)
  }

  const proceedToCheckout = async () => {
    setProcessingCheckout(true)

    try {
      // Verificar si se usarán bonos de metros
      const useMeterVouchers = cart.meterVouchers?.canUseVoucherMeters || false

      // Crear el pedido
      const orderPayload = {
        customerName: session?.user?.name || '',
        customerEmail: session?.user?.email || '',
        customerPhone: session?.user?.phone || '',
        items: cart.items.map((item: CartItem) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.calculatedPrice?.unitPrice || 0,
          subtotal: item.calculatedPrice?.subtotal || 0,
          fileUrl: item.fileUrl || undefined,
          fileName: item.fileName || undefined,
          customizations: item.customizations || undefined,
        })),
        subtotal: subtotal,
        discountAmount: voucherDiscount,
        taxAmount: tax,
        shippingCost: shipping,
        totalPrice: total,
        pointsUsed: pointsToUse,
        pointsDiscount: pointsDiscount,
        voucherId: appliedVoucher?.voucher?.code,
        useMeterVouchers, // Indicar si se usan bonos de metros
        meterVouchersInfo: useMeterVouchers ? {
          metersNeeded: cart.meterVouchers.totalMetersNeeded,
          voucherIds: cart.meterVouchers.vouchers.map((v: any) => v.id),
        } : null,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear el pedido')
      }

      const order = await res.json()

      // Limpiar carrito
      await fetch('/api/cart', { method: 'DELETE' })

      // Disparar evento para actualizar el botón del carrito
      window.dispatchEvent(new Event('cartUpdated'))

      if (useMeterVouchers) {
        toast.success('¡Pedido pagado con tus bonos de metros! ✨')
        router.push(`/pedidos/${order.orderNumber}`)
      } else {
        toast.success('¡Pedido creado con éxito!')
        router.push(`/pedidos/${order.orderNumber}`)
      }
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.message || 'Error al procesar el pedido')
      setProcessingCheckout(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">
            Agrega productos para comenzar tu pedido
          </p>
          <Button onClick={() => router.push('/')}>
            Ir al Inicio
          </Button>
        </div>
      </div>
    )
  }

  const TAX_RATE = 0.21
  const SHIPPING_COST = 5.00
  const FREE_SHIPPING_THRESHOLD = 100

  const subtotal = cart.subtotal || 0
  const voucherDiscount = appliedVoucher?.discountAmount || 0

  // Si usa bonos de metros y tiene envíos disponibles, envío gratis
  const hasVoucherShipment = cart.meterVouchers?.canUseVoucherShipment || false
  const shipping = hasVoucherShipment || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST

  const taxableAmount = subtotal - voucherDiscount - pointsDiscount
  const tax = taxableAmount * TAX_RATE
  const total = taxableAmount + tax + shipping

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Carrito de Compra</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: CartItem) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary-400">
                          {item.product.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <Badge variant="info" className="mt-1">
                            {item.product.category?.name}
                          </Badge>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {item.fileName && (
                        <p className="text-sm text-gray-600 mb-3">
                          Archivo: {item.fileName}
                        </p>
                      )}

                      {/* Mostrar extras si los hay */}
                      {item.customizations?.extras && (
                        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs font-medium text-gray-700 mb-1">Extras seleccionados:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.customizations.extras.prioritize && (
                              <Badge variant="warning" className="text-xs">
                                ⚡ Priorizar Pedido (+{formatCurrency(item.customizations.extras.prioritize.price)})
                              </Badge>
                            )}
                            {item.customizations.extras.layout && (
                              <Badge variant="warning" className="text-xs">
                                📐 Maquetación (+{formatCurrency(item.customizations.extras.layout.price)})
                              </Badge>
                            )}
                            {item.customizations.extras.cutting && (
                              <Badge variant="warning" className="text-xs">
                                ✂️ Servicio Corte (+{formatCurrency(item.customizations.extras.cutting.price)})
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Todos los productos usan incrementos de 1 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, Number(item.quantity) - 1))}
                            className="w-8 h-8 p-0"
                            disabled={Number(item.quantity) <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="font-semibold min-w-[60px] text-center">
                            {Number(item.quantity)} {item.product.unit}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.calculatedPrice?.unitPrice || 0)}/{item.product.unit}
                          </p>
                          <p className="text-xl font-bold text-primary-600">
                            {formatCurrency(item.calculatedPrice?.subtotal || 0)}
                          </p>
                          {item.calculatedPrice?.discountPct > 0 && (
                            <Badge variant="success" className="mt-1">
                              -{item.calculatedPrice.discountPct.toFixed(0)}% descuento
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>

                {/* Bonos de Metros Disponibles */}
                {cart.meterVouchers?.available && cart.meterVouchers.totalMetersNeeded > 0 && (
                  <div className="mb-6 p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Ticket className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-green-900 mb-1">
                          🎉 ¡Puedes usar tus Bonos de Metros!
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          Tienes <strong>{cart.meterVouchers.totalMetersAvailable.toFixed(1)} metros</strong> disponibles en tus bonos.
                          <br />
                          Este pedido necesita <strong>{cart.meterVouchers.totalMetersNeeded.toFixed(1)} metros</strong>.
                          {cart.meterVouchers.totalShipmentsAvailable > 0 && (
                            <>
                              <br />
                              También tienes <strong>{cart.meterVouchers.totalShipmentsAvailable} {cart.meterVouchers.totalShipmentsAvailable === 1 ? 'envío gratis' : 'envíos gratis'}</strong> disponibles.
                            </>
                          )}
                        </p>
                        {cart.meterVouchers.canUseVoucherMeters ? (
                          <div className="bg-white rounded p-2 mt-2">
                            <p className="text-sm font-bold text-green-700">
                              ✓ Este pedido se pagará COMPLETAMENTE con tus bonos (0€)
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Se descontarán {cart.meterVouchers.metersFromVoucher.toFixed(1)} metros de tus bonos
                              {cart.meterVouchers.canUseVoucherShipment && (
                                <> y 1 envío gratis</>
                              )}
                            </p>
                          </div>
                        ) : cart.meterVouchers.canUseVoucherMetersPartially ? (
                          <div className="bg-white rounded p-2 mt-2">
                            <p className="text-sm font-bold text-blue-700">
                              ✓ Usaremos tus bonos + pago adicional
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              • {cart.meterVouchers.metersFromVoucher.toFixed(1)} metros de tus bonos (GRATIS)
                              <br />
                              • {cart.meterVouchers.metersToPay.toFixed(1)} metros adicionales a pagar
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-orange-600">
                            ⚠ No tienes metros suficientes. Necesitas {(cart.meterVouchers.totalMetersNeeded - cart.meterVouchers.totalMetersAvailable).toFixed(1)} metros más.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aplicar bono de descuento (solo si no hay bonos de metros aplicables) */}
                {!cart.meterVouchers?.canUseVoucherMeters && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Bono de Descuento
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="CODIGO"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        disabled={!!appliedVoucher}
                      />
                      {!appliedVoucher ? (
                        <Button variant="outline" onClick={applyVoucher}>
                          <Tag className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAppliedVoucher(null)
                            setVoucherCode('')
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {appliedVoucher && (
                      <p className="text-sm text-green-600 mt-2">
                        Bono aplicado: {appliedVoucher.voucher.code}
                      </p>
                    )}
                  </div>
                )}

                {/* Puntos de fidelidad */}
                {session?.user && availablePoints > 0 && (
                  <div className="mb-6">
                    <LoyaltyPointsSlider
                      availablePoints={availablePoints}
                      orderTotal={subtotal - voucherDiscount}
                      onPointsChange={handlePointsChange}
                    />
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento (Bono):</span>
                      <span className="font-semibold">-{formatCurrency(voucherDiscount)}</span>
                    </div>
                  )}

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento (Puntos):</span>
                      <span className="font-semibold">-{formatCurrency(pointsDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (21%):</span>
                    <span className="font-semibold">{formatCurrency(tax)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío:</span>
                    {shipping === 0 ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success">GRATIS</Badge>
                        {hasVoucherShipment && (
                          <span className="text-xs text-green-600">(Bono)</span>
                        )}
                      </div>
                    ) : (
                      <span className="font-semibold">{formatCurrency(shipping)}</span>
                    )}
                  </div>

                  {!hasVoucherShipment && subtotal < FREE_SHIPPING_THRESHOLD && (
                    <p className="text-xs text-gray-500">
                      Añade {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} más para envío gratis
                    </p>
                  )}

                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={proceedToCheckout}
                  disabled={processingCheckout}
                  size="lg"
                  className="w-full"
                >
                  Proceder al Pago
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="w-full mt-3"
                >
                  Continuar Comprando
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
