"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  User,
  MapPin,
  Key,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  taxId?: string
  isProfessional: boolean
  shippingAddress?: any
}

interface ShippingAddress {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'billing' | 'shipping' | 'password'>('billing')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Datos de facturación
  const [billingData, setBillingData] = useState({
    name: '',
    lastName: '',
    phone: '',
    isProfessional: false,
    company: '',
    taxId: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
  })

  // Direcciones de envío
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null)
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
  })

  // Cambiar contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      loadProfile()
    }
  }, [status, router])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)

        // Separar nombre y apellidos si existen
        const nameParts = (data.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        setBillingData({
          name: firstName,
          lastName: lastName,
          phone: data.phone || '',
          isProfessional: data.isProfessional || false,
          company: data.company || '',
          taxId: data.taxId || '',
          billingStreet: data.billingStreet || '',
          billingCity: data.billingCity || '',
          billingState: data.billingState || '',
          billingPostalCode: data.billingPostalCode || '',
        })

        // Cargar direcciones
        loadAddresses()
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${billingData.name} ${billingData.lastName}`.trim(),
          phone: billingData.phone,
          isProfessional: billingData.isProfessional,
          company: billingData.company,
          taxId: billingData.taxId,
          billingStreet: billingData.billingStreet,
          billingCity: billingData.billingCity,
          billingState: billingData.billingState,
          billingPostalCode: billingData.billingPostalCode,
        }),
      })

      if (res.ok) {
        toast.success('Datos de facturación actualizados')
        loadProfile()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar los datos')
      }
    } catch (error) {
      toast.error('Error al actualizar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingAddress
        ? `/api/user/addresses/${editingAddress.id}`
        : '/api/user/addresses'

      const method = editingAddress ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })

      if (res.ok) {
        toast.success(editingAddress ? 'Dirección actualizada' : 'Dirección agregada')
        setShowAddressForm(false)
        setEditingAddress(null)
        setAddressForm({
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'España',
        })
        loadAddresses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar la dirección')
      }
    } catch (error) {
      toast.error('Error al guardar la dirección')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) return

    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Dirección eliminada')
        loadAddresses()
      } else {
        toast.error('Error al eliminar la dirección')
      }
    } catch (error) {
      toast.error('Error al eliminar la dirección')
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}/set-default`, {
        method: 'PATCH',
      })

      if (res.ok) {
        toast.success('Dirección establecida como predeterminada')
        loadAddresses()
      } else {
        toast.error('Error al establecer la dirección')
      }
    } catch (error) {
      toast.error('Error al establecer la dirección')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        toast.success('Contraseña cambiada correctamente')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const startEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address)
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    })
    setShowAddressForm(true)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'billing'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5 inline-block mr-2" />
            Datos de Facturación
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'shipping'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-5 h-5 inline-block mr-2" />
            Direcciones de Envío
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key className="w-5 h-5 inline-block mr-2" />
            Cambiar Contraseña
          </button>
        </div>

        {/* Datos de Facturación */}
        {activeTab === 'billing' && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleBillingSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    value={billingData.name}
                    onChange={(e) => setBillingData({ ...billingData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Apellidos"
                    value={billingData.lastName}
                    onChange={(e) => setBillingData({ ...billingData, lastName: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-100"
                />

                <Input
                  label="Teléfono"
                  type="tel"
                  value={billingData.phone}
                  onChange={(e) => setBillingData({ ...billingData, phone: e.target.value })}
                  required
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isProfessional"
                    checked={billingData.isProfessional}
                    onChange={(e) => setBillingData({ ...billingData, isProfessional: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isProfessional" className="text-sm font-medium text-gray-700">
                    <Building2 className="w-4 h-4 inline-block mr-1" />
                    Soy profesional / empresa
                  </label>
                </div>

                {billingData.isProfessional && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Datos de Empresa</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Razón Social"
                        value={billingData.company}
                        onChange={(e) => setBillingData({ ...billingData, company: e.target.value })}
                        required={billingData.isProfessional}
                      />
                      <Input
                        label="NIF/CIF/NIE/VAT"
                        value={billingData.taxId}
                        onChange={(e) => setBillingData({ ...billingData, taxId: e.target.value })}
                        required={billingData.isProfessional}
                      />
                    </div>

                    <h4 className="font-semibold text-gray-900 mt-4 mb-3">Dirección de Facturación</h4>
                    <Input
                      label="Dirección"
                      value={billingData.billingStreet}
                      onChange={(e) => setBillingData({ ...billingData, billingStreet: e.target.value })}
                      required={billingData.isProfessional}
                      placeholder="Calle, número, piso, puerta"
                    />
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        label="Código Postal"
                        value={billingData.billingPostalCode}
                        onChange={(e) => setBillingData({ ...billingData, billingPostalCode: e.target.value })}
                        required={billingData.isProfessional}
                        placeholder="28001"
                      />
                      <Input
                        label="Población"
                        value={billingData.billingCity}
                        onChange={(e) => setBillingData({ ...billingData, billingCity: e.target.value })}
                        required={billingData.isProfessional}
                        placeholder="Madrid"
                      />
                      <Input
                        label="Provincia"
                        value={billingData.billingState}
                        onChange={(e) => setBillingData({ ...billingData, billingState: e.target.value })}
                        required={billingData.isProfessional}
                        placeholder="Madrid"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Direcciones de Envío */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            {addresses.length > 0 && (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <Card key={address.id} className={address.isDefault ? 'border-2 border-orange-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {address.isDefault && (
                            <div className="flex items-center mb-2">
                              <CheckCircle className="w-4 h-4 text-orange-600 mr-1" />
                              <span className="text-sm font-medium text-orange-600">Dirección Predeterminada</span>
                            </div>
                          )}
                          <p className="font-medium text-gray-900">{address.street}</p>
                          <p className="text-sm text-gray-600">{address.postalCode} {address.city}</p>
                          <p className="text-sm text-gray-600">{address.state}, {address.country}</p>
                        </div>
                        <div className="flex space-x-2">
                          {!address.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(address.id)}
                            >
                              Predeterminada
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditAddress(address)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!showAddressForm && (
              <Button
                onClick={() => setShowAddressForm(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Nueva Dirección
              </Button>
            )}

            {showAddressForm && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                  </h3>
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <Input
                      label="Calle y Número"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      required
                      placeholder="Ej: Calle Mayor 123, 2º B"
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Código Postal"
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        required
                      />
                      <Input
                        label="Ciudad"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Provincia / Estado"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        required
                      />
                      <Input
                        label="País"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button type="submit" disabled={loading} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Guardando...' : 'Guardar Dirección'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddressForm(false)
                          setEditingAddress(null)
                          setAddressForm({
                            street: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            country: 'España',
                          })
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Cambiar Contraseña */}
        {activeTab === 'password' && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <Input
                  label="Contraseña Actual"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />

                <Input
                  label="Nueva Contraseña"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />

                <Input
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> La contraseña debe tener al menos 6 caracteres.
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
