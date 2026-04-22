"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { FileUpload } from "@/components/FileUpload"
import toast from "react-hot-toast"
import { formatCurrency } from "@/lib/utils"
import { Search, ArrowLeft, Package, CheckCircle2 } from "lucide-react"

interface ShippingMethod {
  id: string
  name: string
  price: string
}

interface PriceRange {
  fromQty: number
  toQty: number | null
  price: number
}

interface User {
  id: string
  name: string | null
  email: string
  loyaltyTier: string
}

interface UserVoucher {
  id: string
  name: string
  remainingMeters: number
  initialMeters: number
  expiresAt: string | null
}

export default function NuevoPedidoManualPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([])
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([])
  const [useVoucher, setUseVoucher] = useState(false)
  const [selectedVoucherId, setSelectedVoucherId] = useState("")

  // DATOS DEL FORMULARIO
  const [formData, setFormData] = useState({
    // Cliente
    customerName: "",
    customerEmail: "",
    customerPhone: "",

    // Producto
    metersOrdered: "",
    pricePerMeter: "",
    designFileUrl: "",
    designFileName: "",

    // Extras
    layoutSelected: false,
    layoutPrice: 10,
    cuttingSelected: false,
    cuttingPrice: 0,
    prioritizeSelected: false,
    prioritizePrice: 0,

    // Envío
    shippingMethodId: "",
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "España",
    },

    // Pago y opciones
    paymentMethod: "BIZUM",
    notes: "",
    sendConfirmationEmail: false,
  })

  // CÁLCULOS AUTOMÁTICOS
  const subtotal = useMemo(() => {
    const meters = parseFloat(formData.metersOrdered) || 0
    const pricePerM = parseFloat(formData.pricePerMeter) || 0
    return meters * pricePerM
  }, [formData.metersOrdered, formData.pricePerMeter])

  const extrasTotal = useMemo(() => {
    let total = 0
    if (formData.layoutSelected) total += formData.layoutPrice
    if (formData.cuttingSelected) {
      // Corte es por metro
      const meters = parseFloat(formData.metersOrdered) || 0
      total += formData.cuttingPrice * meters
    }
    if (formData.prioritizeSelected) {
      // Priorizar es sobre metros totales
      const meters = parseFloat(formData.metersOrdered) || 0
      total += formData.prioritizePrice * meters
    }
    return total
  }, [
    formData.layoutSelected, formData.layoutPrice,
    formData.cuttingSelected, formData.cuttingPrice,
    formData.prioritizeSelected, formData.prioritizePrice,
    formData.metersOrdered
  ])

  const subtotalWithExtras = subtotal + extrasTotal
  const taxAmount = subtotalWithExtras * 0.21 // IVA 21%
  const shippingCost = useMemo(() => {
    const method = shippingMethods.find(m => m.id === formData.shippingMethodId)
    return method ? parseFloat(method.price) : 0
  }, [formData.shippingMethodId, shippingMethods])

  const totalPrice = subtotalWithExtras + taxAmount + shippingCost

  // CARGAR MÉTODOS DE ENVÍO Y RANGOS DE PRECIO
  useEffect(() => {
    loadShippingMethods()
    loadPriceRanges()
  }, [])

  async function loadShippingMethods() {
    try {
      const res = await fetch('/api/shipping-methods')
      if (res.ok) {
        const data = await res.json()
        setShippingMethods(data)
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error)
    }
  }

  async function loadPriceRanges() {
    try {
      // Buscar producto DTF para obtener sus rangos de precio
      const res = await fetch('/api/products?type=DTF_TEXTILE')
      if (res.ok) {
        const products = await res.json()
        if (products && products.length > 0) {
          const dtfProduct = products[0]
          // Obtener price ranges del producto
          if (dtfProduct.priceRanges) {
            setPriceRanges(dtfProduct.priceRanges)
          }
        }
      }
    } catch (error) {
      console.error('Error loading price ranges:', error)
    }
  }

  // AUTO-CALCULAR PRECIO POR METRO SEGÚN RANGOS
  useEffect(() => {
    if (formData.metersOrdered && priceRanges.length > 0) {
      const meters = parseFloat(formData.metersOrdered)
      const range = priceRanges.find(r =>
        meters >= r.fromQty && (!r.toQty || meters <= r.toQty)
      )
      if (range) {
        setFormData(prev => ({ ...prev, pricePerMeter: range.price.toString() }))
      }
    }
  }, [formData.metersOrdered, priceRanges])

  // AUTO-CALCULAR PRECIO DE EXTRAS
  useEffect(() => {
    const meters = parseFloat(formData.metersOrdered) || 0
    if (meters > 0) {
      setFormData(prev => ({
        ...prev,
        cuttingPrice: 0.5, // 0.50€ por metro
        prioritizePrice: meters <= 5 ? 15 : 25, // 15€ hasta 5m, 25€ más de 5m
      }))
    }
  }, [formData.metersOrdered])

  // BUSCAR USUARIO POR EMAIL
  async function handleSearchUser() {
    if (!formData.customerEmail) {
      toast.error("Introduce un email para buscar usuario")
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(formData.customerEmail)}`)
      if (res.ok) {
        const user = await res.json()
        if (user) {
          setFoundUser(user)
          // Auto-completar nombre si está vacío
          if (!formData.customerName && user.name) {
            setFormData(prev => ({ ...prev, customerName: user.name }))
          }

          // Cargar bonos activos del usuario
          await loadUserVouchers(user.id)

          toast.success(`Usuario encontrado: ${user.name || user.email}`)
        } else {
          setFoundUser(null)
          setUserVouchers([])
          toast("No se encontró usuario con ese email", { icon: "ℹ️" })
        }
      } else {
        setFoundUser(null)
        setUserVouchers([])
        toast("No se encontró usuario con ese email", { icon: "ℹ️" })
      }
    } catch (error) {
      console.error('Error searching user:', error)
      setFoundUser(null)
      setUserVouchers([])
      toast.error("Error al buscar usuario")
    } finally {
      setSearching(false)
    }
  }

  // CARGAR BONOS ACTIVOS DEL USUARIO
  async function loadUserVouchers(userId: string) {
    try {
      const res = await fetch(`/api/users/vouchers?userId=${userId}`)
      if (res.ok) {
        const vouchers = await res.json()
        setUserVouchers(vouchers)
        // Auto-seleccionar el primer bono si hay alguno
        if (vouchers.length > 0) {
          setSelectedVoucherId(vouchers[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading user vouchers:', error)
      setUserVouchers([])
    }
  }

  // ENVIAR FORMULARIO
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
        toast.error("Datos del cliente son obligatorios")
        return
      }

      if (!formData.metersOrdered || !formData.designFileUrl) {
        toast.error("Metros y archivo de diseño son obligatorios")
        return
      }

      if (!formData.shippingMethodId) {
        toast.error("Debes seleccionar un método de envío")
        return
      }

      if (!formData.shippingAddress.street || !formData.shippingAddress.postalCode || !formData.shippingAddress.city) {
        toast.error("Dirección de envío completa es obligatoria")
        return
      }

      // Validar que hay suficientes metros en el bono si se está usando
      if (useVoucher) {
        const selectedVoucher = userVouchers.find(v => v.id === selectedVoucherId)
        if (!selectedVoucher) {
          toast.error("Debes seleccionar un bono válido")
          return
        }
        const metersToOrder = parseFloat(formData.metersOrdered)
        const metersAvailable = Number(selectedVoucher.remainingMeters)
        if (metersToOrder > metersAvailable) {
          toast.error(`El bono solo tiene ${metersAvailable.toFixed(1)}m disponibles. Necesitas ${metersToOrder}m.`)
          return
        }
      }

      // Preparar customizations
      const customizations: any = { extras: {} }
      if (formData.layoutSelected) {
        customizations.extras.layout = { selected: true, price: formData.layoutPrice }
      }
      if (formData.cuttingSelected) {
        customizations.extras.cutting = { selected: true, price: formData.cuttingPrice }
      }
      if (formData.prioritizeSelected) {
        customizations.extras.prioritize = { selected: true, price: formData.prioritizePrice }
      }

      // Calcular el precio total correcto
      let finalTotalPrice = totalPrice
      let finalSubtotal = subtotal
      let finalTaxAmount = taxAmount

      if (useVoucher) {
        // Si usa bono, el subtotal de impresión es 0, solo se cobran extras + envío
        finalSubtotal = 0
        finalTaxAmount = extrasTotal * 0.21 // Solo IVA de extras
        finalTotalPrice = extrasTotal + finalTaxAmount + shippingCost
      }

      // Preparar payload
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        metersOrdered: parseFloat(formData.metersOrdered),
        pricePerMeter: useVoucher ? 0 : parseFloat(formData.pricePerMeter),
        subtotal: finalSubtotal,
        taxAmount: finalTaxAmount,
        shippingCost: shippingCost,
        totalPrice: finalTotalPrice,
        designFileUrl: formData.designFileUrl,
        designFileName: formData.designFileName,
        shippingMethodId: formData.shippingMethodId,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        associateUserId: foundUser?.id || undefined,
        sendConfirmationEmail: formData.sendConfirmationEmail,
        customizations: Object.keys(customizations.extras).length > 0 ? customizations : undefined,
        // Información del bono
        useVoucher: useVoucher,
        voucherId: useVoucher ? selectedVoucherId : undefined,
      }

      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear pedido')
      }

      const order = await res.json()
      toast.success(`Pedido ${order.orderNumber} creado correctamente`)

      // Redirigir a la vista del pedido
      router.push(`/admin/pedidos/${order.id}`)

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Pedido Manual</h1>
            <p className="text-gray-600 mt-1">
              Crea un pedido manualmente para pedidos recibidos por WhatsApp o teléfono
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sección 1: Datos del Cliente */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  1. Datos del Cliente
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="cliente@ejemplo.com"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearchUser}
                        disabled={searching || !formData.customerEmail}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {searching ? "Buscando..." : "Buscar Usuario"}
                      </Button>
                    </div>
                    {foundUser && (
                      <div className="mt-2 space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">Usuario registrado:</span>
                            <span>{foundUser.name || foundUser.email}</span>
                            <Badge className="ml-auto bg-blue-600">{foundUser.loyaltyTier}</Badge>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            ✓ Este pedido otorgará puntos de fidelidad
                          </p>
                        </div>

                        {/* Bonos activos */}
                        {userVouchers.length > 0 && (
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-purple-900 font-semibold">🎫 Bonos Activos</span>
                              <Badge className="bg-purple-600">{userVouchers.length}</Badge>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                              <input
                                type="checkbox"
                                checked={useVoucher}
                                onChange={(e) => setUseVoucher(e.target.checked)}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-purple-900">
                                Descontar metros de un bono activo
                              </span>
                            </label>

                            {useVoucher && (
                              <div className="space-y-3 pl-6 border-l-2 border-purple-300">
                                <div>
                                  <label className="block text-xs font-medium text-purple-700 mb-1">
                                    Selecciona el bono a usar:
                                  </label>
                                  <select
                                    value={selectedVoucherId}
                                    onChange={(e) => setSelectedVoucherId(e.target.value)}
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500"
                                  >
                                    {userVouchers.map(voucher => (
                                      <option key={voucher.id} value={voucher.id}>
                                        {voucher.name} - {Number(voucher.remainingMeters).toFixed(1)}m disponibles
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="p-3 bg-purple-100 rounded-lg">
                                  {(() => {
                                    const selectedVoucher = userVouchers.find(v => v.id === selectedVoucherId)
                                    if (!selectedVoucher) return null
                                    const metersToOrder = parseFloat(formData.metersOrdered) || 0
                                    const metersAvailable = Number(selectedVoucher.remainingMeters)

                                    if (metersToOrder > metersAvailable) {
                                      return (
                                        <div className="text-xs text-red-700">
                                          <p className="font-semibold">⚠️ No hay suficientes metros en el bono</p>
                                          <p className="mt-1">Metros solicitados: {metersToOrder}m</p>
                                          <p>Metros disponibles: {metersAvailable.toFixed(1)}m</p>
                                          <p className="mt-1 text-red-800 font-medium">
                                            Faltarían: {(metersToOrder - metersAvailable).toFixed(1)}m
                                          </p>
                                        </div>
                                      )
                                    }

                                    return (
                                      <div className="text-xs text-purple-800">
                                        <p className="font-semibold">✓ Se descontarán {metersToOrder}m del bono</p>
                                        <p className="mt-1">Metros restantes después: {(metersAvailable - metersToOrder).toFixed(1)}m</p>
                                        <p className="mt-2 font-medium text-purple-900">
                                          💰 El pedido NO generará monto económico (ya pagado en el bono)
                                        </p>
                                        <p className="text-purple-700">
                                          📋 SÍ aparecerá en cola de impresión
                                        </p>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Input
                    label="Nombre completo *"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nombre y apellidos"
                    required
                  />

                  <Input
                    label="Teléfono *"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+34 600 000 000"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Sección 2: Detalles del Pedido */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  2. Detalles del Pedido
                </h2>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Metros a imprimir *"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.metersOrdered}
                      onChange={(e) => setFormData({ ...formData, metersOrdered: e.target.value })}
                      placeholder="5"
                      required
                    />
                    <Input
                      label="Precio por metro (€) *"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerMeter}
                      onChange={(e) => setFormData({ ...formData, pricePerMeter: e.target.value })}
                      placeholder="12.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo de diseño *
                    </label>
                    <FileUpload
                      onFileUpload={(fileData) => {
                        setFormData({
                          ...formData,
                          designFileUrl: fileData.url,
                          designFileName: fileData.name
                        })
                      }}
                      currentFile={formData.designFileUrl ? {
                        url: formData.designFileUrl,
                        name: formData.designFileName,
                        size: 0
                      } : null}
                      onRemove={() => {
                        setFormData({
                          ...formData,
                          designFileUrl: "",
                          designFileName: ""
                        })
                      }}
                    />
                  </div>

                  {/* Extras */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 text-gray-900">
                      Servicios extras (opcional)
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.layoutSelected}
                          onChange={(e) => setFormData({ ...formData, layoutSelected: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">Maquetación</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.layoutPrice}
                          onChange={(e) => setFormData({ ...formData, layoutPrice: parseFloat(e.target.value) || 0 })}
                          disabled={!formData.layoutSelected}
                          className="w-24"
                          placeholder="10.00"
                        />
                        <span className="text-sm text-gray-600">€</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cuttingSelected}
                          onChange={(e) => setFormData({ ...formData, cuttingSelected: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">Servicio de corte</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cuttingPrice}
                          onChange={(e) => setFormData({ ...formData, cuttingPrice: parseFloat(e.target.value) || 0 })}
                          disabled={!formData.cuttingSelected}
                          className="w-24"
                          placeholder="0.50"
                        />
                        <span className="text-sm text-gray-600">€/m</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.prioritizeSelected}
                          onChange={(e) => setFormData({ ...formData, prioritizeSelected: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">Priorizar pedido</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.prioritizePrice}
                          onChange={(e) => setFormData({ ...formData, prioritizePrice: parseFloat(e.target.value) || 0 })}
                          disabled={!formData.prioritizeSelected}
                          className="w-24"
                          placeholder="15.00"
                        />
                        <span className="text-sm text-gray-600">€</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sección 3: Dirección de Envío */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. Dirección de Envío
                </h2>

                <div className="space-y-4">
                  <Input
                    label="Calle y número *"
                    value={formData.shippingAddress.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      shippingAddress: { ...formData.shippingAddress, street: e.target.value }
                    })}
                    placeholder="Calle Mayor, 123"
                    required
                  />

                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      label="Ciudad *"
                      value={formData.shippingAddress.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                      })}
                      placeholder="Madrid"
                      required
                    />

                    <Input
                      label="Provincia"
                      value={formData.shippingAddress.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, state: e.target.value }
                      })}
                      placeholder="Madrid"
                    />

                    <Input
                      label="Código Postal *"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, postalCode: e.target.value }
                      })}
                      placeholder="28001"
                      required
                    />
                  </div>

                  <Input
                    label="País"
                    value={formData.shippingAddress.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      shippingAddress: { ...formData.shippingAddress, country: e.target.value }
                    })}
                    placeholder="España"
                  />
                </div>
              </div>
            </Card>

            {/* Sección 4: Método de Envío y Pago */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  4. Método de Envío y Pago
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de envío *
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                      value={formData.shippingMethodId}
                      onChange={(e) => setFormData({ ...formData, shippingMethodId: e.target.value })}
                      required
                    >
                      <option value="">Selecciona un método</option>
                      {shippingMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} - {formatCurrency(parseFloat(method.price))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de pago *
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="BIZUM">Bizum</option>
                      <option value="TRANSFERENCIA">Transferencia bancaria</option>
                      <option value="EFECTIVO">Efectivo (recogida)</option>
                      <option value="CONTRA_REEMBOLSO">Contrareembolso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas internas (opcional)
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ej: Cliente solicitó entrega urgente"
                    />
                  </div>

                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendConfirmationEmail}
                      onChange={(e) => setFormData({ ...formData, sendConfirmationEmail: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Enviar email de confirmación al cliente
                    </span>
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* COLUMNA DERECHA: Resumen */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Resumen del Pedido
                  </h2>

                  <div className="space-y-3">
                    {useVoucher ? (
                      // Mostrar resumen cuando se usa bono
                      <>
                        <div className="p-3 bg-purple-50 border border-purple-300 rounded-lg">
                          <p className="text-sm font-semibold text-purple-900 mb-2">
                            🎫 Usando Bono Prepago
                          </p>
                          <div className="space-y-1 text-xs text-purple-700">
                            <div className="flex justify-between">
                              <span>Metros a imprimir:</span>
                              <span className="font-medium">{formData.metersOrdered}m</span>
                            </div>
                            {extrasTotal > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span>Extras:</span>
                                  <span className="font-medium">{formatCurrency(extrasTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>IVA extras:</span>
                                  <span className="font-medium">{formatCurrency(extrasTotal * 0.21)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span>Envío:</span>
                              <span className="font-medium">{formatCurrency(shippingCost)}</span>
                            </div>
                            <div className="border-t border-purple-300 pt-1 mt-1 flex justify-between font-bold">
                              <span>TOTAL A PAGAR:</span>
                              <span>{formatCurrency(extrasTotal * 1.21 + shippingCost)}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-purple-300">
                              <p className="text-purple-900 font-medium">
                                ✓ Impresión ya pagada en el bono
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Mostrar resumen normal
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal impresión:</span>
                          <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>

                        {extrasTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Extras:</span>
                            <span className="font-medium">{formatCurrency(extrasTotal)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">IVA (21%):</span>
                          <span className="font-medium">{formatCurrency(taxAmount)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Envío:</span>
                          <span className="font-medium">{formatCurrency(shippingCost)}</span>
                        </div>

                        <div className="border-t pt-3 flex justify-between text-lg font-bold">
                          <span>TOTAL:</span>
                          <span className="text-primary-600">{formatCurrency(totalPrice)}</span>
                        </div>
                      </>
                    )}

                    <div className="pt-4 space-y-2">
                      {useVoucher ? (
                        <>
                          <Badge className="w-full justify-center bg-purple-600 text-white py-2">
                            🎫 BONO PREPAGO
                          </Badge>
                          {extrasTotal > 0 || shippingCost > 0 ? (
                            <Badge className="w-full justify-center bg-green-600 text-white py-2">
                              PAGADO (Extras+Envío) - {formData.paymentMethod}
                            </Badge>
                          ) : (
                            <Badge className="w-full justify-center bg-green-600 text-white py-2">
                              TOTALMENTE CUBIERTO POR BONO
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge className="w-full justify-center bg-green-600 text-white py-2">
                          PAGADO - {formData.paymentMethod}
                        </Badge>
                      )}
                      <Badge className="w-full justify-center bg-blue-600 text-white py-2">
                        CONFIRMADO
                      </Badge>
                      <Badge className="w-full justify-center bg-purple-600 text-white py-2">
                        📱 ORIGEN: WhatsApp
                      </Badge>
                      {foundUser && !useVoucher && (
                        <Badge className="w-full justify-center bg-amber-600 text-white py-2">
                          ✨ Otorgará Puntos
                        </Badge>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={loading || !formData.designFileUrl}
                    >
                      {loading ? 'Creando pedido...' : 'Crear Pedido Manual'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.back()}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
