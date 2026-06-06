import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { HelpCircle, Sparkles, MessageCircle } from "lucide-react"
import { FAQList, type FAQItem } from "@/components/FAQList"

export const metadata: Metadata = {
  title: "Preguntas Frecuentes sobre Impresión DTF | LoviPrintDTF",
  description: "Resuelve tus dudas sobre impresión DTF: técnica, pedidos, bonos, envíos y calidad. Tiempos de producción, métodos de pago, cuidados y mucho más.",
  keywords: ["FAQ DTF", "preguntas DTF", "impresión DTF dudas", "cómo funciona DTF", "tiempo producción DTF"],
  alternates: { canonical: "https://loviprintdtf.es/faq" },
  openGraph: {
    title: "Preguntas Frecuentes sobre Impresión DTF",
    description: "Encuentra respuestas rápidas a las preguntas más comunes sobre impresión DTF.",
    url: "https://loviprintdtf.es/faq",
    type: "website",
  },
}

const faqs: FAQItem[] = [
  {
    id: 1,
    category: "general",
    question: "¿Qué es la impresión DTF?",
    answer: "DTF (Direct to Film) es una tecnología de impresión que permite transferir diseños de alta calidad a textiles. Se imprime el diseño en un film especial con tintas de colores vibrantes, se aplica polvo adhesivo y luego se transfiere al tejido con calor. El resultado es una impresión duradera, elástica y con colores brillantes que resiste más de 50 lavados."
  },
  {
    id: 2,
    category: "general",
    question: "¿En qué se diferencia DTF de otras técnicas como serigrafía o vinilo?",
    answer: "DTF ofrece varias ventajas: permite colores ilimitados sin coste adicional, no tiene cantidad mínima de pedido, funciona en cualquier tipo de tejido (incluso oscuros), tiene mejor elasticidad que el vinilo, es más económico que serigrafía para cantidades pequeñas y medianas, y permite reproducir fotografías y degradados con calidad fotográfica."
  },
  {
    id: 3,
    category: "general",
    question: "¿Ofrecen descuentos para profesionales?",
    answer: "Sí, tenemos un programa especial para profesionales con descuentos adicionales del 10-30% dependiendo del volumen mensual. Para acceder, regístrate como usuario profesional en nuestra web y nos pondremos en contacto contigo para validar tu actividad y activar tus descuentos permanentes."
  },
  {
    id: 4,
    category: "tecnico",
    question: "¿En qué tipos de tela puedo usar DTF?",
    answer: "DTF funciona en prácticamente todos los tejidos: algodón 100%, poliéster, mezclas de algodón-poliéster, nylon, lycra, canvas, e incluso cuero sintético. Funciona tanto en tejidos claros como oscuros, obteniendo colores brillantes en ambos casos. No recomendamos su uso en tejidos con tratamientos impermeables."
  },
  {
    id: 5,
    category: "tecnico",
    question: "¿Qué formato deben tener mis diseños?",
    answer: "Aceptamos archivos en PNG, PDF, AI, EPS o SVG con fondo transparente. Recomendamos una resolución mínima de 300 DPI para garantizar la mejor calidad. Si tienes dudas sobre tu archivo, nuestro equipo puede revisarlo antes de producción sin coste adicional. También ofrecemos servicio de diseño si lo necesitas."
  },
  {
    id: 6,
    category: "tecnico",
    question: "¿Cómo se aplica la transferencia DTF al tejido?",
    answer: "La aplicación es muy sencilla: precalienta la prensa térmica a 160-170°C, coloca la transferencia sobre el tejido con el diseño hacia abajo, prensa durante 10-15 segundos con presión media-alta, deja enfriar y retira el film en frío (peel cold). Te enviaremos instrucciones detalladas con tu pedido y tenemos vídeos tutoriales en nuestra web."
  },
  {
    id: 7,
    category: "tecnico",
    question: "¿Necesito equipamiento especial para aplicar las transferencias?",
    answer: "Sí, necesitas una prensa térmica (plancha de transferencia) que alcance temperaturas de 160-170°C con presión uniforme. No recomendamos usar planchas domésticas ya que no proporcionan la presión y temperatura uniforme necesarias. Si no tienes prensa, podemos recomendarte proveedores o aplicar las transferencias por ti."
  },
  {
    id: 8,
    category: "pedidos",
    question: "¿Cuál es el tiempo de producción y envío?",
    answer: "Nuestro tiempo de producción estándar es de 24 horas laborables una vez confirmado el pedido y recibidos los archivos. El envío se realiza por mensajería express y suele llegar en 24-48h adicionales en península. En total, recibirás tu pedido en 24-72 horas desde la confirmación."
  },
  {
    id: 9,
    category: "pedidos",
    question: "¿Tienen cantidad mínima de pedido?",
    answer: "No tenemos cantidad mínima. Puedes pedir desde 0.5 m² (aproximadamente 3 diseños A4). Sin embargo, ten en cuenta que los descuentos por volumen empiezan a partir de 1 m², por lo que cantidades mayores tienen mejor precio por metro cuadrado."
  },
  {
    id: 10,
    category: "pedidos",
    question: "¿Puedo hacer cambios en mi pedido después de confirmarlo?",
    answer: "Una vez confirmado el pedido y recibidos los archivos, iniciamos la producción inmediatamente para cumplir con nuestros tiempos de entrega. Si necesitas hacer cambios, contáctanos cuanto antes. Si no hemos iniciado la producción, podremos modificarlo sin problema."
  },
  {
    id: 11,
    category: "pedidos",
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), transferencia bancaria y PayPal. Para empresas con pedidos recurrentes, ofrecemos pago contra factura a 30 días previa aprobación."
  },
  {
    id: 12,
    category: "bonos",
    question: "¿Cómo funcionan los bonos prepagados?",
    answer: "Los bonos son paquetes de metros cuadrados que compras por adelantado con descuento. Por ejemplo, el Bono Starter incluye 10 m² por 150€ (15€/m² vs 18€/m² precio normal). Los bonos no caducan, así que puedes usar tus metros cuando quieras sin prisa. Ideal si haces pedidos con frecuencia o sabes que vas a necesitar cierta cantidad."
  },
  {
    id: 13,
    category: "bonos",
    question: "¿Los bonos tienen fecha de caducidad?",
    answer: "No, nuestros bonos no tienen fecha de caducidad. Una vez que compras un bono, los metros son tuyos para siempre y puedes usarlos cuando lo necesites, sin prisa ni presión. Los metros no se pueden transferir ni reembolsar una vez adquiridos."
  },
  {
    id: 14,
    category: "bonos",
    question: "¿Puedo usar mi bono en varios pedidos?",
    answer: "Sí, puedes dividir los metros de tu bono en todos los pedidos que quieras. Por ejemplo, si tienes un bono de 25 m², puedes hacer 5 pedidos de 5 m² cada uno. Los metros se irán descontando automáticamente de tu saldo."
  },
  {
    id: 15,
    category: "envios",
    question: "¿Cuánto cuesta el envío?",
    answer: "El envío estándar 24/48h tiene un coste de 6,00€ para península (IVA incluido). Los pedidos superiores a 100€ tienen envío gratuito. También disponible envío urgente 24h por 12,00€. Para Baleares, Canarias, Ceuta y Melilla el plazo y el coste pueden variar. Envíos internacionales disponibles bajo consulta."
  },
  {
    id: 16,
    category: "envios",
    question: "¿Puedo hacer seguimiento de mi pedido?",
    answer: "Sí, una vez enviado tu pedido recibirás un email con el número de seguimiento y enlace directo para rastrear tu paquete en tiempo real. También puedes ver el estado desde tu cuenta en la sección \"Mis Pedidos\"."
  },
  {
    id: 17,
    category: "envios",
    question: "¿Qué hago si mi pedido llega dañado o incompleto?",
    answer: "Si tu pedido llega dañado o incompleto, contáctanos inmediatamente con fotos del paquete y contenido. Te enviaremos un reemplazo sin coste adicional en menos de 48h. Tu satisfacción es nuestra prioridad."
  },
  {
    id: 18,
    category: "calidad",
    question: "¿Cuánto duran las impresiones DTF?",
    answer: "Nuestras impresiones DTF están diseñadas para durar más de 50 lavados sin perder calidad ni brillo. Con el cuidado adecuado (lavar a máximo 40°C, evitar secadora a alta temperatura), pueden durar incluso más tiempo manteniendo colores vibrantes."
  },
  {
    id: 19,
    category: "calidad",
    question: "¿Las impresiones son resistentes al lavado?",
    answer: "Sí, nuestras impresiones DTF son muy resistentes al lavado. Recomendamos lavar a máximo 40°C, no usar lejía, planchar del revés a temperatura media y evitar secadora a alta temperatura. Siguiendo estos cuidados, la impresión mantendrá su calidad original durante muchos lavados."
  },
  {
    id: 20,
    category: "calidad",
    question: "¿Garantizan la calidad de las impresiones?",
    answer: "Sí, garantizamos la calidad de todas nuestras impresiones 100%. Si no estás satisfecho con el resultado, te devolvemos el dinero o reimprimimos tu diseño sin coste adicional. Nuestro objetivo es tu completa satisfacción."
  }
]

const categories = {
  all: { name: "Todas", color: "bg-gray-100 text-gray-800", count: faqs.length },
  general: { name: "General", color: "bg-blue-100 text-blue-800", count: faqs.filter(f => f.category === "general").length },
  tecnico: { name: "Técnico", color: "bg-purple-100 text-purple-800", count: faqs.filter(f => f.category === "tecnico").length },
  pedidos: { name: "Pedidos", color: "bg-green-100 text-green-800", count: faqs.filter(f => f.category === "pedidos").length },
  bonos: { name: "Bonos", color: "bg-yellow-100 text-yellow-800", count: faqs.filter(f => f.category === "bonos").length },
  envios: { name: "Envíos", color: "bg-orange-100 text-orange-800", count: faqs.filter(f => f.category === "envios").length },
  calidad: { name: "Calidad", color: "bg-pink-100 text-pink-800", count: faqs.filter(f => f.category === "calidad").length }
}

export default function FAQPage() {
  return (
    <>
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="warning" className="mb-6 bg-orange-400 text-white">
                <HelpCircle className="h-3 w-3 mr-1" />
                Centro de Ayuda
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Preguntas Frecuentes
              </h1>
              <p className="text-lg sm:text-xl text-orange-100 mb-8">
                Encuentra respuestas rápidas a las preguntas más comunes sobre impresión DTF
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <FAQList faqs={faqs} categories={categories} />
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-orange-50 to-white">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-orange-600 to-orange-700 border-none text-white">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  ¿No encuentras lo que buscas?
                </h2>
                <p className="text-lg sm:text-xl text-orange-100 mb-8">
                  Nuestro equipo está listo para ayudarte con cualquier duda que tengas
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contacto">
                    <Button size="lg" className="bg-white text-orange-700 hover:bg-gray-100 w-full sm:w-auto">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Contactar Soporte
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}
