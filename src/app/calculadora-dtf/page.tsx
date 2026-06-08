import type { Metadata } from "next"
import Link from "next/link"
import { Calculator, ArrowLeft, Sparkles } from "lucide-react"
import { DtfQuickEstimateForm } from "@/components/calculator/DtfQuickEstimateForm"

export const metadata: Metadata = {
  title: "Calculadora de metros DTF | LoviPrintDTF",
  description:
    "¿No sabes cuántos metros de transfer DTF necesitas? Rellena los datos de tu proyecto y te calculamos los metros y el precio total por WhatsApp en minutos.",
  alternates: {
    canonical: "/calculadora-dtf",
  },
}

export default function CalculadoraDtfPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Gratis y sin compromiso</span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-3">
              <Calculator className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Calculadora de metros DTF
              </h1>
            </div>
            <p className="text-gray-600">
              Cuéntanos cómo es tu proyecto y te decimos cuántos metros necesitas y cuánto te
              costaría. Te respondemos por WhatsApp en minutos.
            </p>
          </div>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <DtfQuickEstimateForm />
          </section>

          <p className="text-xs text-gray-500 text-center mt-6">
            Esta herramienta no calcula precios automáticamente. Un humano revisa tu mensaje y
            te responde teniendo en cuenta optimización de gang sheet, tipo de fondo y descuentos
            por volumen.
          </p>
        </div>
      </div>
    </main>
  )
}
