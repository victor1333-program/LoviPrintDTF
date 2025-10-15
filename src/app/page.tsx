import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import {
  Zap,
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Shield
} from "lucide-react"
import Link from "next/link"
import { FAQSection } from "@/components/FAQSection"
import { OrderProcessSection } from "@/components/OrderProcessSection"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export default async function HomePage() {
  // Obtener los rangos de precios del producto Transfer DTF
  const transferDTF = await prisma.product.findFirst({
    where: { slug: 'transfer-dtf' },
    include: {
      priceRanges: {
        orderBy: { fromQty: 'asc' }
      }
    }
  })

  const priceRanges = transferDTF?.priceRanges || []
  const basePrice = Number(transferDTF?.basePrice || 15)

  // Calcular porcentaje de ahorro respecto al precio base
  const calculateSavings = (price: number) => {
    return Math.round(((basePrice - price) / basePrice) * 100)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="warning" className="mb-4 bg-primary-400 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                LoviPrintDTF - Tecnología de Vanguardia
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Impresión DTF
                <span className="block text-primary-200">Profesional</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Transferencias DTF de máxima calidad para textil. Desde Hellín, Albacete.
                Precios por volumen, entrega 24-48h y bonos prepagados disponibles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/productos/transfer-dtf">
                  <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100 w-full sm:w-auto">
                    Comprar DTF
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/bonos">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    Ver Bonos
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-primary-300 rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-900 font-medium">Descuentos por volumen hasta 36%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-900 font-medium">Envío gratis en pedidos +100€</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-900 font-medium">Sistema de puntos de fidelización</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-900 font-medium">Bonos prepagados sin caducidad</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Cards - Ancho completo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-orange-400/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-orange-300/50 hover:border-orange-400">
              {/* Efecto de brillo en los bordes */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-orange-400/50">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Entrega Express</h3>
                <p className="text-sm text-gray-600 leading-tight">
                  Recíbelo al día siguiente haciendo tu pedido antes de la 13:00
                </p>
              </div>
            </div>

            <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-orange-400/50 hover:border-orange-500">
              {/* Efecto de brillo en los bordes */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/50">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Calidad Premium</h3>
                <p className="text-sm text-gray-600 leading-tight">
                  Colores vibrantes, 50+ lavados garantizados
                </p>
              </div>
            </div>

            <div className="relative bg-white rounded-xl p-6 shadow-2xl hover:shadow-amber-400/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden border-2 border-amber-300/50 hover:border-amber-400">
              {/* Efecto de brillo en los bordes */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-amber-400/50">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Mejores Precios</h3>
                <p className="text-sm text-gray-600 leading-tight">
                  Descuentos progresivos según cantidad
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
                <h3 className="text-base font-bold text-gray-900 mb-2">Garantía Total</h3>
                <p className="text-sm text-gray-600 leading-tight">
                  Satisfacción garantizada o reembolso
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
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
              Ofertas por Volumen
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Precios por <span className="text-primary-400">Volumen</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Cuanto más compras, más ahorras. Descuentos progresivos según cantidad
            </p>
          </div>

          <div className={`grid gap-6 mx-auto ${
            priceRanges.length === 4 ? 'grid-cols-1 md:grid-cols-4 max-w-6xl' :
            priceRanges.length === 5 ? 'grid-cols-1 md:grid-cols-5 max-w-7xl' :
            priceRanges.length === 6 ? 'grid-cols-1 md:grid-cols-6 max-w-7xl' :
            'grid-cols-1 md:grid-cols-4 max-w-6xl'
          }`}>
            {priceRanges.map((range, index) => {
              const price = Number(range.price)
              const savings = calculateSavings(price)
              const isLast = index === priceRanges.length - 1
              const isFirst = index === 0

              // Lógica para mostrar el texto del rango
              let rangeText = ''
              if (range.toQty) {
                const fromQty = Number(range.fromQty)
                const toQty = Number(range.toQty)
                // Si son iguales, mostrar solo un número
                if (fromQty === toQty) {
                  rangeText = `${fromQty} metros`
                } else {
                  rangeText = `${fromQty} - ${toQty} metros`
                }
              } else {
                rangeText = `${Number(range.fromQty)}+ metros`
              }

              return (
                <div key={range.id} className="relative h-full">
                  {isLast && (
                    <div className="absolute -top-3 -right-3 z-50">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full blur-md animate-pulse"></div>
                        <Badge className="relative bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs px-3 py-1.5 shadow-xl border-2 border-white whitespace-nowrap">
                          ⭐ MEJOR PRECIO
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Link
                    href="/productos/transfer-dtf"
                    className={`flex flex-col h-full rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:scale-110 hover:-translate-y-2 cursor-pointer shadow-2xl group ${
                      isLast
                        ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 border-4 border-yellow-300 shadow-yellow-500/50'
                        : 'bg-white backdrop-blur-xl border-2 border-white/30 hover:border-white/60 hover:shadow-white/30'
                    }`}
                  >
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    <div className="text-center relative z-10 flex-1 flex flex-col justify-center">
                      {/* Icono decorativo */}
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                        isLast ? 'bg-white/30' : 'bg-gradient-to-br from-orange-500 to-red-500'
                      } shadow-lg`}>
                        <Sparkles className={`h-6 w-6 ${isLast ? 'text-white' : 'text-white'}`} />
                      </div>

                      <div className={`text-3xl md:text-4xl font-black ${isLast ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
                        {formatCurrency(price)}
                      </div>
                      <div className={`text-xs mb-2 ${isLast ? 'text-white/70' : 'text-gray-500'}`}>
                        + IVA
                      </div>
                      <div className={`text-sm mb-3 font-semibold ${isLast ? 'text-white/90' : 'text-gray-600'}`}>
                        por metro
                      </div>
                      <div className={`text-sm font-bold mb-3 ${isLast ? 'text-white/95' : 'text-gray-700'}`}>
                        📏 {rangeText}
                      </div>

                      {/* Badge de ahorro o espacio vacío para mantener altura uniforme */}
                      <div className="h-6 flex items-center justify-center">
                        {savings > 0 && !isFirst && (
                          <Badge
                            className={`text-xs font-bold px-3 py-1 ${
                              isLast
                                ? 'bg-white text-orange-600'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            } shadow-lg`}
                          >
                            🔥 -{savings}% ahorro
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Total savings badge */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 rounded-full px-8 py-4 shadow-2xl">
              <p className="text-sm text-primary-100 mb-1">Ahorra hasta</p>
              <p className="text-3xl font-black">{Math.max(...priceRanges.map(r => calculateSavings(Number(r.price))))}%</p>
              <p className="text-sm text-primary-100 mt-1">Comprando más metros</p>
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
                Ver Precios Completos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bonos Section - Dinámica */}
      <section className="py-20 bg-white">
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
              Compra metros por adelantado y consigue los mejores precios. <span className="relative inline-block font-bold text-green-600">
                <span className="relative z-10">Nuestros bonos no tienen caducidad</span>
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 animate-pulse"></span>
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 blur-sm"></span>
              </span>
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

      {/* Proceso de Pedido */}
      <OrderProcessSection />

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary-400">LoviPrintDTF</h3>
              <p className="text-gray-400 text-sm mb-4">
                Impresión DTF profesional de alta calidad
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📍 Calle Antonio López del Oro 7</p>
                <p className="ml-4">Hellín, Albacete</p>
                <p>📧 info@loviprintdtf.es</p>
                <p>📞 Por confirmar</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Productos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/productos?category=dtf-textil" className="hover:text-primary-400 transition">DTF Textil</Link></li>
                <li><Link href="/productos?category=uv-dtf" className="hover:text-primary-400 transition">UV DTF</Link></li>
                <li><Link href="/productos?category=consumibles" className="hover:text-primary-400 transition">Consumibles</Link></li>
                <li><Link href="/bonos" className="hover:text-primary-400 transition">Bonos</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/guias" className="hover:text-primary-400 transition">Guías de Diseño</Link></li>
                <li><Link href="/faq" className="hover:text-primary-400 transition">FAQ</Link></li>
                <li><Link href="/contacto" className="hover:text-primary-400 transition">Contacto</Link></li>
                <li><Link href="/blog" className="hover:text-primary-400 transition">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terminos" className="hover:text-primary-400 transition">Términos y Condiciones</Link></li>
                <li><Link href="/privacidad" className="hover:text-primary-400 transition">Política de Privacidad</Link></li>
                <li><Link href="/envios" className="hover:text-primary-400 transition">Envíos y Devoluciones</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} LoviPrintDTF. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
