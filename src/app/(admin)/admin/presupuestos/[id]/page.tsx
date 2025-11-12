import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { getQuoteStatusText, getQuoteStatusColor } from "@/lib/quotes"
import QuoteActions from "@/components/admin/QuoteActions"

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

function formatDate(date: Date | null) {
  if (!date) return '-'
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

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quoteRaw = await prisma.quote.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      shippingMethod: true,
      order: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              pdfUrl: true,
            },
          },
        },
      },
    },
  })

  if (!quoteRaw) {
    notFound()
  }

  // Serializar Decimals
  const quote = {
    ...quoteRaw,
    estimatedMeters: quoteRaw.estimatedMeters ? Number(quoteRaw.estimatedMeters) : null,
    pricePerMeter: quoteRaw.pricePerMeter ? Number(quoteRaw.pricePerMeter) : null,
    cuttingPrice: quoteRaw.cuttingPrice ? Number(quoteRaw.cuttingPrice) : null,
    layoutPrice: quoteRaw.layoutPrice ? Number(quoteRaw.layoutPrice) : null,
    priorityPrice: quoteRaw.priorityPrice ? Number(quoteRaw.priorityPrice) : null,
    shippingCost: quoteRaw.shippingCost ? Number(quoteRaw.shippingCost) : null,
    subtotal: quoteRaw.subtotal ? Number(quoteRaw.subtotal) : null,
    taxAmount: quoteRaw.taxAmount ? Number(quoteRaw.taxAmount) : null,
    estimatedTotal: quoteRaw.estimatedTotal ? Number(quoteRaw.estimatedTotal) : null,
  }

  const isExpired = quote.expiresAt && new Date(quote.expiresAt) < new Date()
  const isExpiringSoon = quote.expiresAt && new Date(quote.expiresAt) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/presupuestos"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a presupuestos
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {quote.quoteNumber}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Solicitud de presupuesto
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(quote.status)} className="text-base px-4 py-2">
            {getQuoteStatusText(quote.status)}
          </Badge>
        </div>
      </div>

      {/* Alertas */}
      {isExpired && quote.status !== 'PAID' && quote.status !== 'EXPIRED' && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Presupuesto caducado</p>
                <p className="text-sm text-red-700">
                  Este presupuesto venció el {formatDate(quote.expiresAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isExpiringSoon && !isExpired && quote.status !== 'PAID' && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-900">Caduca pronto</p>
                <p className="text-sm text-yellow-700">
                  Este presupuesto caducará el {formatDate(quote.expiresAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {quote.status === 'PAID' && quote.orderId && (
        <Card className="mb-6 border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Presupuesto pagado</p>
                <p className="text-sm text-green-700">
                  Convertido a pedido{' '}
                  <Link
                    href={`/admin/pedidos/${quote.orderId}`}
                    className="font-medium underline hover:text-green-900"
                  >
                    {quote.order?.orderNumber}
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{quote.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${quote.customerEmail}`}
                    className="font-medium text-purple-600 hover:underline"
                  >
                    {quote.customerEmail}
                  </a>
                </div>
              </div>
              {quote.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <a
                      href={`tel:${quote.customerPhone}`}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      {quote.customerPhone}
                    </a>
                  </div>
                </div>
              )}
              {quote.user && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-1">Usuario registrado</p>
                  <Link
                    href={`/admin/usuarios?search=${quote.user.email}`}
                    className="text-sm font-medium text-purple-600 hover:underline"
                  >
                    Ver perfil de usuario →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diseño subido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Diseño Subido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{quote.designFileName}</p>
                      <p className="text-sm text-gray-500">
                        Subido el {formatDate(quote.createdAt)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={quote.designFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas del cliente */}
          {quote.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{quote.customerNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Cotización */}
          {quote.estimatedMeters && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Cotización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metros calculados</span>
                    <span className="font-medium">{quote.estimatedMeters}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio por metro</span>
                    <span className="font-medium">{formatCurrency(quote.pricePerMeter)}/m</span>
                  </div>

                  {(quote.needsCutting || quote.needsLayout || quote.isPriority) && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Extras:</p>
                      {quote.needsCutting && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">• Corte</span>
                          <span>{formatCurrency(quote.cuttingPrice)}</span>
                        </div>
                      )}
                      {quote.needsLayout && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">• Maquetación</span>
                          <span>{formatCurrency(quote.layoutPrice)}</span>
                        </div>
                      )}
                      {quote.isPriority && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">• Priorización</span>
                          <span>{formatCurrency(quote.priorityPrice)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {quote.shippingMethod && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Envío - {quote.shippingMethod.name}</span>
                        <span>{formatCurrency(quote.shippingCost)}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(quote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA (21%)</span>
                      <span>{formatCurrency(quote.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-purple-600">{formatCurrency(quote.estimatedTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas internas */}
          {quote.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Internas (Admin)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{quote.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Acciones */}
          <QuoteActions quote={quote} />

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Creado</p>
                <p className="font-medium">{formatDate(quote.createdAt)}</p>
              </div>
              {quote.expiresAt && (
                <div>
                  <p className="text-gray-500">Caduca</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}`}>
                    {formatDate(quote.expiresAt)}
                  </p>
                </div>
              )}
              {quote.convertedAt && (
                <div>
                  <p className="text-gray-500">Convertido</p>
                  <p className="font-medium">{formatDate(quote.convertedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de pago */}
          {quote.paymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle>Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Método</p>
                  <p className="font-medium">
                    {quote.paymentMethod === 'STRIPE' && 'Stripe (Tarjeta)'}
                    {quote.paymentMethod === 'BIZUM' && 'Bizum'}
                    {quote.paymentMethod === 'TRANSFER' && 'Transferencia'}
                    {!['STRIPE', 'BIZUM', 'TRANSFER'].includes(quote.paymentMethod) && quote.paymentMethod}
                  </p>
                </div>
                {quote.stripePaymentId && (
                  <div>
                    <p className="text-gray-500">ID de pago</p>
                    <p className="font-mono text-xs">{quote.stripePaymentId}</p>
                  </div>
                )}
                {quote.paymentLinkUrl && (
                  <div>
                    <p className="text-gray-500 mb-2">Enlace de pago</p>
                    <a
                      href={quote.paymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline text-xs break-all"
                    >
                      Ver enlace →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
