'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react'
import { Badge } from './ui/Badge'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: 'general' | 'tecnico' | 'pedidos' | 'bonos'
}

export function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      id: 1,
      category: 'general',
      question: '¿Qué es la impresión DTF?',
      answer: 'DTF (Direct to Film) es una tecnología de impresión que permite transferir diseños de alta calidad a textiles. Se imprime el diseño en un film especial con tintas de colores vibrantes, se aplica polvo adhesivo y luego se transfiere al tejido con calor. El resultado es una impresión duradera, elástica y con colores brillantes que resiste más de 50 lavados.'
    },
    {
      id: 2,
      category: 'tecnico',
      question: '¿Qué ventajas tiene DTF sobre otras técnicas como serigrafía o vinilo?',
      answer: 'DTF ofrece varias ventajas: permite colores ilimitados sin coste adicional, no tiene cantidad mínima de pedido, funciona en cualquier tipo de tejido (incluso oscuros), tiene mejor elasticidad que el vinilo, es más económico que serigrafía para cantidades pequeñas y medianas, y permite reproducir fotografías y degradados con calidad fotográfica.'
    },
    {
      id: 3,
      category: 'tecnico',
      question: '¿En qué tipos de tela puedo usar DTF?',
      answer: 'DTF funciona en prácticamente todos los tejidos: algodón 100%, poliéster, mezclas de algodón-poliéster, nylon, lycra, canvas, e incluso cuero sintético. Funciona tanto en tejidos claros como oscuros, obteniendo colores brillantes en ambos casos. No recomendamos su uso en tejidos con tratamientos impermeables.'
    },
    {
      id: 4,
      category: 'pedidos',
      question: '¿Cuál es el tiempo de producción y envío?',
      answer: 'Nuestro tiempo de producción estándar es de 24-48 horas laborables una vez confirmado el pedido y recibidos los archivos. El envío urgente puede estar disponible bajo petición. Los envíos se realizan mediante mensajería express y suelen llegar en 24-48h adicionales en península.'
    },
    {
      id: 5,
      category: 'pedidos',
      question: '¿Qué formato deben tener mis diseños?',
      answer: 'Aceptamos archivos en PNG, PDF, AI, EPS o SVG con fondo transparente. Recomendamos una resolución mínima de 300 DPI para garantizar la mejor calidad. Si tienes dudas sobre tu archivo, nuestro equipo puede revisarlo antes de producción sin coste adicional. También ofrecemos servicio de diseño si lo necesitas.'
    },
    {
      id: 6,
      category: 'pedidos',
      question: '¿Tienen cantidad mínima de pedido?',
      answer: 'No tenemos cantidad mínima. Puedes pedir desde 0.5 m² (aproximadamente 3 diseños A4). Sin embargo, ten en cuenta que los descuentos por volumen empiezan a partir de 1 m², por lo que cantidades mayores tienen mejor precio por metro cuadrado.'
    },
    {
      id: 7,
      category: 'bonos',
      question: '¿Cómo funcionan los bonos prepagados?',
      answer: 'Los bonos son paquetes de metros cuadrados que compras por adelantado con descuento. Por ejemplo, el Bono Starter incluye 10 m² por 150€ (15€/m² vs 18€/m² precio normal). Puedes usar los metros cuando quieras durante el período de validez (6-12 meses según el bono). Ideal si haces pedidos con frecuencia o sabes que vas a necesitar cierta cantidad.'
    },
    {
      id: 8,
      category: 'bonos',
      question: '¿Los bonos tienen fecha de caducidad?',
      answer: 'Sí, los bonos tienen validez según el tipo: Bono Starter (10m²) válido 6 meses, Bono Pro (25m²) válido 9 meses, y Bono Business (50m²) válido 12 meses. Recibirás notificaciones antes de que caduque tu bono. Los metros no se pueden transferir ni reembolsar una vez adquiridos.'
    },
    {
      id: 9,
      category: 'general',
      question: '¿Ofrecen descuentos para profesionales?',
      answer: 'Sí, tenemos un programa especial para profesionales con descuentos adicionales del 10-30% dependiendo del volumen mensual. Para acceder, regístrate como usuario profesional en nuestra web y nos pondremos en contacto contigo para validar tu actividad y activar tus descuentos permanentes.'
    },
    {
      id: 10,
      category: 'tecnico',
      question: '¿Cómo se aplica la transferencia DTF al tejido?',
      answer: 'La aplicación es muy sencilla: precalienta la prensa térmica a 160-170°C, coloca la transferencia sobre el tejido con el diseño hacia abajo, prensa durante 10-15 segundos con presión media-alta, deja enfriar y retira el film en frío (peel cold). Te enviaremos instrucciones detalladas con tu pedido y tenemos vídeos tutoriales en nuestra web.'
    }
  ]

  const categories = {
    general: { name: 'General', color: 'bg-blue-100 text-blue-800' },
    tecnico: { name: 'Técnico', color: 'bg-purple-100 text-purple-800' },
    pedidos: { name: 'Pedidos', color: 'bg-green-100 text-green-800' },
    bonos: { name: 'Bonos', color: 'bg-yellow-100 text-yellow-800' }
  }

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="warning" className="mb-4">
            <HelpCircle className="h-3 w-3 mr-1" />
            Preguntas Frecuentes
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Tienes <span className="text-primary-600">Dudas</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Resolvemos las preguntas más comunes sobre impresión DTF, pedidos y bonos
          </p>
        </div>

        {/* FAQ Accordion - Dos columnas */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-x-6 gap-y-6 items-start">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg self-start"
            >
              {/* Pregunta */}
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`text-xs ${categories[faq.category].color}`}>
                      {categories[faq.category].name}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    openId === faq.id ? 'transform rotate-180 text-primary-600' : ''
                  }`}
                />
              </button>

              {/* Respuesta */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openId === faq.id ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 pt-2">
                  <div className="pl-4 border-l-4 border-primary-400">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA adicional */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ¿No encuentras la respuesta que buscas?
          </p>
          <a
            href="/contacto"
            className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Contáctanos y te ayudamos
          </a>
        </div>
      </div>
    </section>
  )
}
