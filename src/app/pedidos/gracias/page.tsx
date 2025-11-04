"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { CheckCircle, Mail, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

function ThankYouContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const paymentStatus = searchParams.get('payment')

  useEffect(() => {
    // Aquí se pueden insertar los scripts de tracking
    // Google Analytics conversion tracking
    if (typeof window !== 'undefined' && orderNumber) {
      // Ejemplo de evento de Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: orderNumber,
          // Puedes añadir más parámetros según necesites
        })
      }

      // Aquí puedes añadir tu pixel de Facebook/Meta
      if ((window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          order_id: orderNumber,
        })
      }

      // Aquí puedes añadir otros píxeles de seguimiento
    }
  }, [orderNumber])

  useEffect(() => {
    // Redirigir a inicio si no hay orderNumber después de 2 segundos
    if (!orderNumber) {
      const timeout = setTimeout(() => {
        router.push('/')
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [orderNumber, router])

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardContent className="pt-12 pb-8">
            {/* Icono de éxito */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Título principal */}
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              ¡Gracias por tu pedido!
            </h1>

            {/* Número de pedido */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
              <p className="text-2xl font-bold text-primary-600">#{orderNumber}</p>
            </div>

            {/* Mensaje informativo */}
            <div className="space-y-4 mb-8">
              {/* Mensaje de pago exitoso si viene desde Stripe */}
              {paymentStatus === 'success' && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Pago procesado correctamente
                    </h3>
                    <p className="text-sm text-green-800">
                      Tu pago ha sido confirmado. Recibirás un email con la confirmación del pago.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Te mantendremos informado
                  </h3>
                  <p className="text-sm text-blue-800">
                    Recibirás actualizaciones sobre el estado de tu pedido por email.
                    Revisa tu bandeja de entrada y spam.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Procesando tu pedido
                  </h3>
                  <p className="text-sm text-green-800">
                    Nuestro equipo ya está trabajando en tu impresión DTF.
                    Te notificaremos cuando esté lista para enviar.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Link href={`/pedido/${orderNumber}`} className="block">
                <Button size="lg" className="w-full">
                  Ver detalles del pedido
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>

              <Link href="/" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  Volver al inicio
                </Button>
              </Link>
            </div>

            {/* Mensaje final */}
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">
                ¿Tienes alguna pregunta? Contacta con nosotros a través de{" "}
                <a href="mailto:info@loviprintdtf.es" className="text-primary-600 hover:underline font-medium">
                  info@loviprintdtf.es
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Recuerda que puedes seguir el estado de tu pedido en cualquier momento
            desde tu panel de control.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}
