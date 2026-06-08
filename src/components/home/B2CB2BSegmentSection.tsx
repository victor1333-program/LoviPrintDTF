"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  ShoppingCart,
  Building2,
  MessageCircle,
  CheckCircle2,
  FileUp,
  ArrowRight,
} from "lucide-react"
import { B2BQuickQuoteModal } from "@/components/B2BQuickQuoteModal"

export function B2CB2BSegmentSection() {
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false)

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="warning" className="mb-4">¿Qué tipo de cliente eres?</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Soluciones para <span className="text-primary-600">cada perfil</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Compra online directo o pídenos un presupuesto a medida si tu volumen lo merece.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* B2C */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Eres particular o pequeño cliente?</h3>
            </div>
            <p className="text-gray-600 mb-5">
              Compra online, recibe en 24-48h y paga con tarjeta. Todo automático, sin intermediarios.
            </p>
            <ul className="space-y-2 text-sm text-gray-700 mb-6 flex-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Desde 1 metro, sin mínimo de pedido</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Precios públicos por volumen ya con descuento</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Bonos prepagados sin caducidad</span>
              </li>
            </ul>
            <Link href="/productos/transfer-dtf" className="block">
              <Button size="lg" className="w-full">
                Comprar online
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* B2B */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-primary-300 p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary-600 text-white">Empresas</Badge>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Eres empresa o necesitas volumen?</h3>
            </div>
            <p className="text-gray-700 mb-5">
              Precios negociados, gestión dedicada y facturación a empresa. Te respondemos en minutos.
            </p>
            <ul className="space-y-2 text-sm text-gray-700 mb-6 flex-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <span>Tarifas escalonadas según volumen mensual</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <span>Factura, condiciones de pago y soporte directo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <span>Maquetación y producción priorizada</span>
              </li>
            </ul>
            <Button
              size="lg"
              onClick={() => setIsB2BModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Pedir presupuesto rápido por WhatsApp
            </Button>
            <Link
              href="/solicitar-presupuesto"
              className="mt-3 text-center text-sm text-primary-700 hover:text-primary-800 font-medium inline-flex items-center justify-center gap-1.5"
            >
              <FileUp className="h-4 w-4" />
              ¿Tienes los archivos listos? Pide presupuesto formal con upload →
            </Link>
          </div>
        </div>
      </div>

      <B2BQuickQuoteModal
        isOpen={isB2BModalOpen}
        onClose={() => setIsB2BModalOpen(false)}
      />
    </section>
  )
}
