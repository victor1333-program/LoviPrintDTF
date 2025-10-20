"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  Gift,
  Infinity,
  Truck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Voucher {
  id: string
  code: string
  name: string
  description: string | null
  imageUrl: string | null
  price: number
  type: string
  initialMeters: number
  remainingMeters: number
  initialShipments: number
  remainingShipments: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export default function BonosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadVouchers()
    }
  }, [status, router])

  const loadVouchers = async () => {
    try {
      const res = await fetch('/api/user/vouchers')
      if (res.ok) {
        const data = await res.json()
        setVouchers(data)
      } else {
        toast.error('Error al cargar bonos')
      }
    } catch (error) {
      console.error('Error loading vouchers:', error)
      toast.error('Error al cargar bonos')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const activeVouchers = vouchers.filter(v => v.isActive && Number(v.remainingMeters) > 0)
  const usedVouchers = vouchers.filter(v => !v.isActive || Number(v.remainingMeters) === 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Gift className="h-10 w-10 text-purple-600" />
          Mis Bonos
        </h1>
        <p className="text-gray-600 text-lg">Gestiona tus bonos prepagados y consulta tu saldo disponible</p>
      </div>

      {/* Resumen */}
      {activeVouchers.length > 0 && (
        <Card className="mb-8 bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-purple-100 mb-2 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bonos Activos
                </p>
                <p className="text-4xl font-bold">{activeVouchers.length}</p>
              </div>
              <div>
                <p className="text-purple-100 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Metros Disponibles
                </p>
                <p className="text-4xl font-bold">
                  {activeVouchers.reduce((sum, v) => sum + Number(v.remainingMeters), 0).toFixed(1)} m
                </p>
              </div>
              <div>
                <p className="text-purple-100 mb-2 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Envíos Gratis
                </p>
                <p className="text-4xl font-bold">
                  {activeVouchers.reduce((sum, v) => sum + v.remainingShipments, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonos Activos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          Bonos Activos
        </h2>

        {activeVouchers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-700">No tienes bonos activos</h3>
              <p className="text-gray-600 mb-6">
                Compra bonos prepagados y ahorra hasta un 33% en tus pedidos
              </p>
              <Button
                onClick={() => router.push('/bonos')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Gift className="h-5 w-5 mr-2" />
                Ver Bonos Disponibles
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {activeVouchers.map((voucher) => {
              const metersUsed = Number(voucher.initialMeters) - Number(voucher.remainingMeters)
              const usagePercent = (metersUsed / Number(voucher.initialMeters)) * 100

              return (
                <Card key={voucher.id} className="border-2 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Imagen o Icono */}
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        {voucher.imageUrl ? (
                          <img
                            src={voucher.imageUrl}
                            alt={voucher.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Gift className="h-12 w-12 text-white" />
                        )}
                      </div>

                      {/* Información */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold mb-1">{voucher.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Activo
                              </Badge>
                              <Badge variant="info">
                                Código: {voucher.code}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {voucher.description && (
                          <p className="text-gray-600 mb-4">{voucher.description}</p>
                        )}

                        {/* Barra de progreso */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-purple-900">
                              {Number(voucher.remainingMeters).toFixed(1)} m disponibles
                            </span>
                            <span className="text-gray-600">
                              de {Number(voucher.initialMeters).toFixed(1)} m totales
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full transition-all"
                              style={{ width: `${100 - usagePercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Truck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{voucher.remainingShipments} envíos gratis</p>
                              <p className="text-xs text-gray-600">de {voucher.initialShipments} incluidos</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Infinity className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Sin caducidad</p>
                              <p className="text-xs text-gray-600">Usa cuando quieras</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Activado</p>
                              <p className="text-xs text-gray-600">
                                {new Date(voucher.createdAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Bonos Utilizados */}
      {usedVouchers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-600">
            <AlertCircle className="h-6 w-6" />
            Bonos Utilizados
          </h2>

          <div className="grid gap-4">
            {usedVouchers.map((voucher) => (
              <Card key={voucher.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                        <Gift className="h-8 w-8 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-700">{voucher.name}</h3>
                        <p className="text-sm text-gray-600">Código: {voucher.code}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-gray-600">
                      Agotado
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CTA para comprar más bonos */}
      {activeVouchers.length > 0 && (
        <Card className="mt-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">¿Necesitas más metros?</h3>
                <p className="text-orange-100">Compra otro bono y sigue ahorrando</p>
              </div>
              <Button
                onClick={() => router.push('/bonos')}
                className="bg-white text-orange-600 hover:bg-orange-50"
              >
                <Gift className="h-5 w-5 mr-2" />
                Ver Bonos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
