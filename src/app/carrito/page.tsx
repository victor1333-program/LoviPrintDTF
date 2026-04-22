"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Ticket, FileText, Gift, Sparkles, Truck } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { estimateDeliveryDate, formatDeliveryDate, minutesUntilCutoff } from "@/lib/delivery"

function isImageFileName(fileName?: string): boolean {
  if (!fileName) return false
  const ext = fileName.toLowerCase().split('.').pop()
  return ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp'
}

function getCloudinaryThumb(url: string): string {
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/image/upload/w_128,h_128,c_fill,q_auto,f_auto/')
  }
  return url
}
import toast from "react-hot-toast"
import { LoyaltyPointsSlider } from "@/components/LoyaltyPointsSlider"
import { CheckoutModal, CheckoutData } from "@/components/CheckoutModal"
import { AuthModal } from "@/components/AuthModal"
import { trackBeginCheckout } from "@/lib/analytics"

interface CartItem {
  id: string
  quantity: number
  product: any
  fileName?: string
  fileUrl?: string
  calculatedPrice?: any
  customizations?: any
}

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  price: number
  estimatedDays: string | null
  isActive: boolean
  order: number
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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('')

  useEffect(() => {
    loadCart()
    loadShippingMethods()
    if (session?.user) {
      loadUserPoints()
    }
  }, [session])

  // Reabre el checkout automáticamente si el usuario se acaba de autenticar
  // después de haber sido interceptado por el gate (flag en sessionStorage).
  useEffect(() => {
    if (loading) return
    if (!session?.user) return
    if (!cart?.items?.length) return

    let shouldResume = false
    try {
      if (window.sessionStorage.getItem('lovi_resume_checkout') === '1') {
        window.sessionStorage.removeItem('lovi_resume_checkout')
        shouldResume = true
      }
    } catch {}

    if (shouldResume) {
      setShowCheckoutModal(true)
    }
  }, [loading, session, cart])

  const loadShippingMethods = async () => {
    try {
      console.log('🚚 Loading shipping methods...')
      const res = await fetch('/api/shipping-methods')
      if (res.ok) {
        const data = await res.json()
        console.log('🚚 Shipping methods loaded:', data)
        setShippingMethods(data)
        // Seleccionar el primer método por defecto si no hay uno ya seleccionado
        if (data.length > 0 && !selectedShippingMethodId) {
          console.log('🚚 Auto-selecting first method:', data[0].id)
          setSelectedShippingMethodId(data[0].id)
        }
      } else {
        console.error('❌ Failed to load shipping methods:', res.status)
      }
    } catch (error) {
      console.error('❌ Error loading shipping methods:', error)
    }
  }

  const loadCart = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      setCart(data)
      // Disparar evento para actualizar el botón del carrito
      window.dispatchEvent(new Event('cartUpdated'))
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
      toast.error('Por favor ingresa un código de descuento')
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
        toast.success('Código de descuento aplicado correctamente')
      } else {
        toast.error(data.error || 'Código de descuento no válido')
      }
    } catch (error) {
      console.error('Error applying voucher:', error)
      toast.error('Error al aplicar código de descuento')
    }
  }

  const handlePointsChange = (points: number, discount: number) => {
    setPointsToUse(points)
    setPointsDiscount(discount)
  }

  const handleChangeShippingMethod = (newMethodId: string) => {
    if (newMethodId === selectedShippingMethodId) return
    const prev = shippingMethods.find(m => m.id === selectedShippingMethodId)
    const next = shippingMethods.find(m => m.id === newMethodId)
    setSelectedShippingMethodId(newMethodId)

    if (!next) return
    const prevPrice = prev?.price ?? 0
    const diff = next.price - prevPrice
    if (diff === 0) {
      toast.success(`Envío actualizado: ${next.name}`)
    } else if (diff > 0) {
      toast(`Envío ${next.name} · +${formatCurrency(diff)}`, { icon: '🚚' })
    } else {
      toast(`Envío ${next.name} · ${formatCurrency(diff)}`, { icon: '✅' })
    }
  }

  const openCheckoutModal = () => {
    // Detectar si el carrito incluye compra de bonos (requiere cuenta real)
    const hasVoucherPurchase = cart?.items?.some(
      (item: CartItem) => !!item.customizations?.voucherTemplateId
    )
    const usingMeterVouchers = cart?.meterVouchers?.canUseVoucherMeters || cart?.meterVouchers?.canUseVoucherMetersPartially

    if (!session?.user && (hasVoucherPurchase || usingMeterVouchers)) {
      toast.error(
        hasVoucherPurchase
          ? 'Para comprar un bono debes tener una cuenta. Inicia sesión o regístrate.'
          : 'Debes iniciar sesión para usar tus bonos de metros.'
      )
      try {
        window.sessionStorage.setItem('lovi_resume_checkout', '1')
      } catch {}
      setShowAuthModal(true)
      return
    }

    const items = (cart?.items || []).map((item: CartItem) => ({
      item_id: item.product.slug || item.product.id,
      item_name: item.product.name,
      item_category: item.product.category?.name,
      price: Number(item.calculatedPrice?.unitPrice || item.product.basePrice || 0),
      quantity: Number(item.quantity),
    }))
    trackBeginCheckout(items, Number(cart?.subtotal || 0))

    setShowCheckoutModal(true)
  }

  const handleCheckoutSuccess = async (checkoutData: CheckoutData) => {
    setProcessingCheckout(true)

    try {
      // Verificar si se usarán bonos de metros
      const useMeterVouchers = cart.meterVouchers?.canUseVoucherMeters || false

      // Determinar shippingMethodId válido
      let validShippingMethodId = checkoutData.shippingMethodId || selectedShippingMethodId

      // Si aún no hay un método seleccionado, usar el primero disponible
      if (!validShippingMethodId && shippingMethods.length > 0) {
        validShippingMethodId = shippingMethods[0].id
        console.log('⚠️ No había método seleccionado, usando el primero:', shippingMethods[0].name)
      }

      // RECALCULAR el costo de envío basándose en el método seleccionado
      const finalSelectedMethod = shippingMethods.find(m => m.id === validShippingMethodId)
      const finalBaseShippingCost = finalSelectedMethod?.price || 0

      // Verificar condiciones de envío gratis
      const hasVoucherShipment = cart.meterVouchers?.canUseVoucherShipment || false
      const hasFreeShippingCode = appliedVoucher?.discountType === 'FREE_SHIPPING'
      const hasFreeShippingByThreshold = subtotal >= FREE_SHIPPING_THRESHOLD

      // Calcular costo final de envío
      const finalShippingCost = hasVoucherShipment || hasFreeShippingCode || hasFreeShippingByThreshold ? 0 : finalBaseShippingCost

      // Recalcular totales con el costo de envío correcto
      const finalTaxableAmount = subtotal - voucherDiscount - pointsDiscount
      const finalTax = finalTaxableAmount * TAX_RATE
      const finalTotal = finalTaxableAmount + finalTax + finalShippingCost

      console.log('📦 Recalculando costos de envío:', {
        validShippingMethodId,
        finalSelectedMethod: finalSelectedMethod?.name,
        finalBaseShippingCost,
        hasVoucherShipment,
        hasFreeShippingCode,
        hasFreeShippingByThreshold,
        finalShippingCost,
        finalTotal
      })

      // Preparar datos completos del pedido para la página de confirmación
      const orderConfirmData = {
        // Datos del cliente
        customerName: checkoutData.customerName,
        customerEmail: checkoutData.customerEmail,
        customerPhone: checkoutData.customerPhone,

        // Dirección de envío
        shippingAddress: checkoutData.shippingAddress,

        // Items del carrito
        items: cart.items.map((item: CartItem) => ({
          productId: item.product.id,
          productName: item.product.name,
          productImageUrl: item.product.imageUrl,
          productUnit: item.product.unit,
          quantity: Number(item.quantity),
          unitPrice: item.calculatedPrice?.unitPrice || 0,
          subtotal: item.calculatedPrice?.subtotal || 0,
          fileUrl: item.fileUrl || undefined,
          fileName: item.fileName || undefined,
          customizations: item.customizations || undefined,
        })),

        // Totales (usar valores recalculados)
        subtotal: subtotal,
        discountAmount: voucherDiscount,
        taxAmount: finalTax,
        shippingCost: finalShippingCost,
        totalPrice: finalTotal,
        pointsUsed: pointsToUse,
        pointsDiscount: pointsDiscount,

        // Códigos y bonos
        voucherId: appliedVoucher?.voucher?.code,
        discountCodeId: appliedVoucher?.discountCode?.code,
        useMeterVouchers,
        meterVouchersInfo: useMeterVouchers ? {
          metersNeeded: cart.meterVouchers.totalMetersNeeded,
          voucherIds: cart.meterVouchers.vouchers.map((v: any) => v.id),
        } : null,

        // Método de envío
        shippingMethodId: validShippingMethodId || null,

        // Notas adicionales del cliente
        notes: checkoutData.notes || null,
      }

      // Guardar en sessionStorage para la página de confirmación
      sessionStorage.setItem('cart_order_confirm', JSON.stringify(orderConfirmData))

      // Cerrar modal
      setShowCheckoutModal(false)

      // Redirigir a página de confirmación
      toast.success('Datos guardados. Revisa tu pedido.')
      router.push('/carrito/confirmar')

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al procesar los datos')
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
  const FREE_SHIPPING_THRESHOLD = 100

  const subtotal = cart.subtotal || 0
  const voucherDiscount = appliedVoucher?.discountAmount || 0

  // Verificar si hay envío gratuito por código de descuento
  const hasFreeShippingCode = appliedVoucher?.discountType === 'FREE_SHIPPING'

  // Si usa bonos de metros y tiene envíos disponibles, o tiene código de envío gratis, envío gratis
  const hasVoucherShipment = cart.meterVouchers?.canUseVoucherShipment || false

  // Solo ocultar selección de envío si hay envío gratis por bono o código
  // Si el envío es gratis por umbral, mostrar opciones para que puedan elegir envío urgente
  const shouldHideShippingSelection = hasVoucherShipment || hasFreeShippingCode

  // Calcular costo de envío
  const selectedMethod = shippingMethods.find(m => m.id === selectedShippingMethodId)
  const baseShippingCost = selectedMethod?.price || 0
  const hasFreeShippingByThreshold = subtotal >= FREE_SHIPPING_THRESHOLD
  const shipping = hasVoucherShipment || hasFreeShippingCode || hasFreeShippingByThreshold ? 0 : baseShippingCost

  const taxableAmount = subtotal - voucherDiscount - pointsDiscount
  const tax = taxableAmount * TAX_RATE
  const total = taxableAmount + tax + shipping

  // Debug shipping en consola
  if (typeof window !== 'undefined') {
    console.log('💰 Shipping Debug:', {
      shippingMethodsCount: shippingMethods.length,
      selectedMethodId: selectedShippingMethodId,
      selectedMethod,
      baseShippingCost,
      shouldHideShippingSelection,
      hasVoucherShipment,
      hasFreeShippingCode,
      hasFreeShippingByThreshold,
      finalShipping: shipping
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Carrito de Compra</h1>

        {/* Banner puntos de fidelidad */}
        {session?.user && availablePoints >= 100 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-lg p-3 sm:p-4 flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm sm:text-base">
                Tienes {availablePoints} puntos ={' '}
                <span className="text-amber-700">
                  {formatCurrency(Math.floor(availablePoints / 100) * 5)} de descuento
                </span>
              </p>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Canjéalos al final del carrito antes de pagar.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: CartItem) => {
              // Detectar si es un bono
              const isVoucher = item.customizations?.voucherTemplateId
              const voucherName = item.customizations?.voucherName
              const voucherMeters = item.customizations?.voucherMeters
              const displayName = isVoucher ? voucherName : item.product.name
              const displayUnit = isVoucher ? 'bono' : item.product.unit

              return (
              <Card key={item.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-3 sm:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {isVoucher ? (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                          <Ticket className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                        </div>
                      ) : item.product.imageUrl ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="(max-width: 640px) 80px, 96px"
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-bold text-primary-400">
                          {item.product.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{displayName}</h3>
                          {isVoucher ? (
                            <Badge variant="success" className="mt-1">
                              <Gift className="h-3 w-3 mr-1" />
                              Bono Prepagado - {voucherMeters} metros
                            </Badge>
                          ) : (
                            <Badge variant="info" className="mt-1">
                              {item.product.category?.name}
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0 p-1 -mr-1"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {item.fileName && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-3">
                          {item.fileUrl && isImageFileName(item.fileName) ? (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                              aria-label="Ver diseño en tamaño completo"
                            >
                              <img
                                src={getCloudinaryThumb(item.fileUrl)}
                                alt={item.fileName}
                                className="w-14 h-14 rounded border border-blue-300 object-cover bg-white"
                                loading="lazy"
                              />
                            </a>
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-900">Diseño adjuntado:</p>
                            <p className="text-xs text-blue-700 truncate">{item.fileName}</p>
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Ver archivo
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mostrar extras si los hay */}
                      {item.customizations?.extras && (
                        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs font-medium text-gray-700 mb-1">Extras seleccionados:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.customizations.extras.prioritize && (
                              <Badge variant="warning" className="text-xs">
                                ⚡ Priorizar Pedido (Calculado sobre total de metros)
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

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {isVoucher ? (
                          // Los bonos no permiten cambiar cantidad
                          <div className="flex items-center gap-3">
                            <Badge variant="default" className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
                              1 {displayUnit}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 sm:gap-3">
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

                            <span className="font-semibold min-w-[60px] text-center text-sm sm:text-base">
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
                        )}

                        <div className="text-right">
                          {!isVoucher && (
                            <p className="text-xs sm:text-sm text-gray-600">
                              {formatCurrency(item.calculatedPrice?.unitPrice || 0)}/{item.product.unit}
                            </p>
                          )}
                          <p className="text-lg sm:text-xl font-bold text-primary-600">
                            {formatCurrency(item.calculatedPrice?.subtotal || 0)}
                          </p>
                          {isVoucher ? (
                            <Badge variant="success" className="mt-1">
                              ¡Ahorra 33% comprando este bono!
                            </Badge>
                          ) : item.calculatedPrice?.discountPct > 0 && (
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
              )
            })}
          </div>

          {/* Resumen del pedido */}
          <div>
            <Card className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Resumen del Pedido</h2>

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

                {/* Aplicar código de descuento (solo si no hay bonos de metros aplicables) */}
                {!cart.meterVouchers?.canUseVoucherMeters && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Descuento
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
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-green-600">
                          Código aplicado: {appliedVoucher.voucher?.code || appliedVoucher.discountCode?.code}
                        </p>
                        {appliedVoucher.discountType === 'FREE_SHIPPING' && (
                          <p className="text-sm text-green-600 font-semibold">
                            ✓ Envío gratuito aplicado
                          </p>
                        )}
                        {appliedVoucher.discountType === 'FREE_PRODUCT' && (
                          <p className="text-sm text-green-600 font-semibold">
                            ✓ Producto gratuito aplicado
                          </p>
                        )}
                      </div>
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

                {/* Fecha estimada de entrega */}
                {(() => {
                  const eta = estimateDeliveryDate()
                  const mins = minutesUntilCutoff()
                  const urgent = mins > 0 && mins <= 120
                  return (
                    <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Truck className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary-900">
                            Entrega estimada: {formatDeliveryDate(eta)}
                          </p>
                          {urgent && (
                            <p className="text-xs text-orange-700 mt-0.5 font-medium">
                              ⏰ Pide en los próximos {mins} min para que entre en la producción de hoy
                            </p>
                          )}
                          {!urgent && mins > 0 && (
                            <p className="text-xs text-primary-700 mt-0.5">
                              Realizando el pedido hoy antes de las 13:00
                            </p>
                          )}
                          {mins <= 0 && (
                            <p className="text-xs text-primary-700 mt-0.5">
                              Entra en producción del próximo día laborable
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Selección de método de envío - SIEMPRE MOSTRAR */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Envío
                  </label>

                  {/* Si hay envío gratis por bono o código, mostrar mensaje */}
                  {shouldHideShippingSelection ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Tu pedido tiene envío gratis
                      </p>
                    </div>
                  ) : shippingMethods.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Cargando métodos de envío...
                      </p>
                    </div>
                  ) : (
                    <>
                      {hasFreeShippingByThreshold && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            ✓ Tu pedido tiene envío estándar gratis
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Puedes elegir envío urgente con coste adicional
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {shippingMethods.map((method) => {
                          // El envío gratis solo aplica a métodos estándar (precio <= 6€)
                          const isStandardShipping = method.price <= 6
                          const hasFreeShipping = hasVoucherShipment || hasFreeShippingCode || hasFreeShippingByThreshold
                          const isFreeForThisMethod = hasFreeShipping && isStandardShipping
                          const methodPrice = isFreeForThisMethod ? 0 : method.price

                          return (
                            <div
                              key={method.id}
                              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedShippingMethodId === method.id
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              onClick={() => handleChangeShippingMethod(method.id)}
                            >
                              <input
                                type="radio"
                                name="shipping-method"
                                value={method.id}
                                checked={selectedShippingMethodId === method.id}
                                onChange={() => handleChangeShippingMethod(method.id)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-medium text-gray-900">{method.name}</div>
                                  <div className={`font-semibold whitespace-nowrap ${isFreeForThisMethod ? 'text-green-600' : 'text-primary-600'}`}>
                                    {methodPrice === 0 ? 'GRATIS' : formatCurrency(methodPrice)}
                                  </div>
                                </div>
                                {method.description && (
                                  <div className="text-sm text-gray-600 mt-0.5">
                                    {method.description}
                                  </div>
                                )}
                                {method.estimatedDays && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Tiempo estimado: {method.estimatedDays}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>


                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>

                  {/* Mostrar priorización global si está habilitada */}
                  {cart.prioritization?.enabled && (
                    <div className="flex justify-between text-sm border-l-4 border-orange-500 pl-2 bg-orange-50 py-2 -mx-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-900 font-semibold">⚡ Priorizar Pedido</span>
                        <span className="text-xs text-orange-700">
                          ({cart.prioritization.totalMeters} metros totales)
                        </span>
                      </div>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(cart.prioritization.price)}
                      </span>
                    </div>
                  )}

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

                  {!hasVoucherShipment && !hasFreeShippingCode && !hasFreeShippingByThreshold && baseShippingCost > 0 && (
                    <p className="text-xs text-gray-500">
                      Añade {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} más para envío gratis estándar
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
                  onClick={openCheckoutModal}
                  disabled={processingCheckout}
                  size="lg"
                  className="w-full"
                >
                  {processingCheckout
                    ? 'Procesando...'
                    : total === 0
                      ? 'Confirmar Pedido'
                      : 'Proceder al Pago'
                  }
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                {!session?.user && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-primary-600 hover:text-primary-700 font-medium underline"
                    >
                      Inicia sesión
                    </button>
                  </p>
                )}

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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={handleCheckoutSuccess}
        orderSummary={{
          subtotal: subtotal,
          discount: voucherDiscount + pointsDiscount,
          tax: tax,
          shipping: shipping,
          total: total
        }}
        hasFreeShipping={hasVoucherShipment || hasFreeShippingCode || hasFreeShippingByThreshold}
        initialShippingMethodId={selectedShippingMethodId}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          loadCart() // Recargar carrito después de iniciar sesión
        }}
        allowGuest={!cart?.items?.some((item: CartItem) => !!item.customizations?.voucherTemplateId)}
        onGuestContinue={() => {
          setShowAuthModal(false)
          setShowCheckoutModal(true)
        }}
      />
    </div>
  )
}
