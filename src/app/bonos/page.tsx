"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import {
  Ticket,
  Star,
  CheckCircle2,
  TrendingUp,
  Gift,
  Zap,
  Shield,
  Clock,
  HelpCircle,
  ArrowRight,
  Sparkles
} from "lucide-react"
import Link from "next/link"

export default function BonosPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>('bono-50')

  const bonos = [
    {
      id: 'bono-25',
      name: 'Bono DTF',
      metros: 25,
      price: 190,
      pricePerMeter: 7.60,
      savings: 33,
      slug: 'bono-dtf-25-metros',
      color: 'from-blue-500 to-blue-600',
      icon: <Sparkles className="w-8 h-8" />,
      features: [
        '25 metros de impresión DTF',
        'Sin caducidad',
        'Envíos gratis incluidos',
        'Uso flexible en múltiples pedidos'
      ],
      idealFor: 'Ideal para emprendedores y pequeños proyectos'
    },
    {
      id: 'bono-50',
      name: 'Bono DTF',
      metros: 50,
      price: 375,
      pricePerMeter: 7.50,
      savings: 33,
      slug: 'bono-dtf-50-metros',
      color: 'from-orange-500 to-orange-600',
      icon: <Star className="w-8 h-8" />,
      features: [
        '50 metros de impresión DTF',
        'Sin caducidad',
        'Envíos gratis incluidos',
        'Uso flexible en múltiples pedidos'
      ],
      idealFor: 'Perfecto para negocios en crecimiento',
      popular: true
    },
    {
      id: 'bono-100',
      name: 'Bono DTF',
      metros: 100,
      price: 725,
      pricePerMeter: 7.25,
      savings: 36,
      slug: 'bono-dtf-100-metros',
      color: 'from-purple-500 to-purple-600',
      icon: <TrendingUp className="w-8 h-8" />,
      features: [
        '100 metros de impresión DTF',
        'Sin caducidad',
        'Envíos gratis incluidos',
        'Uso flexible en múltiples pedidos'
      ],
      idealFor: 'Para empresas con volumen constante'
    }
  ]

  const faqs = [
    {
      question: '¿Cómo funcionan los bonos?',
      answer: 'Compras un paquete de metros cuadrados por adelantado y los usas cuando quieras durante el período de validez. Es como tener un saldo prepagado que puedes usar en múltiples pedidos.'
    },
    {
      question: '¿Puedo usar el bono en varios pedidos?',
      answer: 'Sí, puedes dividir tus metros en tantos pedidos como necesites. Por ejemplo, si tienes un bono de 25m², puedes hacer 5 pedidos de 5m² cada uno.'
    },
    {
      question: '¿Qué pasa si no uso todos los metros?',
      answer: 'Los metros no usados antes de la fecha de expiración se pierden. Te enviaremos notificaciones recordándote cuándo caduca tu bono.'
    },
    {
      question: '¿Puedo transferir mi bono a otra persona?',
      answer: 'No, los bonos son personales e intransferibles y están vinculados a tu cuenta.'
    },
    {
      question: '¿Hay descuentos al renovar un bono?',
      answer: 'Sí, los bonos Pro y Business incluyen descuentos especiales al renovar antes de que caduquen.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="warning" className="mb-6 bg-orange-400 text-white">
              <Gift className="h-3 w-3 mr-1" />
              Bonos Prepagados DTF
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ahorra hasta un <span className="text-orange-200">33%</span>
              <br />
              con nuestros Bonos
            </h1>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Compra metros por adelantado y consigue los mejores precios en impresión DTF.
              Úsalos cuando quieras, sin límites de colores ni diseño.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="#bonos">
                <Button size="lg" className="bg-white text-orange-700 hover:bg-gray-100 w-full sm:w-auto">
                  Ver Bonos Disponibles
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Bono Personalizado
                </Button>
              </Link>
            </div>

            {/* Benefits Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-orange-400/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-orange-300/50 hover:border-orange-400">
                {/* Efecto de brillo en los bordes */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-orange-400/50">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Ahorro Garantizado</h3>
                  <p className="text-sm text-gray-600 leading-tight">
                    Hasta 33% de descuento vs precio normal
                  </p>
                </div>
              </div>

              <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-orange-400/50 hover:border-orange-500">
                {/* Efecto de brillo en los bordes */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/50">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Uso Flexible</h3>
                  <p className="text-sm text-gray-600 leading-tight">
                    Divide tus metros en múltiples pedidos
                  </p>
                </div>
              </div>

              <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-amber-400/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-amber-300/50 hover:border-amber-400">
                {/* Efecto de brillo en los bordes */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-amber-400/50">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Prioridad</h3>
                  <p className="text-sm text-gray-600 leading-tight">
                    Producción prioritaria en todos tus pedidos
                  </p>
                </div>
              </div>

              <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-yellow-300/50 hover:border-yellow-400">
                {/* Efecto de brillo en los bordes */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-400/50">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Sin Caducidad</h3>
                  <p className="text-sm text-gray-600 leading-tight">
                    Tus metros no caducan nunca, úsalos cuando quieras
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bonos Cards */}
      <section id="bonos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="warning" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Bonos Prepagados
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ahorra con nuestros <span className="text-primary-600">Bonos</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compra metros por adelantado y consigue los mejores precios. Sin caducidad.
            </p>
          </div>

          {/* Bonos Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Bono 25 metros - Izquierda */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-primary-400 hover:shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Bono DTF</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary-600">190€</span>
                  <span className="text-xs text-gray-500 ml-1">+ IVA</span>
                </div>
                <p className="text-gray-600 mb-4">25 metros incluidos</p>
                <Badge variant="success" className="mb-6">7.60€/metro - Ahorra 33%</Badge>

                <ul className="space-y-3 text-sm text-left mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>25 metros de impresión DTF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Sin caducidad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Envíos gratis incluidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Uso flexible en múltiples pedidos</span>
                  </li>
                </ul>

                <Link href="/productos/bonos/bono-dtf-25-metros" className="cursor-pointer">
                  <Button className="w-full cursor-pointer">
                    Ver Bono 25m
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bono 50 metros - Centro - Destacado */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl transform scale-105">
              <div className="absolute top-4 right-4">
                <Badge className="bg-white text-primary-700">MÁS POPULAR</Badge>
              </div>
              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Bono DTF</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">375€</span>
                  <span className="text-xs text-white/70 ml-1">+ IVA</span>
                </div>
                <p className="text-primary-100 mb-4">50 metros incluidos</p>
                <Badge className="mb-6 bg-white text-primary-700">7.50€/metro - Ahorra 33%</Badge>

                <ul className="space-y-3 text-sm text-left mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>50 metros de impresión DTF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Sin caducidad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Envíos gratis incluidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Uso flexible en múltiples pedidos</span>
                  </li>
                </ul>

                <Link href="/productos/bonos/bono-dtf-50-metros" className="cursor-pointer">
                  <Button className="w-full bg-white text-primary-700 hover:bg-gray-100 cursor-pointer">
                    Ver Bono 50m
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bono 100 metros - Derecha */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-primary-400 hover:shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Bono DTF</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary-600">725€</span>
                  <span className="text-xs text-gray-500 ml-1">+ IVA</span>
                </div>
                <p className="text-gray-600 mb-4">100 metros incluidos</p>
                <Badge variant="success" className="mb-6">7.25€/metro - Ahorra 36%</Badge>

                <ul className="space-y-3 text-sm text-left mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>100 metros de impresión DTF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Sin caducidad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Envíos gratis incluidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Uso flexible en múltiples pedidos</span>
                  </li>
                </ul>

                <Link href="/productos/bonos/bono-dtf-100-metros" className="cursor-pointer">
                  <Button className="w-full cursor-pointer">
                    Ver Bono 100m
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Custom Bono CTA */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  ¿Necesitas más metros?
                </h3>
                <p className="text-gray-700 mb-6">
                  Ofrecemos bonos personalizados para empresas con alto volumen.
                  Contáctanos y te haremos una oferta a medida.
                </p>
                <Link href="/contacto">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    Solicitar Bono Personalizado
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="warning" className="mb-4 bg-primary-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Proceso Simple
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Cómo <span className="text-primary-400">funciona?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Es muy sencillo, solo 3 pasos para empezar a ahorrar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Compra tu Bono</h3>
                <p className="text-gray-300 leading-relaxed">
                  Elige el bono que mejor se adapte a tus necesidades y completa el pago de forma segura
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Vinculación Automática</h3>
                <p className="text-gray-300 leading-relaxed">
                  Tu bono se activa automáticamente en tu cuenta. Los metros quedan disponibles al instante para usar cuando quieras
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Úsalo en tus Pedidos</h3>
                <p className="text-gray-300 leading-relaxed">
                  Al hacer un pedido, tus metros se descontarán automáticamente del bono. Fácil y sin complicaciones
                </p>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 rounded-full px-8 py-4 shadow-2xl">
              <p className="text-sm text-primary-100 mb-1">Todo el proceso es</p>
              <p className="text-2xl font-black">100% Automático</p>
              <p className="text-sm text-primary-100 mt-1">Sin códigos ni complicaciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Preguntas Frecuentes
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">¿Tienes más preguntas?</p>
              <Link href="/contacto">
                <Button variant="outline">Contáctanos</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-orange-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Compra sin Riesgos
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Todos nuestros bonos están respaldados por nuestra garantía de satisfacción 100%.
              Si no estás contento con tu primera impresión, te devolvemos el dinero.
            </p>
            <Link href="#bonos">
              <Button size="lg" className="bg-white text-orange-700 hover:bg-gray-100">
                Comprar Mi Bono Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
