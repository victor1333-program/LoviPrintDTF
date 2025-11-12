import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"
import Link from "next/link"
import { Search, Plus, FileText, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { getQuoteStatusText, getQuoteStatusColor } from "@/lib/quotes"

// Configurar la página como dinámica (sin caché)
export const dynamic = 'force-dynamic'
export const revalidate = 0

function getStatusBadgeVariant(status: string) {
  const colorMap: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
    PENDING_REVIEW: "warning",
    QUOTED: "info",
    PAYMENT_SENT: "default",
    PAID: "success",
    EXPIRED: "default",
    CANCELLED: "error",
  }
  return colorMap[status] || "default"
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING_REVIEW':
      return <Clock className="w-4 h-4" />
    case 'QUOTED':
    case 'PAYMENT_SENT':
      return <DollarSign className="w-4 h-4" />
    case 'PAID':
      return <CheckCircle className="w-4 h-4" />
    case 'EXPIRED':
    case 'CANCELLED':
      return <XCircle className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatCurrency(amount: number | null) {
  if (amount === null) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export default async function PresupuestosPage() {
  const quotesRaw = await prisma.quote.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true
        }
      }
    }
  })

  // Serializar los Decimals a números para el Client Component
  const quotes = quotesRaw.map(quote => ({
    ...quote,
    estimatedMeters: quote.estimatedMeters ? Number(quote.estimatedMeters) : null,
    pricePerMeter: quote.pricePerMeter ? Number(quote.pricePerMeter) : null,
    cuttingPrice: quote.cuttingPrice ? Number(quote.cuttingPrice) : null,
    layoutPrice: quote.layoutPrice ? Number(quote.layoutPrice) : null,
    priorityPrice: quote.priorityPrice ? Number(quote.priorityPrice) : null,
    shippingCost: quote.shippingCost ? Number(quote.shippingCost) : null,
    subtotal: quote.subtotal ? Number(quote.subtotal) : null,
    taxAmount: quote.taxAmount ? Number(quote.taxAmount) : null,
    estimatedTotal: quote.estimatedTotal ? Number(quote.estimatedTotal) : null,
  }))

  // Estadísticas
  const stats = {
    pendingReview: quotes.filter(q => q.status === 'PENDING_REVIEW').length,
    quoted: quotes.filter(q => q.status === 'QUOTED').length,
    paymentSent: quotes.filter(q => q.status === 'PAYMENT_SENT').length,
    paid: quotes.filter(q => q.status === 'PAID').length,
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Gestiona las solicitudes de presupuesto de clientes
          </p>
        </div>
        <Link
          href="/solicitar-presupuesto"
          target="_blank"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ver página pública
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cotizados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.quoted}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En pago</p>
                <p className="text-2xl font-bold text-purple-600">{stats.paymentSent}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagados</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-auto">
              <option value="">Todos los estados</option>
              <option value="PENDING_REVIEW">Pendiente de revisión</option>
              <option value="QUOTED">Cotizado</option>
              <option value="PAYMENT_SENT">Enlace enviado</option>
              <option value="PAID">Pagado</option>
              <option value="EXPIRED">Caducado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Presupuestos ({quotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay presupuestos todavía</p>
              <p className="text-sm mt-2">Los presupuestos solicitados aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metros
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caduca
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => {
                    const isExpiringSoon = quote.expiresAt && new Date(quote.expiresAt) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    const isExpired = quote.expiresAt && new Date(quote.expiresAt) < new Date()

                    return (
                      <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/presupuestos/${quote.id}`}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            {quote.quoteNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {quote.customerName}
                            </p>
                            <p className="text-xs text-gray-500">{quote.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(quote.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {quote.estimatedMeters ? `${quote.estimatedMeters}m` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(quote.estimatedTotal)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(quote.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(quote.status)}
                              {getQuoteStatusText(quote.status)}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {quote.expiresAt ? (
                            <span className={`${isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}>
                              {formatDate(quote.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/presupuestos/${quote.id}`}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Ver detalles →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
