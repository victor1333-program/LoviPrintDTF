"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando pago...')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('No se encontró la sesión de pago')
      setTimeout(() => router.push('/'), 3000)
      return
    }

    // Verificar el estado del pago con Stripe
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payments/verify-session?session_id=${sessionId}`)

        if (!response.ok) {
          throw new Error('Error al verificar el pago')
        }

        const data = await response.json()

        if (data.success && data.orderNumber) {
          setStatus('success')
          setMessage('Pago confirmado. Redirigiendo...')

          // Redirigir a página de gracias con el número de pedido
          setTimeout(() => {
            router.push(`/pedidos/gracias?order=${data.orderNumber}&payment=success`)
          }, 2000)
        } else {
          throw new Error('No se pudo confirmar el pago')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('error')
        setMessage('Hubo un problema al verificar tu pago. Por favor, contacta con soporte.')

        // Redirigir al inicio después de mostrar el error
        setTimeout(() => router.push('/'), 5000)
      }
    }

    verifyPayment()
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-12 pb-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Verificando tu pago
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-3">
                ¡Pago Exitoso!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-3">
                Error en la verificación
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-center gap-1">
              <div className={`h-2 w-2 rounded-full ${status === 'loading' ? 'bg-blue-500 animate-pulse' : status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className={`h-2 w-2 rounded-full ${status === 'loading' ? 'bg-blue-500 animate-pulse delay-75' : status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className={`h-2 w-2 rounded-full ${status === 'loading' ? 'bg-blue-500 animate-pulse delay-150' : status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
