"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { MessageCircle } from "lucide-react"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { trackGenerateLead } from "@/lib/analytics"

const GARMENT_OPTIONS = [
  { value: "", label: "Selecciona una opción" },
  { value: "Camiseta", label: "Camiseta" },
  { value: "Sudadera", label: "Sudadera" },
  { value: "Polo", label: "Polo" },
  { value: "Gorra", label: "Gorra" },
  { value: "Bolsa", label: "Bolsa" },
  { value: "Otro", label: "Otro" },
]

const BACKGROUND_OPTIONS = [
  { value: "blanco", label: "Fondo blanco" },
  { value: "transparente", label: "Fondo transparente" },
  { value: "no sabe", label: "No estoy seguro" },
] as const

interface FormState {
  garment: string
  quantity: string
  widthCm: string
  heightCm: string
  background: "blanco" | "transparente" | "no sabe"
  comment: string
}

const initialState: FormState = {
  garment: "",
  quantity: "",
  widthCm: "",
  heightCm: "",
  background: "blanco",
  comment: "",
}

function buildMessage(data: FormState): string {
  return [
    "Hola, me interesa un presupuesto DTF con estos datos:",
    `• Tipo de prenda: ${data.garment}`,
    `• Cantidad de prendas: ${data.quantity}`,
    `• Tamaño del diseño: ${data.widthCm} x ${data.heightCm} cm`,
    `• Fondo del diseño: ${data.background}`,
    `• Comentarios: ${data.comment.trim() || "—"}`,
    "¿Cuántos metros necesito y cuál sería el precio total?",
  ].join("\n")
}

export function DtfQuickEstimateForm() {
  const [data, setData] = useState<FormState>(initialState)

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setData((d) => ({ ...d, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    trackGenerateLead("dtf_calculator_v1")
    const url = buildWhatsAppUrl(buildMessage(data))
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="calc-garment">Tipo de prenda *</Label>
        <Select
          id="calc-garment"
          required
          options={GARMENT_OPTIONS}
          value={data.garment}
          onChange={(e) => setField("garment", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="calc-quantity">Cantidad de prendas *</Label>
        <Input
          id="calc-quantity"
          type="number"
          min={1}
          required
          placeholder="Ej. 50"
          value={data.quantity}
          onChange={(e) => setField("quantity", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="calc-width">Ancho del diseño (cm) *</Label>
          <Input
            id="calc-width"
            type="number"
            min={5}
            max={50}
            required
            placeholder="5-50"
            value={data.widthCm}
            onChange={(e) => setField("widthCm", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="calc-height">Alto del diseño (cm) *</Label>
          <Input
            id="calc-height"
            type="number"
            min={5}
            max={50}
            required
            placeholder="5-50"
            value={data.heightCm}
            onChange={(e) => setField("heightCm", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="mb-2">¿Tu diseño tiene fondo blanco o transparente? *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BACKGROUND_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                data.background === opt.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="background"
                value={opt.value}
                checked={data.background === opt.value}
                onChange={() => setField("background", opt.value)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="calc-comment">Comentarios (opcional)</Label>
        <textarea
          id="calc-comment"
          rows={3}
          value={data.comment}
          onChange={(e) => setField("comment", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Cualquier detalle que nos quieras contar"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Calcular y solicitar presupuesto
      </Button>
      <p className="text-xs text-gray-500 text-center">
        Se abrirá WhatsApp con tus datos pre-formateados. Te respondemos en minutos en horario laboral.
      </p>
    </form>
  )
}
