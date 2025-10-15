"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Download, Eye, FileImage, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import toast from "react-hot-toast"

export default function AdminDisenosPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders?all=true')
      const data = await res.json()
      // Filtrar solo pedidos que tengan archivos de diseño
      const ordersWithFiles = data.filter((order: any) =>
        order.items?.some((item: any) => item.fileUrl)
      )
      setOrders(ordersWithFiles)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Error al cargar diseños')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) =>
    search
      ? order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diseños de Clientes</h1>
          <p className="text-gray-600">Archivos subidos en los pedidos</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por número de pedido, cliente o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Pedido #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.customerName} • {order.customerEmail}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.status === 'DELIVERED'
                        ? 'success'
                        : order.status === 'CANCELLED'
                        ? 'error'
                        : 'info'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {order.items
                    ?.filter((item: any) => item.fileUrl)
                    .map((item: any) => (
                      <Card key={item.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <FileImage className="h-12 w-12 text-gray-400" />
                          </div>

                          <p className="font-medium text-sm mb-1 truncate">
                            {item.fileName || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            {item.product?.name}
                          </p>

                          {item.fileMetadata && (
                            <div className="text-xs text-gray-500 mb-3">
                              {item.fileMetadata.width && item.fileMetadata.height && (
                                <p>
                                  {item.fileMetadata.width} x {item.fileMetadata.height}px
                                </p>
                              )}
                              {item.fileMetadata.dpi && <p>{item.fileMetadata.dpi} DPI</p>}
                              {item.fileSize && (
                                <p>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (item.fileUrl) {
                                  window.open(item.fileUrl, '_blank')
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron diseños</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
