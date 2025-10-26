'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Loader2, MapPin, User, Plus, Check, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

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
}

export function CheckoutModal({ isOpen, onClose, onSuccess, orderSummary, hasFreeShipping = false, initialShippingMethodId }: CheckoutModalProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'profile' | 'address'>('profile')

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

  // Métodos de envío
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    setLoading(true)
    try {
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

  const validateProfile = () => {
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
        toast.error('La dirección de facturación es obligatoria para profesionales')
        return false
      }
      if (!billingPostalCode.trim()) {
        toast.error('El código postal de facturación es obligatorio para profesionales')
        return false
      }
      if (!billingCity.trim()) {
        toast.error('La población de facturación es obligatoria para profesionales')
        return false
      }
      if (!billingState.trim()) {
        toast.error('La provincia de facturación es obligatoria para profesionales')
        return false
      }
    }
    return true
  }

  const validateAddress = () => {
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
    }

    // Validar método de envío solo si no hay envío gratis y hay métodos disponibles
    if (!hasFreeShipping && shippingMethods.length > 0 && !selectedShippingMethodId) {
      toast.error('Selecciona un método de envío')
      return false
    }

    return true
  }

  const handleContinueToAddress = async () => {
    if (!validateProfile()) return

    // Guardar datos del perfil si han cambiado
    try {
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

      setStep('address')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil')
    }
  }

  const handleSubmit = async () => {
    if (!validateAddress()) return

    setSubmitting(true)
    try {
      let shippingAddress

      if (showNewAddressForm) {
        // Guardar nueva dirección
        const res = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAddress)
        })

        if (!res.ok) {
          throw new Error('Error al guardar la dirección')
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
        shippingMethodId: selectedShippingMethodId || undefined
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
          <DialogTitle className="text-2xl">
            {step === 'profile' ? 'Confirma tus Datos' : 'Dirección de Envío'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'profile' ? 'bg-primary-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {step === 'address' ? <Check className="h-5 w-5" /> : '1'}
                </div>
                <span className={step === 'profile' ? 'font-semibold' : 'text-gray-500'}>
                  Datos Personales
                </span>
              </div>

              <div className="w-12 h-0.5 bg-gray-300" />

              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'address' ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className={step === 'address' ? 'font-semibold' : 'text-gray-500'}>
                  Dirección
                </span>
              </div>
            </div>

            {/* Profile Step */}
            {step === 'profile' && (
              <div className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-primary-900 mb-1">
                        Verifica tus datos
                      </h3>
                      <p className="text-sm text-primary-800">
                        Estos datos se usarán para el envío y comunicaciones del pedido
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El email no se puede cambiar desde aquí
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="600123456"
                  />
                </div>

                {/* Professional checkbox */}
                <div className="border-t pt-4">
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
                </div>

                {/* Professional fields */}
                {isProfessional && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary-200 bg-primary-50 p-4 rounded-r-lg">
                    <p className="text-sm text-primary-800 font-medium mb-3">
                      Datos fiscales
                    </p>

                    <div>
                      <Label htmlFor="company">Razón Social *</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Mi Empresa S.L."
                      />
                    </div>

                    <div>
                      <Label htmlFor="taxId">NIF/CIF/NIE/VAT *</Label>
                      <Input
                        id="taxId"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="B12345678"
                      />
                    </div>

                    <div className="pt-4">
                      <h3 className="font-medium text-gray-900 mb-3">Dirección de Facturación</h3>

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

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleContinueToAddress} className="flex-1">
                    Continuar a Dirección
                  </Button>
                </div>
              </div>
            )}

            {/* Address Step */}
            {step === 'address' && (
              <div className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-primary-900 mb-1">
                        ¿Dónde enviamos tu pedido?
                      </h3>
                      <p className="text-sm text-primary-800">
                        Selecciona una dirección o crea una nueva
                      </p>
                    </div>
                  </div>
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
                        />
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Código Postal *</Label>
                        <Input
                          id="postalCode"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          placeholder="28001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">Provincia</Label>
                        <Input
                          id="state"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          placeholder="Madrid"
                        />
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
                  </div>
                )}

                {/* Selección de método de envío */}
                {shippingMethods.length > 0 && (
                  <div className="border-t pt-4 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="h-5 w-5 text-primary-600" />
                      <h4 className="font-semibold">Método de Envío</h4>
                    </div>
                    {hasFreeShipping && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Tu pedido tiene envío gratis
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {shippingMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedShippingMethodId === method.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedShippingMethodId(method.id)}
                        >
                          <input
                            type="radio"
                            name="shipping-method"
                            value={method.id}
                            checked={selectedShippingMethodId === method.id}
                            onChange={() => setSelectedShippingMethodId(method.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{method.name}</div>
                              <div className={`font-semibold ${hasFreeShipping ? 'text-green-600' : 'text-primary-600'}`}>
                                {hasFreeShipping ? 'GRATIS' : (method.price === 0 ? 'GRATIS' : formatCurrency(method.price))}
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumen del pedido */}
                <div className="border-t pt-4 mt-6">
                  <h4 className="font-semibold mb-3">Resumen del Pedido</h4>
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
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('profile')}
                    className="flex-1"
                  >
                    ← Volver
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
                      'Confirmar y Continuar'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
