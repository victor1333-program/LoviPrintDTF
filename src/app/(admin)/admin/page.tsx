import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { ShoppingCart, DollarSign, Package, TrendingUp } from "lucide-react"

async function getStats() {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalOrders,
    monthOrders,
    pendingOrders,
    monthRevenue
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    }),
    prisma.order.count({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PRODUCTION']
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        },
        paymentStatus: 'PAID'
      },
      _sum: {
        totalPrice: true
      }
    })
  ])

  return {
    totalOrders,
    monthOrders,
    pendingOrders,
    monthRevenue: monthRevenue._sum.totalPrice || 0
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    {
      title: "Pedidos del Mes",
      value: stats.monthOrders,
      icon: ShoppingCart,
      color: "bg-blue-500"
    },
    {
      title: "Ingresos del Mes",
      value: formatCurrency(Number(stats.monthRevenue)),
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      title: "Pedidos Pendientes",
      value: stats.pendingOrders,
      icon: Package,
      color: "bg-orange-500"
    },
    {
      title: "Total Pedidos",
      value: stats.totalOrders,
      icon: TrendingUp,
      color: "bg-purple-500"
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Resumen general de tu negocio DTF
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrders />
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentOrders() {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay pedidos todavía
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left text-sm text-gray-600">
            <th className="pb-3">Número</th>
            <th className="pb-3">Cliente</th>
            <th className="pb-3">Metros</th>
            <th className="pb-3">Total</th>
            <th className="pb-3">Estado</th>
            <th className="pb-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b last:border-0">
              <td className="py-3 font-medium">{order.orderNumber}</td>
              <td className="py-3">{order.customerName}</td>
              <td className="py-3">{order.metersOrdered ? order.metersOrdered.toString() + 'm' : '-'}</td>
              <td className="py-3">{formatCurrency(Number(order.totalPrice))}</td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'IN_PRODUCTION' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString('es-ES')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
