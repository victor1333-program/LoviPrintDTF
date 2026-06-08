"use client"

import { useState } from "react"
import { Modal } from "./ui/Modal"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Label } from "./ui/Label"
import { MessageCircle } from "lucide-react"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { trackGenerateLead } from "@/lib/analytics"

interface B2BQuickQuoteModalProps {
  isOpen: boolean
  onClose: () => void
}

const initialState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  volume: "",
  message: "",
}

function buildMessage(data: typeof initialState): string {
  return [
    "Hola, soy un cliente empresa interesado en vuestros servicios DTF:",
    "",
    `• Nombre: ${data.name}`,
    `• Empresa: ${data.company}`,
    `• Email: ${data.email}`,
    `• Teléfono: ${data.phone}`,
    `• Volumen estimado: ${data.volume} metros/mes`,
    `• Mensaje: ${data.message || "—"}`,
    "",
    "¿Podríais mandarme una propuesta de precios y condiciones B2B?",
  ].join("\n")
}

export function B2BQuickQuoteModal({ isOpen, onClose }: B2BQuickQuoteModalProps) {
  const [data, setData] = useState(initialState)

  const handleChange = (field: keyof typeof initialState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setData((d) => ({ ...d, [field]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    trackGenerateLead("b2b_home_quickquote")
    const url = buildWhatsAppUrl(buildMessage(data))
    window.open(url, "_blank", "noopener,noreferrer")
    setData(initialState)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pedir presupuesto rápido por WhatsApp"
      maxWidth="lg"
    >
      <p className="text-sm text-gray-600 mb-4">
        Rellena estos datos y abriremos WhatsApp con el mensaje listo para enviar.
        Te respondemos en minutos en horario laboral.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="b2b-name">Tu nombre *</Label>
            <Input
              id="b2b-name"
              required
              value={data.name}
              onChange={handleChange("name")}
            />
          </div>
          <div>
            <Label htmlFor="b2b-company">Empresa *</Label>
            <Input
              id="b2b-company"
              required
              value={data.company}
              onChange={handleChange("company")}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="b2b-email">Email *</Label>
            <Input
              id="b2b-email"
              type="email"
              required
              value={data.email}
              onChange={handleChange("email")}
            />
          </div>
          <div>
            <Label htmlFor="b2b-phone">Teléfono *</Label>
            <Input
              id="b2b-phone"
              type="tel"
              required
              value={data.phone}
              onChange={handleChange("phone")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="b2b-volume">Volumen estimado (metros/mes) *</Label>
          <Input
            id="b2b-volume"
            type="number"
            min={1}
            required
            value={data.volume}
            onChange={handleChange("volume")}
          />
        </div>
        <div>
          <Label htmlFor="b2b-message">Mensaje (opcional)</Label>
          <textarea
            id="b2b-message"
            rows={3}
            value={data.message}
            onChange={handleChange("message")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Cuéntanos brevemente tu caso de uso"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="sm:flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="sm:flex-1 bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar por WhatsApp
          </Button>
        </div>
        <p className="text-xs text-gray-500 text-center pt-1">
          Se abrirá WhatsApp con el mensaje pre-formateado. Solo tendrás que pulsar enviar.
        </p>
      </form>
    </Modal>
  )
}
