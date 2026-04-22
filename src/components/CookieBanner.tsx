'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { getStoredConsent, saveConsent } from '@/lib/consent'

interface CategoryState {
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

const ACCEPT_ALL: CategoryState = { analytics: true, marketing: true, personalization: true }
const REJECT_ALL: CategoryState = { analytics: false, marketing: false, personalization: false }

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [prefs, setPrefs] = useState<CategoryState>(ACCEPT_ALL)

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      setShowBanner(true)
    } else {
      setPrefs({
        analytics: stored.analytics,
        marketing: stored.marketing,
        personalization: stored.personalization,
      })
    }

    const openHandler = () => {
      const current = getStoredConsent()
      if (current) {
        setPrefs({
          analytics: current.analytics,
          marketing: current.marketing,
          personalization: current.personalization,
        })
      }
      setShowPreferences(true)
    }
    window.addEventListener('lovi:open-cookie-preferences', openHandler)
    return () => window.removeEventListener('lovi:open-cookie-preferences', openHandler)
  }, [])

  const commit = (state: CategoryState) => {
    saveConsent(state)
    setPrefs(state)
    setShowBanner(false)
    setShowPreferences(false)
  }

  const acceptAll = () => commit(ACCEPT_ALL)
  const rejectAll = () => commit(REJECT_ALL)
  const savePrefs = () => commit(prefs)

  return (
    <>
      {showBanner && !showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-gray-200 shadow-2xl animate-slide-up">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 text-sm text-gray-700">
                <p className="font-semibold mb-2">🍪 Este sitio web utiliza cookies</p>
                <p>
                  Utilizamos cookies propias y de terceros para analítica, publicidad y personalización.
                  Puedes aceptarlas todas, rechazar las no esenciales o configurar tus preferencias.
                  Las cookies técnicas se instalan siempre. Más información en nuestra{' '}
                  <Link href="/cookies" className="text-primary-600 hover:text-primary-700 underline font-medium">
                    Política de Cookies
                  </Link>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                  className="whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
                <Button variant="outline" size="sm" onClick={rejectAll} className="whitespace-nowrap">
                  Rechazar
                </Button>
                <Button
                  onClick={acceptAll}
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
                >
                  Aceptar todo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowPreferences(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Preferencias de cookies</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Personaliza qué tipos de cookies aceptas. Tu decisión se guarda durante 12 meses.
                Puedes cambiarla en cualquier momento desde la{' '}
                <Link href="/cookies" className="text-primary-600 hover:underline">
                  Política de Cookies
                </Link>.
              </p>

              <CategoryRow
                title="Cookies técnicas (necesarias)"
                description="Imprescindibles para el funcionamiento del sitio: sesión, carrito, seguridad. No se pueden desactivar."
                checked={true}
                disabled
                onChange={() => {}}
              />

              <CategoryRow
                title="Cookies analíticas"
                description="Nos permiten medir el uso del sitio (Google Analytics) para mejorar nuestros servicios. Anónimas y agregadas."
                checked={prefs.analytics}
                onChange={(v) => setPrefs({ ...prefs, analytics: v })}
              />

              <CategoryRow
                title="Cookies de marketing"
                description="Utilizadas por Google Ads y otras plataformas publicitarias para mostrarte anuncios relevantes dentro y fuera del sitio."
                checked={prefs.marketing}
                onChange={(v) => setPrefs({ ...prefs, marketing: v })}
              />

              <CategoryRow
                title="Cookies de personalización"
                description="Recuerdan tus preferencias (idioma, región, contenido visto) para ofrecerte una experiencia adaptada."
                checked={prefs.personalization}
                onChange={(v) => setPrefs({ ...prefs, personalization: v })}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 p-6 border-t bg-gray-50 sticky bottom-0">
              <Button variant="outline" onClick={rejectAll} className="flex-1">
                Rechazar todo
              </Button>
              <Button variant="outline" onClick={savePrefs} className="flex-1">
                Guardar preferencias
              </Button>
              <Button
                onClick={acceptAll}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
              >
                Aceptar todo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className={`border rounded-lg p-4 ${disabled ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-300 ${
              disabled
                ? 'bg-primary-300 cursor-not-allowed'
                : 'bg-gray-200 peer-checked:bg-primary-600'
            } after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`}
          />
        </label>
      </div>
    </div>
  )
}
