'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from './ui/Button'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Comprobar si el usuario ya aceptó las cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted')
    if (!cookiesAccepted) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true')
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookiesAccepted', 'false')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-gray-200 shadow-2xl animate-slide-up">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-sm text-gray-700">
            <p className="font-semibold mb-2">🍪 Este sitio web utiliza cookies</p>
            <p>
              Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias.
              Si continúa navegando, consideramos que acepta su uso.{' '}
              <Link href="/cookies" className="text-primary-600 hover:text-primary-700 underline font-medium">
                Más información sobre cookies
              </Link>
            </p>
          </div>

          <div className="flex gap-3 items-center flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectCookies}
              className="whitespace-nowrap"
            >
              Rechazar
            </Button>
            <Button
              onClick={acceptCookies}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
            >
              Aceptar cookies
            </Button>
            <button
              onClick={rejectCookies}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
