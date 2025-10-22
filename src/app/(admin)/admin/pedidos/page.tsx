import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { prisma } from "@/lib/prisma"
import { Search } from "lucide-react"
import OrdersTable from "@/components/admin/OrdersTable"
import TrackingUpdateButton from "@/components/admin/TrackingUpdateButton"

// Configurar la página como dinámica (sin caché)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PedidosPage() {
  const ordersRaw = await prisma.order.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      shipment: {
        select: {
          trackingNumber: true,
          glsReference: true
        }
      },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          pdfUrl: true
        }
      }
    }
  })

  // Serializar los Decimals a números para el Client Component
  const orders = ordersRaw.map(order => ({
    ...order,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    shippingCost: Number(order.shippingCost),
    totalPrice: Number(order.totalPrice),
    metersOrdered: order.metersOrdered ? Number(order.metersOrdered) : null,
    pricePerMeter: order.pricePerMeter ? Number(order.pricePerMeter) : null,
    pointsDiscount: order.pointsDiscount ? Number(order.pointsDiscount) : null,
  }))

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona todos los pedidos de film DTF
          </p>
        </div>
        <TrackingUpdateButton />
      </div>

      {/* Filtros - TODO: Implementar filtros funcionales */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de pedido, cliente o email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="IN_PRODUCTION">En Producción</option>
              <option value="READY">Listo</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay pedidos todavía
            </div>
          ) : (
            <OrdersTable orders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
