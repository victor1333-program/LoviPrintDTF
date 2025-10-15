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
  Download
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { LoyaltyBadge, LoyaltyProgress } from "@/components/LoyaltyBadge"
import { pointsToEuros } from "@/lib/loyalty"

type Tab = 'overview' | 'orders' | 'vouchers' | 'designs' | 'profile'

export default function CuentaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [userData, setUserData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
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
        <div className="mb-6 border-b">
          <nav className="flex space-x-8">
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
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
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

                          <Link href={`/pedidos/${order.orderNumber}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </Link>
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
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Información Personal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <p className="text-gray-900">{session?.user?.name || 'No especificado'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{session?.user?.email}</p>
                    </div>

                    {userData?.isProfessional && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="warning">Cuenta Profesional</Badge>
                        </div>
                        <p className="text-sm text-gray-700">
                          Disfrutas de un {Number(userData.professionalDiscount || 0)}% de descuento
                          en todos tus pedidos
                        </p>
                      </div>
                    )}

                    <div className="pt-4">
                      <Button variant="outline">Editar Perfil</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
