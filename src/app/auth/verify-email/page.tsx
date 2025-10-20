"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificación no válido')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        if (data.alreadyVerified) {
          setStatus('already-verified')
          setMessage('Este email ya ha sido verificado anteriormente')
        } else {
          setStatus('success')
          setMessage('¡Tu cuenta ha sido confirmada exitosamente!')
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Error al verificar el email')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error al conectar con el servidor')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-56">
            <Image
              src="/logo.png"
              alt="LoviPrintDTF"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Content based on status */}
        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando tu email...
            </h1>
            <p className="text-gray-600">
              Por favor espera un momento
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Cuenta Confirmada!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Siguiente paso:</strong>
              </p>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Inicia sesión con tu email y contraseña</li>
                <li>Ve a "Mi Cuenta" para completar tu perfil</li>
                <li>Añade tus datos de facturación y direcciones</li>
              </ol>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Ir al Inicio e Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        {status === 'already-verified' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Ya Verificado
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Inicia sesión para acceder a tu cuenta y gestionar tus pedidos.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Ir al Inicio e Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error al Verificar
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Posibles causas:</strong>
              </p>
              <ul className="text-sm text-yellow-800 mt-2 list-disc list-inside text-left">
                <li>El enlace ha expirado (válido por 24 horas)</li>
                <li>El enlace ya fue utilizado</li>
                <li>El enlace no es válido</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Volver al Inicio
              </Button>
              <p className="text-sm text-gray-600">
                ¿Necesitas ayuda?{' '}
                <a href="/contacto" className="text-orange-600 hover:text-orange-700 font-medium">
                  Contáctanos
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cargando...
            </h1>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
