'use client'

import { FileUp, CheckCircle, Printer, Truck, Sparkles } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import Link from 'next/link'

interface ProcessStep {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  time: string
  color: string
}

export function OrderProcessSection() {
  const steps: ProcessStep[] = [
    {
      id: 1,
      icon: <FileUp className="w-12 h-12" />,
      title: 'Envía tu Diseño',
      description: 'Sube tu archivo en PNG, PDF, AI o SVG. Nuestro equipo lo revisa y optimiza para garantizar la mejor calidad de impresión.',
      time: '1 hora',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      icon: <CheckCircle className="w-12 h-12" />,
      title: 'Confirmación',
      description: 'Revisamos tu pedido y te enviamos una prueba digital para tu aprobación. Puedes solicitar ajustes sin coste adicional.',
      time: '2 horas',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 3,
      icon: <Printer className="w-12 h-12" />,
      title: 'Producción DTF',
      description: 'Imprimimos tu diseño con tecnología DTF de última generación. Colores vibrantes, alta resolución y máxima durabilidad.',
      time: '9 horas',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 4,
      icon: <Truck className="w-12 h-12" />,
      title: 'Envío Express',
      description: 'Empaquetamos cuidadosamente tu pedido y lo enviamos por mensajería express. Seguimiento en tiempo real incluido.',
      time: '12 horas',
      color: 'from-green-500 to-green-600'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="warning" className="mb-4 bg-primary-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Proceso de Pedido
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            De tu <span className="text-primary-400">Diseño</span> a tu Puerta
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Un proceso simple y transparente. En pocos días tendrás tus impresiones DTF de calidad profesional
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-green-500 opacity-30"></div>

            {steps.map((step, index) => (
              <div key={step.id} className="relative h-full">
                {/* Step card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full flex flex-col">
                  {/* Icon circle */}
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg relative z-10`}>
                    <div className="text-white">
                      {step.icon}
                    </div>
                  </div>

                  {/* Step number */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                    {step.id}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2 text-center">
                    {step.title}
                  </h3>

                  <div className="text-center mb-4">
                    <Badge className="bg-white/20 text-white text-xs">
                      ⏱️ {step.time}
                    </Badge>
                  </div>

                  <p className="text-gray-300 text-sm text-center leading-relaxed flex-1">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 -right-4 text-white/30">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Arrow connector for mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center py-4 text-white/30">
                    <svg className="w-8 h-8 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total time badge */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 rounded-full px-8 py-4 shadow-2xl">
              <p className="text-sm text-primary-100 mb-1">Tiempo Total</p>
              <p className="text-3xl font-black">24 horas</p>
              <p className="text-sm text-primary-100 mt-1">En tu puerta</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link href="/productos/transfer-dtf">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-2xl hover:shadow-primary-500/50 transform hover:scale-110 transition-all duration-300 hover:-translate-y-1 font-bold text-lg px-8 py-6"
              >
                <Sparkles className="h-6 w-6 mr-2 animate-pulse" />
                Empezar Ahora
              </Button>
            </Link>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-4xl mb-2">✅</div>
            <h4 className="font-bold mb-2">Sin Cantidad Mínima</h4>
            <p className="text-sm text-gray-300">Desde 0.5 m², perfecto para proyectos pequeños y grandes</p>
          </div>

          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-4xl mb-2">🔄</div>
            <h4 className="font-bold mb-2">Revisión Gratuita</h4>
            <p className="text-sm text-gray-300">Optimizamos tu diseño sin coste para la mejor calidad</p>
          </div>

          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-4xl mb-2">📞</div>
            <h4 className="font-bold mb-2">Soporte Continuo</h4>
            <p className="text-sm text-gray-300">Te acompañamos en cada paso del proceso</p>
          </div>
        </div>
      </div>
    </section>
  )
}
