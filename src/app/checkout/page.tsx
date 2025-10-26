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
import { ArrowLeft, CreditCard, Tag, Ticket, AlertCircle, MapPin, User, Building, CheckCircle, Truck } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Address {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

interface UserProfile {
  name: string
  email: string
  phone: string
  company: string | null
  taxId: string | null
  isProfessional: boolean
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

interface UploadedFileData {
  url: string
  name: string
  size: number
  publicId?: string
  metadata?: any
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [orderData, setOrderData] = useState<any>(null)
  const [designFile, setDesignFile] = useState<UploadedFileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const [userVouchers, setUserVouchers] = useState<any[]>([])
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [showVoucherPrompt, setShowVoucherPrompt] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)

  // Estado del perfil del usuario
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userAddresses, setUserAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [profileMissing, setProfileMissing] = useState(false)
  const [addressMissing, setAddressMissing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    taxId: '',
    isProfessional: false,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
    notes: '',
    saveAddress: true, // Nueva opción para guardar dirección
  })

  useEffect(() => {
    const stored = localStorage.getItem('dtf_order')
    if (stored) {
      setOrderData(JSON.parse(stored))
    } else {
      router.push('/')
    }

    // Cargar métodos de envío
    loadShippingMethods()
  }, [router])

  const loadShippingMethods = async () => {
    try {
      const res = await fetch('/api/shipping-methods')
      if (res.ok) {
        const methods = await res.json()
        setShippingMethods(methods)

        // Seleccionar el primer método por defecto
        if (methods.length > 0) {
          setSelectedShippingMethod(methods[0])
        }
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error)
    }
  }

  // Cargar perfil y direcciones del usuario autenticado
  useEffect(() => {
    if (session?.user) {
      loadUserProfile()
      loadUserAddresses()
      loadUserVouchers()
    }
  }, [session])

  const loadUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const profile = await res.json()
        setUserProfile(profile)

        // Pre-llenar datos de facturación
        setFormData(prev => ({
          ...prev,
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          company: profile.company || '',
          taxId: profile.taxId || '',
          isProfessional: profile.isProfessional || false,
        }))

        // Verificar si faltan datos críticos de facturación
        const missingBilling = !profile.name || !profile.phone
        setProfileMissing(missingBilling)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadUserAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) {
        const addresses = await res.json()
        setUserAddresses(addresses)

        if (addresses.length === 0) {
          setAddressMissing(true)
          setUseNewAddress(true)
        } else {
          // Seleccionar dirección predeterminada
          const defaultAddr = addresses.find((a: Address) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            fillAddressFromSaved(defaultAddr)
          }
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const fillAddressFromSaved = (address: Address) => {
    setFormData(prev => ({
      ...prev,
      address: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    }))
  }

  const handleAddressChange = (addressId: string) => {
    if (addressId === 'new') {
      setUseNewAddress(true)
      setSelectedAddressId(null)
      setFormData(prev => ({
        ...prev,
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'España',
      }))
    } else {
      setUseNewAddress(false)
      setSelectedAddressId(addressId)
      const addr = userAddresses.find(a => a.id === addressId)
      if (addr) {
        fillAddressFromSaved(addr)
      }
    }
  }

  const loadUserVouchers = async () => {
    try {
      const res = await fetch('/api/vouchers/user')
      if (res.ok) {
        const vouchers = await res.json()
        const activeVouchers = vouchers.filter((v: any) =>
          v.isActive && v.type === 'METERS' && Number(v.remainingMeters) >= orderData?.meters
        )
        setUserVouchers(activeVouchers)

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
        recalculateOrder(discount, selectedVoucher, selectedShippingMethod)
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
    recalculateOrder(appliedDiscount, voucherId, selectedShippingMethod)
    if (voucherId) {
      toast.success("Bono seleccionado para este pedido")
    }
  }

  const recalculateOrder = (discount: any, voucherId: string | null, shippingMethod?: ShippingMethod | null) => {
    let subtotal = orderData.meters * orderData.pricePerMeter
    let discountAmount = 0

    if (discount) {
      if (discount.type === 'PERCENT') {
        discountAmount = subtotal * (Number(discount.discountPct) / 100)
      } else if (discount.type === 'AMOUNT') {
        discountAmount = Number(discount.discountAmount)
      }
    }

    if (voucherId) {
      subtotal = 0
      discountAmount = 0
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const tax = afterDiscount * 0.21

    // Usar el método de envío seleccionado o el del orderData
    const method = shippingMethod !== undefined ? shippingMethod : selectedShippingMethod
    const shipping = method ? Number(method.price) : 0

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
      discountCodeId: discount?.id,
      shippingMethodId: method?.id
    })
  }

  const handleShippingMethodChange = (method: ShippingMethod) => {
    setSelectedShippingMethod(method)
    recalculateOrder(appliedDiscount, selectedVoucher, method)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!designFile) {
      toast.error("Por favor, sube tu archivo de diseño")
      return
    }

    // Validaciones adicionales
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Por favor, completa tus datos de facturación")
      return
    }

    if (!formData.address || !formData.city || !formData.postalCode) {
      toast.error("Por favor, completa la dirección de envío")
      return
    }

    setLoading(true)

    try {
      // El archivo ya está subido gracias a FileUpload, solo usar la URL
      const fileUrl = designFile?.url
      const fileName = designFile?.name

      if (!fileUrl) {
        throw new Error('Error: archivo no subido correctamente')
      }

      // Crear el pedido (el endpoint guardará perfil y dirección si es necesario)
      const orderPayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || null,
        taxId: formData.taxId || null,
        isProfessional: formData.isProfessional,
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
        notes: formData.notes,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        saveProfile: session?.user ? true : false,
        saveAddress: session?.user && formData.saveAddress && useNewAddress ? true : false,
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

      // Limpiar localStorage
      localStorage.removeItem('dtf_order')

      // Mostrar éxito y redirigir
      toast.success('¡Pedido creado con éxito!')
      router.push(`/pedido/${order.orderNumber}`)

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al procesar el pedido. Inténtalo de nuevo.')
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
              Finalizar Pedido
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Completa tus datos y sube tu diseño
            </p>
          </div>

          {/* Advertencias de datos faltantes */}
          {session?.user && (profileMissing || addressMissing) && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">
                    Completa tu perfil
                  </h3>
                  <p className="text-yellow-800 mb-3">
                    {profileMissing && addressMissing && "Faltan tus datos de facturación y dirección de envío."}
                    {profileMissing && !addressMissing && "Faltan tus datos de facturación."}
                    {!profileMissing && addressMissing && "No tienes direcciones de envío guardadas."}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Puedes completarlos aquí mismo o ir a <Link href="/cuenta/perfil" className="underline font-semibold">Mi Perfil</Link> para guardarlos.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                {/* Datos de Facturación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Datos de Facturación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Nombre Completo"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Juan Pérez García"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="juan@ejemplo.com"
                        disabled={!!session?.user}
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

                    {/* Checkbox Profesional */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isProfessional"
                        name="isProfessional"
                        checked={formData.isProfessional}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="isProfessional" className="text-sm font-medium text-gray-700">
                        Soy profesional / empresa
                      </label>
                    </div>

                    {/* Campos profesionales */}
                    {formData.isProfessional && (
                      <div className="space-y-4 pt-2 border-t">
                        <Input
                          label="Razón Social"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Mi Empresa S.L."
                        />
                        <Input
                          label="NIF/CIF/NIE/VAT"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          placeholder="B12345678"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dirección de Envío */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Dirección de Envío
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selector de dirección guardada (solo si hay direcciones) */}
                    {session?.user && userAddresses.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecciona una dirección
                        </label>
                        <select
                          value={useNewAddress ? 'new' : (selectedAddressId || '')}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {userAddresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.street}, {addr.city} ({addr.postalCode})
                              {addr.isDefault && ' ⭐ Predeterminada'}
                            </option>
                          ))}
                          <option value="new">➕ Usar otra dirección</option>
                        </select>
                      </div>
                    )}

                    {/* Formulario de dirección (siempre visible para editar o nueva) */}
                    <div className="space-y-4">
                      <Input
                        label="Dirección"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="Calle Principal 123, Piso 2A"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Código Postal"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          required
                          placeholder="28001"
                        />
                        <Input
                          label="Ciudad"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          placeholder="Madrid"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Provincia/Estado"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          placeholder="Madrid"
                        />
                        <Input
                          label="País"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                          placeholder="España"
                        />
                      </div>
                    </div>

                    {/* Opción de guardar dirección */}
                    {session?.user && useNewAddress && (
                      <div className="flex items-center gap-2 pt-2 bg-blue-50 rounded-lg p-3">
                        <input
                          type="checkbox"
                          id="saveAddress"
                          name="saveAddress"
                          checked={formData.saveAddress}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="saveAddress" className="text-sm font-medium text-blue-900">
                          Guardar esta dirección en mi perfil para futuros pedidos
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Método de Envío */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Método de Envío
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Indicador de envío gratis */}
                    {orderData.shipping === 0 && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Tu pedido tiene envío gratis
                        </p>
                      </div>
                    )}
                    {shippingMethods.length > 0 ? (
                      shippingMethods.map((method) => (
                        <div
                          key={method.id}
                          onClick={() => handleShippingMethodChange(method)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedShippingMethod?.id === method.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={selectedShippingMethod?.id === method.id}
                                  onChange={() => handleShippingMethodChange(method)}
                                  className="w-4 h-4 text-primary-600"
                                />
                                <h4 className="font-semibold text-gray-900">{method.name}</h4>
                              </div>
                              {method.description && (
                                <p className="text-sm text-gray-600 mt-1 ml-6">{method.description}</p>
                              )}
                              {method.estimatedDays && (
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                  Entrega estimada: {method.estimatedDays}
                                </p>
                              )}
                            </div>
                            <div className="ml-4">
                              <p className={`text-lg font-bold ${orderData.shipping === 0 ? 'text-green-600' : 'text-primary-600'}`}>
                                {orderData.shipping === 0 ? 'GRATIS' : (method.price === 0 ? 'GRATIS' : `${method.price.toFixed(2)}€`)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No hay métodos de envío disponibles
                      </div>
                    )}
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
