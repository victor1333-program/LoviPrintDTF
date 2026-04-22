"use client"

import { useEffect, useState } from "react"
import { MessageCircle, X } from "lucide-react"

interface WhatsAppConfig {
  enabled: boolean
  phoneNumber: string
  message: string
  greeting: string
}

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Cargar configuración completa de WhatsApp
    const loadConfig = async () => {
      try {
        const [enabledRes, numberRes, messageRes, greetingRes] = await Promise.all([
          fetch('/api/settings?key=whatsapp_enabled'),
          fetch('/api/settings?key=whatsapp_number'),
          fetch('/api/settings?key=whatsapp_message'),
          fetch('/api/settings?key=whatsapp_greeting')
        ])

        const [enabled, number, message, greeting] = await Promise.all([
          enabledRes.json(),
          numberRes.json(),
          messageRes.json(),
          greetingRes.json()
        ])

        const whatsappConfig: WhatsAppConfig = {
          enabled: enabled.value === 'true',
          phoneNumber: number.value || '',
          message: message.value || 'Hola, necesito información sobre los servicios de impresión DTF',
          greeting: greeting.value || '¡Hola! 👋\n\n¿Necesitas ayuda con tu pedido de impresión DTF?\n\nEstamos aquí para ayudarte.'
        }

        setConfig(whatsappConfig)
        // Solo mostrar si está habilitado y hay número configurado
        setIsVisible(whatsappConfig.enabled && !!whatsappConfig.phoneNumber)
      } catch (error) {
        console.error('Error loading WhatsApp config:', error)
        setIsVisible(false)
      }
    }

    loadConfig()
  }, [])

  const handleOpenChat = () => {
    if (config?.phoneNumber) {
      // Limpiar el número: eliminar espacios, guiones y el símbolo +
      const cleanNumber = config.phoneNumber.replace(/[\s\-+]/g, '')
      const message = encodeURIComponent(config.message)
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank')
    }
    setIsOpen(false)
  }

  // No renderizar si no está visible o no hay configuración
  if (!isVisible || !config) {
    return null
  }

  return (
    <>
      {/* Widget flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Popup de mensaje */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 mb-2 animate-in slide-in-from-bottom-5">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">LoviPrintDTF</h3>
                  <p className="text-green-100 text-sm">Normalmente responde en minutos</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-green-600 rounded-full p-1 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-gray-800 text-sm whitespace-pre-wrap">
                  {config.greeting}
                </p>
              </div>

              <button
                onClick={handleOpenChat}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Iniciar conversación
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Serás redirigido a WhatsApp
              </p>
            </div>
          </div>
        )}

        {/* Botón flotante */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Abrir WhatsApp"
        >
          {isOpen ? (
            <X className="h-7 w-7" />
          ) : (
            <MessageCircle className="h-7 w-7" />
          )}
        </button>

        {/* Indicador de en línea */}
        {!isOpen && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
        )}
      </div>
    </>
  )
}
