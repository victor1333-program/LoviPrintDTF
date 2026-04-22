'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Loader2, MapPin, User, Plus, Truck, MessageSquare, ShieldCheck, PackageCheck, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

const SPANISH_PROVINCES = [
  'A Coruña',
  'Álava',
  'Albacete',
  'Alicante',
  'Almería',
  'Asturias',
  'Ávila',
  'Badajoz',
  'Barcelona',
  'Burgos',
  'Cáceres',
  'Cádiz',
  'Cantabria',
  'Castellón',
  'Ciudad Real',
  'Córdoba',
  'Cuenca',
  'Girona',
  'Granada',
  'Guadalajara',
  'Gipuzkoa',
  'Huelva',
  'Huesca',
  'Jaén',
  'La Rioja',
  'León',
  'Lleida',
  'Lugo',
  'Madrid',
  'Málaga',
  'Murcia',
  'Navarra',
  'Ourense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia',
  'Valladolid',
  'Bizkaia',
  'Zamora',
  'Zaragoza',
]

interface Address {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
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

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: CheckoutData) => void
  orderSummary: {
    subtotal: number
    discount: number
    tax: number
    shipping: number
    total: number
  }
  hasFreeShipping?: boolean
  initialShippingMethodId?: string
}

export interface CheckoutData {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  shippingMethodId?: string
  notes?: string
}

export function CheckoutModal({ isOpen, onClose, onSuccess, orderSummary, hasFreeShipping = false, initialShippingMethodId }: CheckoutModalProps) {
  const { data: session } = useSession()
  const isGuest = !session?.user
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Datos del perfil
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isProfessional, setIsProfessional] = useState(false)
  const [company, setCompany] = useState('')
  const [taxId, setTaxId] = useState('')

  // Dirección de facturación (para profesionales)
  const [billingStreet, setBillingStreet] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')

  // Direcciones
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  // Nueva dirección
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España'
  })
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  // Métodos de envío
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('')

  // Notas adicionales
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    setLoading(true)
    try {
      if (!isGuest) {
        // Cargar datos del usuario
        const userRes = await fetch('/api/user/me')
        if (userRes.ok) {
          const userData = await userRes.json()
          setName(userData.name || '')
          setEmail(userData.email || '')
          setPhone(userData.phone || '')
          setIsProfessional(userData.isProfessional || false)
          setCompany(userData.company || '')
          setTaxId(userData.taxId || '')
          setBillingStreet(userData.billingStreet || '')
          setBillingCity(userData.billingCity || '')
          setBillingState(userData.billingState || '')
          setBillingPostalCode(userData.billingPostalCode || '')
        }

        // Cargar direcciones
        const addressRes = await fetch('/api/user/addresses')
        if (addressRes.ok) {
          const addressData = await addressRes.json()
          setAddresses(addressData)

          // Seleccionar dirección por defecto si existe
          const defaultAddress = addressData.find((a: Address) => a.isDefault)
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
          }

          // Si no tiene direcciones, mostrar formulario de nueva dirección
          if (addressData.length === 0) {
            setShowNewAddressForm(true)
          }
        }
      } else {
        // Modo invitado: sin direcciones previas, mostrar formulario nuevo
        setShowNewAddressForm(true)
      }

      // Cargar métodos de envío siempre (se mostrará u ocultará según hasFreeShipping)
      const shippingRes = await fetch('/api/shipping-methods')
      if (shippingRes.ok) {
        const shippingData = await shippingRes.json()
        setShippingMethods(shippingData)

        // Si hay un método pre-seleccionado del carrito, usarlo
        if (initialShippingMethodId) {
          // Verificar que el método existe en la lista
          const methodExists = shippingData.find((m: ShippingMethod) => m.id === initialShippingMethodId)
          if (methodExists) {
            setSelectedShippingMethodId(initialShippingMethodId)
          } else if (shippingData.length > 0) {
            // Si no existe, seleccionar el primero
            setSelectedShippingMethodId(shippingData[0].id)
          }
        } else if (shippingData.length > 0) {
          // Si no hay pre-selección, seleccionar el primer método por defecto
          setSelectedShippingMethodId(shippingData[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Error al cargar tus datos')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    // Datos personales
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return false
    }
    if (!email.trim()) {
      toast.error('El email es obligatorio')
      return false
    }
    if (!phone.trim()) {
      toast.error('El teléfono es obligatorio')
      return false
    }
    // Datos fiscales (solo si es profesional)
    if (isProfessional) {
      if (!company.trim()) {
        toast.error('La razón social es obligatoria para profesionales')
        return false
      }
      if (!taxId.trim()) {
        toast.error('El NIF/CIF es obligatorio para profesionales')
        return false
      }
      if (!billingStreet.trim()) {
        toast.error('La dirección de facturación es obligatoria')
        return false
      }
      if (!billingPostalCode.trim()) {
        toast.error('El código postal de facturación es obligatorio')
        return false
      }
      if (!billingCity.trim()) {
        toast.error('La población de facturación es obligatoria')
        return false
      }
      if (!billingState.trim()) {
        toast.error('La provincia de facturación es obligatoria')
        return false
      }
    }
    // Dirección de envío
    if (!showNewAddressForm && !selectedAddressId) {
      toast.error('Selecciona una dirección de envío')
      return false
    }
    if (showNewAddressForm) {
      if (!newAddress.street.trim()) {
        toast.error('La calle es obligatoria')
        return false
      }
      if (!newAddress.city.trim()) {
        toast.error('La ciudad es obligatoria')
        return false
      }
      if (!newAddress.postalCode.trim()) {
        toast.error('El código postal es obligatorio')
        return false
      }
      if (!newAddress.state.trim()) {
        toast.error('Selecciona una provincia')
        return false
      }
    }
    // Método de envío
    if (!hasFreeShipping && shippingMethods.length > 0 && !selectedShippingMethodId) {
      toast.error('Selecciona un método de envío')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      // Guardar perfil si hay sesión
      if (!isGuest) {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            isProfessional,
            company: isProfessional ? company : null,
            taxId: isProfessional ? taxId : null,
            billingStreet: isProfessional ? billingStreet : null,
            billingCity: isProfessional ? billingCity : null,
            billingState: isProfessional ? billingState : null,
            billingPostalCode: isProfessional ? billingPostalCode : null
          })
        })
      }

      let shippingAddress

      if (showNewAddressForm) {
        // Solo guardar la dirección si el usuario tiene cuenta
        if (!isGuest) {
          const res = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newAddress, isDefault: saveAsDefault })
          })

          if (!res.ok) {
            throw new Error('Error al guardar la dirección')
          }
        }

        shippingAddress = newAddress
      } else {
        // Usar dirección seleccionada
        const selected = addresses.find(a => a.id === selectedAddressId)
        if (!selected) {
          throw new Error('Dirección no encontrada')
        }

        shippingAddress = {
          street: selected.street,
          city: selected.city,
          state: selected.state,
          postalCode: selected.postalCode,
          country: selected.country
        }
      }

      // Llamar al callback con los datos
      onSuccess({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress,
        shippingMethodId: selectedShippingMethodId && selectedShippingMethodId.trim() !== '' ? selectedShippingMethodId : undefined,
        notes: notes.trim() || undefined,
      })

    } catch (error: any) {
      console.error('Error submitting checkout:', error)
      toast.error(error.message || 'Error al procesar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Completa tu Pedido</DialogTitle>
          {!loading && (
            <p className="text-sm text-gray-600 mt-1">
              {isGuest
                ? 'Compra sin registro. Te enviaremos un link por email para seguir tu pedido.'
                : 'Revisa tus datos y confirma para continuar al pago.'}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sección: Datos personales */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Tus datos</h3>
              </div>

              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    disabled={!isGuest}
                    className={!isGuest ? 'bg-gray-50' : ''}
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="600123456"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    pattern="[0-9+\s\-]{6,20}"
                  />
                </div>
              </div>

              {/* Professional checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isProfessional"
                  checked={isProfessional}
                  onChange={(e) => setIsProfessional(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <Label htmlFor="isProfessional" className="mb-0 cursor-pointer">
                  ¿Eres profesional? (Requiere factura con datos fiscales)
                </Label>
              </div>

              {/* Professional fields */}
              {isProfessional && (
                <div className="space-y-4 pl-4 border-l-2 border-primary-200 bg-primary-50 p-4 rounded-r-lg">
                  <p className="text-sm text-primary-800 font-medium mb-3">
                    Datos fiscales
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="company">Razón Social *</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Mi Empresa S.L."
                        required={isProfessional}
                        autoComplete="organization"
                      />
                    </div>

                    <div>
                      <Label htmlFor="taxId">NIF/CIF/NIE/VAT *</Label>
                      <Input
                        id="taxId"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="B12345678"
                        required={isProfessional}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Dirección de Facturación</h4>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="billingStreet">Dirección *</Label>
                        <Input
                          id="billingStreet"
                          value={billingStreet}
                          onChange={(e) => setBillingStreet(e.target.value)}
                          placeholder="Calle, número, piso, puerta"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="billingPostalCode">Código Postal *</Label>
                          <Input
                            id="billingPostalCode"
                            value={billingPostalCode}
                            onChange={(e) => setBillingPostalCode(e.target.value)}
                            placeholder="28001"
                          />
                        </div>

                        <div>
                          <Label htmlFor="billingCity">Población *</Label>
                          <Input
                            id="billingCity"
                            value={billingCity}
                            onChange={(e) => setBillingCity(e.target.value)}
                            placeholder="Madrid"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="billingState">Provincia *</Label>
                        <Input
                          id="billingState"
                          value={billingState}
                          onChange={(e) => setBillingState(e.target.value)}
                          placeholder="Madrid"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs text-blue-800">
                      💡 La factura se generará con estos datos fiscales
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Sección: Dirección de envío */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Dirección de envío</h3>
              </div>

              {/* Direcciones existentes */}
                {addresses.length > 0 && !showNewAddressForm && (
                  <div className="space-y-3">
                    <Label>Tus Direcciones</Label>
                    <div className="space-y-2">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {address.street}
                            </div>
                            <div className="text-sm text-gray-600">
                              {address.postalCode} {address.city}, {address.state}
                            </div>
                            <div className="text-sm text-gray-500">{address.country}</div>
                            {address.isDefault && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                                Predeterminada
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowNewAddressForm(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Nueva Dirección
                    </Button>
                  </div>
                )}

                {/* Formulario nueva dirección */}
                {(showNewAddressForm || addresses.length === 0) && (
                  <div className="space-y-4">
                    {addresses.length > 0 && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowNewAddressForm(false)}
                        className="mb-2"
                      >
                        ← Volver a mis direcciones
                      </Button>
                    )}

                    <div>
                      <Label htmlFor="street">Calle y Número *</Label>
                      <Input
                        id="street"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="Calle Mayor, 123"
                        required
                        autoComplete="street-address"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Ciudad *</Label>
                        <Input
                          id="city"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder="Madrid"
                          required
                          autoComplete="address-level2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Código Postal *</Label>
                        <Input
                          id="postalCode"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          placeholder="28001"
                          required
                          autoComplete="postal-code"
                          inputMode="numeric"
                          pattern="[0-9]{5}"
                          maxLength={5}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">Provincia *</Label>
                        <select
                          id="state"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Selecciona una provincia</option>
                          {SPANISH_PROVINCES.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Solo realizamos envíos a provincias peninsulares
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                          placeholder="España"
                        />
                      </div>
                    </div>

                    {!isGuest && addresses.length > 0 && (
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAsDefault}
                          onChange={(e) => setSaveAsDefault(e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Usar esta dirección como predeterminada
                        </span>
                      </label>
                    )}
                  </div>
                )}
            </section>

            {/* Sección: Método de envío (resumen readonly) */}
            {shippingMethods.length > 0 && (() => {
              const selected = shippingMethods.find(m => m.id === selectedShippingMethodId) || shippingMethods[0]
              const isStandardShipping = selected.price <= 6
              const isFreeForThisMethod = hasFreeShipping && isStandardShipping
              const displayPrice = isFreeForThisMethod || selected.price === 0 ? 'GRATIS' : formatCurrency(selected.price)

              return (
                <section className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">Método de envío</h3>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{selected.name}</div>
                      {selected.estimatedDays && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Tiempo estimado: {selected.estimatedDays}
                        </div>
                      )}
                    </div>
                    <div className={`font-semibold flex-shrink-0 ${isFreeForThisMethod ? 'text-green-600' : 'text-primary-600'}`}>
                      {displayPrice}
                    </div>
                  </div>
                </section>
              )
            })()}

            {/* Sección: Notas adicionales */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">
                  Notas adicionales <span className="font-normal text-sm text-gray-500">(opcional)</span>
                </h3>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Instrucciones especiales, fecha preferida de entrega, comentarios sobre el diseño..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 text-right">{notes.length}/500</p>
            </section>

            {/* Resumen del pedido */}
            <section className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Resumen del pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(orderSummary.subtotal)}</span>
                </div>
                {orderSummary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(orderSummary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA</span>
                  <span>{formatCurrency(orderSummary.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span>{formatCurrency(orderSummary.shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(orderSummary.total)}</span>
                </div>
              </div>
            </section>

            {/* Señales de confianza */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1 p-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-xs text-gray-700 leading-tight">Pago seguro<br />con Stripe</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2">
                <PackageCheck className="h-5 w-5 text-green-600" />
                <span className="text-xs text-gray-700 leading-tight">Envío con<br />seguimiento</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2">
                <RotateCcw className="h-5 w-5 text-green-600" />
                <span className="text-xs text-gray-700 leading-tight">Soporte<br />garantizado</span>
              </div>
            </div>

            {/* CTA WhatsApp */}
            <a
              href="https://wa.me/34614051291?text=Hola,%20tengo%20una%20duda%20sobre%20mi%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium py-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              ¿Dudas? Escríbenos por WhatsApp
            </a>

            {/* Botones */}
            <div
              className="flex gap-3 pt-3 pb-[env(safe-area-inset-bottom)] sticky bottom-0 bg-white border-t -mx-6 px-6"
            >
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar y Pagar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
