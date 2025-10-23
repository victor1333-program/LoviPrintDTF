"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  Package,
  Award,
  FileImage,
  User,
  Ticket,
  TrendingUp,
  Gift,
  Eye,
  Download,
  MapPin,
  Key,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Building2,
  FileText,
  Loader2
} from "lucide-react"
import { Input } from "@/components/ui/Input"
import toast from 'react-hot-toast'
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { LoyaltyBadge, LoyaltyProgress } from "@/components/LoyaltyBadge"
import { pointsToEuros } from "@/lib/loyalty"

type Tab = 'overview' | 'orders' | 'vouchers' | 'designs' | 'profile'
type ProfileTab = 'billing' | 'shipping' | 'password'

interface ShippingAddress {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export default function CuentaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [userData, setUserData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para el perfil
  const [profileTab, setProfileTab] = useState<ProfileTab>('billing')
  const [profileLoading, setProfileLoading] = useState(false)
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      loadUserData()
    }
  }, [status])

  const loadUserData = async () => {
    try {
      const [ordersRes, vouchersRes, userRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/vouchers/user'),
        fetch('/api/user/me'),
      ])

      const ordersData = await ordersRes.json()
      const vouchersData = await vouchersRes.json()
      const userData = await userRes.json()

      setOrders(ordersData)
      setVouchers(vouchersData)
      setUserData(userData)

      // Cargar perfil si estamos en el tab de perfil
      if (activeTab === 'profile') {
        loadProfile()
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar perfil cuando se activa el tab
  useEffect(() => {
    if (activeTab === 'profile' && status === 'authenticated') {
      loadProfile()
      loadAddresses()
    }
  }, [activeTab, status])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
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
    setProfileLoading(true)

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
      setProfileLoading(false)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)

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
      setProfileLoading(false)
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
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar la dirección')
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

    setProfileLoading(true)

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
      setProfileLoading(false)
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

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingInvoice(invoiceId)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`)

      if (!res.ok) {
        throw new Error('Error al descargar la factura')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Factura-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Factura descargada')
    } catch (error: any) {
      console.error('Error downloading invoice:', error)
      toast.error(error.message || 'Error al descargar la factura')
    } finally {
      setDownloadingInvoice(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', label: 'Pendiente' },
      CONFIRMED: { variant: 'info', label: 'Confirmado' },
      IN_PRODUCTION: { variant: 'info', label: 'En Producción' },
      READY: { variant: 'success', label: 'Listo' },
      SHIPPED: { variant: 'success', label: 'Enviado' },
      DELIVERED: { variant: 'success', label: 'Entregado' },
      CANCELLED: { variant: 'error', label: 'Cancelado' },
    }

    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalSpent = userData?.totalSpent ? Number(userData.totalSpent) : 0
  const totalOrders = orders.length
  const loyaltyPoints = userData?.loyaltyPoints || 0
  const loyaltyTier = userData?.loyaltyTier || 'BRONZE'
  const pointsValue = pointsToEuros(loyaltyPoints)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
          <p className="text-gray-600">Gestiona tus pedidos, bonos y preferencias</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pedidos</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700 font-semibold">Tus Puntos</p>
                <LoyaltyBadge tier={loyaltyTier} size="sm" />
              </div>
              <p className="text-3xl font-black text-primary-600 mb-1">{loyaltyPoints}</p>
              <p className="text-xs text-gray-600">
                = <span className="font-bold text-green-600">{pointsValue.toFixed(2)}€</span> en descuentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bonos Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {vouchers.filter(v => v.isActive).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {[
              { id: 'overview', label: 'Resumen', icon: TrendingUp },
              { id: 'orders', label: 'Mis Pedidos', icon: Package },
              { id: 'vouchers', label: 'Mis Bonos', icon: Ticket },
              { id: 'designs', label: 'Diseños Guardados', icon: FileImage },
              { id: 'profile', label: 'Perfil', icon: User },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pedidos Recientes</h3>
                  {orders.slice(0, 3).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No tienes pedidos todavía
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">#{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="text-lg font-bold text-primary-600 mt-1">
                              {formatCurrency(Number(order.totalPrice))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {orders.length > 3 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4"
                      onClick={() => setActiveTab('orders')}
                    >
                      Ver todos los pedidos
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Programa de Fidelidad */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Programa de Fidelidad</h3>
                    <LoyaltyBadge tier={loyaltyTier} size="lg" />
                  </div>

                  {/* Progreso al siguiente nivel */}
                  <div className="mb-6">
                    <LoyaltyProgress totalSpent={totalSpent} tier={loyaltyTier} />
                  </div>

                  {/* Stats de puntos */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Puntos Disponibles</p>
                      <p className="text-2xl font-bold text-primary-600">{loyaltyPoints}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        = {pointsValue.toFixed(2)}€ de descuento
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalSpent.toFixed(2)}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">En toda tu historia</p>
                    </div>
                  </div>

                  {/* Cómo funciona */}
                  <div className="bg-white/70 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">
                      ¿Cómo gano puntos?
                    </h4>
                    <div className="space-y-2 text-xs text-gray-700">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-primary-600">🥉 Bronce:</span>
                        <span>1 punto por cada 1€ gastado</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-500">🥈 Plata:</span>
                        <span>1.25 puntos por cada 1€ (200-500€ gastados)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-yellow-600">🥇 Oro:</span>
                        <span>1.5 puntos por cada 1€ (500-1000€ gastados)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-600">💎 Platino:</span>
                        <span>2 puntos por cada 1€ (+1000€ gastados)</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="font-bold text-green-600">🎁 Bonus:</span>
                        <span className="ml-1">+25% puntos al comprar bonos</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="font-bold">💰 Canjear:</span>
                        <span className="ml-1">100 puntos = 5€ de descuento</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Todos mis Pedidos</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No tienes pedidos todavía</p>
                      <Link href="/productos">
                        <Button>Explorar Productos</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-6 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">#{order.orderNumber}</h4>
                              <p className="text-sm text-gray-600">
                                {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", {
                                  locale: es,
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(order.status)}
                              <p className="text-xl font-bold text-primary-600 mt-2">
                                {formatCurrency(Number(order.totalPrice))}
                              </p>
                            </div>
                          </div>

                          {order.trackingNumber && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                              <p className="text-sm font-medium text-blue-900">
                                Número de seguimiento: {order.trackingNumber}
                              </p>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  Rastrear envío →
                                </a>
                              )}
                            </div>
                          )}

                          {order.estimatedDelivery && (
                            <p className="text-sm text-gray-600 mb-4">
                              Entrega estimada:{' '}
                              {format(new Date(order.estimatedDelivery), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Link href={`/pedidos/${order.orderNumber}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </Button>
                            </Link>

                            {/* Botón de Factura */}
                            {order.invoice && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadInvoice(order.invoice.id, order.invoice.invoiceNumber)}
                                disabled={downloadingInvoice === order.invoice.id}
                              >
                                {downloadingInvoice === order.invoice.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Descargando...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Descargar Factura
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vouchers Tab */}
          {activeTab === 'vouchers' && (
            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Mis Bonos</h3>
                    <Link href="/bonos">
                      <Button size="sm">
                        <Gift className="h-4 w-4 mr-2" />
                        Comprar Bonos
                      </Button>
                    </Link>
                  </div>

                  {vouchers.length === 0 ? (
                    <div className="text-center py-12">
                      <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No tienes bonos activos</p>
                      <Link href="/bonos">
                        <Button>Ver Bonos Disponibles</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {vouchers.map((voucher) => (
                        <div
                          key={voucher.id}
                          className={`border-2 rounded-lg p-6 ${
                            voucher.isActive
                              ? 'border-primary-200 bg-primary-50'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-mono font-bold text-lg text-primary-700">
                                {voucher.code}
                              </p>
                              <Badge
                                variant={voucher.isActive ? 'success' : 'default'}
                                className="mt-1"
                              >
                                {voucher.isActive ? 'Activo' : 'Usado/Expirado'}
                              </Badge>
                            </div>
                            <Ticket className="h-8 w-8 text-primary-600" />
                          </div>

                          {voucher.type === 'METERS' && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">Metros disponibles:</p>
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-2xl font-bold text-primary-600">
                                  {Number(voucher.remainingMeters || 0).toFixed(1)}
                                </span>
                                <span className="text-gray-500">
                                  / {Number(voucher.initialMeters || 0)} metros
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-3">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (Number(voucher.remainingMeters || 0) /
                                        Number(voucher.initialMeters || 1)) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>

                              <p className="text-sm text-gray-600 mb-1">Envíos gratis:</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-green-600">
                                  {voucher.remainingShipments || 0}
                                </span>
                                <span className="text-gray-500">
                                  / {voucher.initialShipments || 0} disponibles
                                </span>
                              </div>
                            </div>
                          )}

                          {voucher.type === 'DISCOUNT_PERCENT' && (
                            <p className="text-sm text-gray-600 mb-3">
                              Descuento: {Number(voucher.discountPct)}%
                            </p>
                          )}

                          {voucher.type === 'DISCOUNT_AMOUNT' && (
                            <p className="text-sm text-gray-600 mb-3">
                              Descuento: {formatCurrency(Number(voucher.discountAmount))}
                            </p>
                          )}

                          {voucher.expiresAt && (
                            <p className="text-xs text-gray-500">
                              Expira:{' '}
                              {format(new Date(voucher.expiresAt), 'dd MMM yyyy', { locale: es })}
                            </p>
                          )}

                          {voucher.usageCount > 0 && (
                            <p className="text-xs text-gray-500">
                              Usado {voucher.usageCount} vez{voucher.usageCount !== 1 ? 'es' : ''}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Designs Tab */}
          {activeTab === 'designs' && (
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Diseños Guardados</h3>
                  <div className="text-center py-12">
                    <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      Los diseños de tus pedidos anteriores se guardarán aquí
                    </p>
                    <p className="text-sm text-gray-400">
                      Próximamente: Descarga y reutiliza tus diseños
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Sub-tabs para Perfil */}
              <div className="flex space-x-1 border-b border-gray-200">
                <button
                  onClick={() => setProfileTab('billing')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    profileTab === 'billing'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-5 h-5 inline-block mr-2" />
                  Datos de Facturación
                </button>
                <button
                  onClick={() => setProfileTab('shipping')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    profileTab === 'shipping'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-5 h-5 inline-block mr-2" />
                  Direcciones de Envío
                </button>
                <button
                  onClick={() => setProfileTab('password')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    profileTab === 'password'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Key className="w-5 h-5 inline-block mr-2" />
                  Cambiar Contraseña
                </button>
              </div>

              {/* Datos de Facturación */}
              {profileTab === 'billing' && (
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
                        value={session?.user?.email || ''}
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

                      <Button type="submit" disabled={profileLoading} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        {profileLoading ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Direcciones de Envío */}
              {profileTab === 'shipping' && (
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
                            <Button type="submit" disabled={profileLoading} className="flex-1">
                              <Save className="w-4 h-4 mr-2" />
                              {profileLoading ? 'Guardando...' : 'Guardar Dirección'}
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
              {profileTab === 'password' && (
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

                      <Button type="submit" disabled={profileLoading} className="w-full">
                        <Key className="w-4 h-4 mr-2" />
                        {profileLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
