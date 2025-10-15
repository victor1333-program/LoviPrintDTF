import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CheckCircle2, Download, Home, Mail } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: {
      orderNumber: id,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pedido Realizado con Éxito!
            </h1>
            <p className="text-gray-600">
              Hemos recibido tu pedido y comenzaremos a procesarlo pronto
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader className="bg-primary-50 border-b">
              <CardTitle className="flex items-center justify-between">
                <span>Pedido {order.orderNumber}</span>
                <span className="text-sm font-normal text-gray-600">
                  {formatDate(order.createdAt)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Resumen del Pedido
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metros solicitados:</span>
                      <span className="font-semibold">
                        {order.metersOrdered ? order.metersOrdered.toString() + 'm' : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio por metro:</span>
                      <span className="font-semibold">
                        {formatCurrency(Number(order.pricePerMeter))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">
                        {formatCurrency(Number(order.subtotal))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA (21%):</span>
                      <span className="font-semibold">
                        {formatCurrency(Number(order.taxAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío:</span>
                      <span className="font-semibold">
                        {formatCurrency(Number(order.shippingCost))}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(Number(order.totalPrice))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Información de Contacto
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <p className="font-semibold">{order.customerName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-semibold">{order.customerEmail}</p>
                    </div>
                    {order.customerPhone && (
                      <div>
                        <span className="text-sm text-gray-600">Teléfono:</span>
                        <p className="font-semibold">{order.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Dirección de Envío
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold">
                        {(order.shippingAddress as any).address}
                      </p>
                      <p className="text-gray-600">
                        {(order.shippingAddress as any).postalCode}{' '}
                        {(order.shippingAddress as any).city}
                      </p>
                    </div>
                  </div>
                )}

                {/* Design File */}
                {order.designFileUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Archivo de Diseño
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{order.designFileName}</p>
                        <p className="text-sm text-gray-600">
                          Archivo subido correctamente
                        </p>
                      </div>
                      <a
                        href={order.designFileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>¿Qué sigue?</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">Confirmación por Email</p>
                    <p className="text-sm text-gray-600">
                      Recibirás un email de confirmación en {order.customerEmail}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Producción</p>
                    <p className="text-sm text-gray-600">
                      Comenzaremos a producir tu film DTF en las próximas horas
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Envío</p>
                    <p className="text-sm text-gray-600">
                      Recibirás tu pedido en 24-48 horas laborables
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" size="lg">
                <Home className="h-5 w-5 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
            <a href={`mailto:${order.customerEmail}`}>
              <Button size="lg">
                <Mail className="h-5 w-5 mr-2" />
                Contactar Soporte
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
