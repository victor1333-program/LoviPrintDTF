"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Building2, X } from "lucide-react"

const B2B_GREETING = "¡Hola! 👋\n\n¿Representas a una empresa y necesitas impresión DTF al por mayor?\n\nTenemos precios especiales, presupuestos personalizados y gestión dedicada para clientes B2B."
const B2B_MESSAGE = "Hola, represento a una empresa y estoy interesado en vuestros servicios de impresión DTF. ¿Podrías darme más información sobre precios y condiciones B2B?"

export function B2BContactWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [isVisible, setIsVisible] = useState(false)

  const isAdminRoute = pathname?.startsWith("/admin") ?? false

  useEffect(() => {
    if (isAdminRoute) {
      setIsVisible(false)
      return
    }

    const loadConfig = async () => {
      try {
        const [enabledRes, numberRes] = await Promise.all([
          fetch("/api/settings?key=whatsapp_enabled"),
          fetch("/api/settings?key=whatsapp_number"),
        ])

        const [enabled, number] = await Promise.all([
          enabledRes.json(),
          numberRes.json(),
        ])

        const phone = number.value || ""
        setPhoneNumber(phone)
        setIsVisible(enabled.value === "true" && !!phone)
      } catch (error) {
        console.error("Error loading B2B widget config:", error)
        setIsVisible(false)
      }
    }

    loadConfig()
  }, [isAdminRoute])

  const handleOpenChat = () => {
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[\s\-+]/g, "")
      const message = encodeURIComponent(B2B_MESSAGE)
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank")
    }
    setIsOpen(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen && (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-lg shadow-2xl border border-gray-200 animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Atención a Empresas</h3>
                <p className="text-orange-100 text-sm">Presupuestos a medida</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-orange-600 rounded-full p-1 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-gray-800 text-sm whitespace-pre-wrap">
                {B2B_GREETING}
              </p>
            </div>

            <button
              onClick={handleOpenChat}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Building2 className="h-5 w-5" />
              Contactar con ventas
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Serás redirigido a WhatsApp
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-0 p-3.5 sm:gap-3 sm:pl-5 sm:pr-6 sm:py-4"
        aria-label="Contacto para empresas"
      >
        {isOpen ? (
          <X className="h-6 w-6 flex-shrink-0" />
        ) : (
          <Building2 className="h-6 w-6 flex-shrink-0" />
        )}
        <span className="hidden sm:inline font-semibold text-sm sm:text-base whitespace-nowrap">
          {isOpen ? "Cerrar" : "Si eres empresa, Contáctanos"}
        </span>
      </button>

      {!isOpen && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
        </span>
      )}
    </div>
  )
}
