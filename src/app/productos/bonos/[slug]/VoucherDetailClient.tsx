"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProductWithRelations } from "@/types"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  ShoppingCart,
  Check,
  Sparkles,
  Shield,
  Truck,
  Award,
  Clock,
  TrendingUp,
  Package,
  Gift,
  CheckCircle2,
  Zap,
  Infinity
} from "lucide-react"
import { formatCurrency, formatPriceWithTax } from "@/lib/utils"
import { trackViewItem, trackAddToCart } from "@/lib/analytics"
import toast from "react-hot-toast"
import Link from "next/link"

interface VoucherDetailClientProps {
  product: ProductWithRelations
  initialShipments: number
}

export default function VoucherDetailClient({ product, initialShipments }: VoucherDetailClientProps) {
  const router = useRouter()
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    trackViewItem({
      item_id: product.slug,
      item_name: product.name,
      item_category: "Bono",
      price: Number(product.basePrice),
    })
  }, [product.slug, product.name, product.basePrice])

  const handlePurchase = async () => {
    setAddingToCart(true)

    try {
      const res = await fetch('/api/vouchers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: product.id,
          quantity: 1,
        }),
      })

      if (res.ok) {
        trackAddToCart({
          item_id: product.slug,
          item_name: product.name,
          item_category: "Bono",
          price: Number(product.basePrice),
          quantity: 1,
        })
        toast.success('Bono agregado al carrito')
        // Disparar evento para actualizar el botón del carrito
        window.dispatchEvent(new Event('cartUpdated'))
        router.push('/carrito')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al agregar bono al carrito')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar bono al carrito')
    } finally {
      setAddingToCart(false)
    }
  }

  // Calcular el descuento equivalente
  const regularPrice = Number(product.basePrice) * 1.33 // 33% más caro sin bono
  const savings = regularPrice - Number(product.basePrice)
  const savingsPercent = 33

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-white text-purple-600 hover:bg-white">
              <Gift className="h-3 w-3 mr-1" />
              Bono Prepagado
            </Badge>
            <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              Ahorra {savingsPercent}%
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">{product.name}</h1>
          <p className="text-xl text-purple-100 max-w-3xl">
            {product.shortDescription || "Compra metros por adelantado y ahorra en cada pedido"}
          </p>
          <div className="mt-6 flex items-center gap-6 text-purple-100">
            <div className="flex items-center gap-2">
              <Infinity className="h-5 w-5" />
              <span>Sin caducidad</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span>Envíos gratis incluidos</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Activación inmediata</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Benefits & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cómo Funciona */}
            <Card className="border-2 border-purple-200">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 text-purple-900">
                  <Award className="h-8 w-8 text-purple-600" />
                  ¿Cómo funciona?
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">1</div>
                    <div>
                      <h3 className="font-bold text-xl text-purple-900 mb-2">Compra tu bono</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Realiza tu compra de forma segura. El bono se activará automáticamente en tu cuenta tras la confirmación del pago.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">2</div>
                    <div>
                      <h3 className="font-bold text-xl text-purple-900 mb-2">Usa tus metros cuando quieras</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Realiza pedidos y utiliza los metros de tu bono. Puedes usar la cantidad que necesites en cada pedido, sin mínimos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">3</div>
                    <div>
                      <h3 className="font-bold text-xl text-purple-900 mb-2">Disfruta de envíos gratis</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Cada bono incluye envíos gratuitos. Aprovecha para hacer pedidos pequeños sin preocuparte por costes adicionales.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">4</div>
                    <div>
                      <h3 className="font-bold text-xl text-purple-900 mb-2">Sin caducidad</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Tu bono nunca caduca. Usa tus metros a tu ritmo, sin presiones ni fechas límite.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ventajas del Bono */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 text-purple-900">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                  Ventajas exclusivas
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-purple-900">Ahorra hasta 33%</h3>
                      <p className="text-sm text-gray-700">Precio por metro mucho más económico que pedidos individuales</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-purple-900">Envíos gratis</h3>
                      <p className="text-sm text-gray-700">Incluye envíos gratuitos para todos tus pedidos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Infinity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-purple-900">Sin caducidad</h3>
                      <p className="text-sm text-gray-700">Usa tus metros cuando quieras, sin fecha de expiración</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-purple-900">Pedidos flexibles</h3>
                      <p className="text-sm text-gray-700">Divide tus metros en múltiples pedidos según necesites</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-purple-900">Calidad garantizada</h3>
                      <p className="text-sm text-gray-700">La misma calidad premium de siempre</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-purple-900">Activación inmediata</h3>
                      <p className="text-sm text-gray-700">Disponible en tu cuenta tras confirmar el pago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descripción Detallada */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-purple-600" />
                  Detalles del producto
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700">
                  {product.description ? (
                    <p className="leading-relaxed">{product.description}</p>
                  ) : (
                    <>
                      <p className="mb-4 leading-relaxed">
                        Nuestros <strong>Bonos DTF</strong> son la solución perfecta para clientes frecuentes que buscan
                        optimizar costes y disfrutar de máxima flexibilidad. Al comprar metros por adelantado, obtienes
                        un descuento significativo y envíos gratuitos incluidos.
                      </p>
                      <p className="mb-4 leading-relaxed">
                        Ideal para negocios de personalización, tiendas textiles, marcas de ropa y emprendedores que
                        realizan pedidos regulares. Sin compromisos, sin fecha de caducidad, con total libertad de uso.
                      </p>
                      <p className="leading-relaxed">
                        La misma calidad premium de nuestro Transfer DTF, con la ventaja de tener metros prepagados
                        siempre disponibles para tus proyectos.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preguntas Frecuentes */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">Preguntas frecuentes</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-purple-900">¿Cuándo caduca el bono?</h3>
                    <p className="text-gray-700">Nunca. Tu bono no tiene fecha de caducidad y podrás usar tus metros cuando lo necesites.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-purple-900">¿Puedo usar el bono en varios pedidos?</h3>
                    <p className="text-gray-700">Sí, puedes dividir los metros de tu bono en tantos pedidos como necesites, sin mínimos por pedido.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-purple-900">¿Los envíos están incluidos?</h3>
                    <p className="text-gray-700">Sí, cada bono incluye envíos gratuitos para que puedas hacer pedidos sin costes adicionales.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-purple-900">¿Qué pasa si uso todos los envíos gratuitos?</h3>
                    <p className="text-gray-700">Si consumes todos los envíos incluidos pero aún te quedan metros, puedes seguir haciendo pedidos sin problema. El sistema detectará que no quedan envíos del bono y solo te cobrará el coste de envío en ese pedido.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-purple-900">¿Cuándo se activa el bono?</h3>
                    <p className="text-gray-700">Se activa automáticamente en tu cuenta tras la confirmación del pago. Lo verás disponible en tu perfil.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-purple-900">¿Puedo regalar un bono?</h3>
                    <p className="text-gray-700">Por supuesto. Contáctanos tras la compra y lo asignaremos a la persona que indiques.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sticky Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Tarjeta de Compra */}
              <Card className="border-4 border-purple-500 shadow-2xl">
                <CardContent className="p-6">
                  {/* Precio */}
                  <div className="text-center mb-6">
                    <div className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-full mb-4">
                      <span className="text-sm font-medium">AHORRA {savingsPercent}%</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 line-through text-2xl mr-2">
                        {formatPriceWithTax(regularPrice)}
                      </span>
                    </div>
                    <div className="text-5xl font-bold text-purple-600 mb-2">
                      {formatPriceWithTax(Number(product.basePrice))}
                    </div>
                    <div className="text-gray-600 text-lg">
                      {product.unit === 'metros' && (
                        <span>{formatPriceWithTax(Number(product.basePrice) / Number(product.minQuantity))} por metro</span>
                      )}
                    </div>
                  </div>

                  {/* Incluye */}
                  <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                    <h3 className="font-bold mb-3 text-purple-900 flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Incluye:
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{Number(product.minQuantity)} metros</strong> de Transfer DTF</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Incluye {initialShipments} envíos</strong> en este bono</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Sin caducidad</strong> - usa cuando quieras</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Activación inmediata</strong> tras el pago</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Calidad premium</strong> garantizada</span>
                      </li>
                    </ul>
                  </div>

                  {/* Botón de Compra */}
                  <Button
                    onClick={handlePurchase}
                    disabled={addingToCart}
                    className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl mb-4"
                  >
                    <ShoppingCart className="h-6 w-6 mr-2" />
                    {addingToCart ? 'Agregando...' : 'Comprar Bono'}
                  </Button>

                  {/* Garantías */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span>Pago 100% seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span>Activación inmediata</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Award className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span>Garantía de calidad total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Banner Info */}
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Package className="h-6 w-6 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold mb-1">¿Necesitas otros productos?</h3>
                      <p className="text-sm text-orange-100 mb-3">
                        Explora nuestro catálogo completo de Transfer DTF y UV DTF
                      </p>
                      <Link href="/productos">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white text-orange-600 hover:bg-orange-50 border-0"
                        >
                          Ver Catálogo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
