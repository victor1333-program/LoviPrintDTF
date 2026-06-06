"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ProductWithRelations } from "@/types"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import {
  ShoppingCart,
  Check,
  Info,
  Minus,
  Plus,
  Star,
  Zap,
  Shield,
  Truck,
  Award,
  FileText,
  Upload,
  Palette,
  Ruler,
  ThermometerSun,
  Droplets,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { calculateUnitPrice } from "@/lib/pricing"
import { FileUpload } from "@/components/FileUpload"
import { trackViewItem, trackAddToCart } from "@/lib/analytics"
import toast from "react-hot-toast"

interface UploadedFileData {
  url: string
  name: string
  size: number
  publicId?: string
  metadata?: any
}

interface ProductDetailClientProps {
  product: ProductWithRelations
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<UploadedFileData | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedExtras, setSelectedExtras] = useState({
    prioritize: false,
    layout: false,
    cutting: false
  })
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'instructions'>('description')
  const [uploadMethod, setUploadMethod] = useState<'now' | 'later' | null>(null)
  const [reviewIndex, setReviewIndex] = useState(0)

  const reviews = [
    {
      name: "María García",
      initials: "MG",
      color: "bg-orange-500",
      rating: 5,
      date: "hace 2 semanas",
      text: "Calidad excelente, los colores salen súper vibrantes y el acabado es perfecto. Pedí 5 metros y llegaron en 24h. Repetiré seguro."
    },
    {
      name: "Carlos Rodríguez",
      initials: "CR",
      color: "bg-blue-500",
      rating: 5,
      date: "hace 1 mes",
      text: "Llevo pidiéndoles DTF para mi tienda desde hace meses. Servicio impecable y los transfers aguantan perfectamente los lavados."
    },
    {
      name: "Ana Martínez",
      initials: "AM",
      color: "bg-purple-500",
      rating: 5,
      date: "hace 3 semanas",
      text: "Muy profesionales. Tenía dudas con la maquetación y me ayudaron por WhatsApp en minutos. El resultado, espectacular."
    },
    {
      name: "Javier López",
      initials: "JL",
      color: "bg-green-500",
      rating: 4,
      date: "hace 2 meses",
      text: "Buena calidad y precio competitivo. La entrega fue rapidísima, en 48h estaba en mi taller. Solo pondría 5 estrellas si hubiera más descuentos por volumen."
    },
    {
      name: "Laura Sánchez",
      initials: "LS",
      color: "bg-pink-500",
      rating: 5,
      date: "hace 1 semana",
      text: "Primer pedido y encantada. El fondo blanco queda perfecto y la aplicación con la plancha casera funcionó a la primera siguiendo las instrucciones."
    },
    {
      name: "Pedro Ruiz",
      initials: "PR",
      color: "bg-red-500",
      rating: 5,
      date: "hace 3 meses",
      text: "Como profesional del textil, puedo decir que la calidad del DTF de LoviPrint está al nivel de las mejores imprentas. 100% recomendado."
    },
    {
      name: "Sandra Fernández",
      initials: "SF",
      color: "bg-cyan-500",
      rating: 5,
      date: "hace 4 días",
      text: "Perfecto para mi pequeña marca de ropa. Atención cercana, precios justos y los diseños salen tal cual los mando. Muy satisfecha."
    },
  ]

  // Tabla de precios de extras según metros
  const EXTRAS_PRICING: Record<number, { prioritize: number; layout: number; cutting: number }> = {
    1: { prioritize: 4.5, layout: 7.5, cutting: 5.2 },
    2: { prioritize: 4.5, layout: 9, cutting: 10.4 },
    3: { prioritize: 4.5, layout: 10.5, cutting: 15.6 },
    4: { prioritize: 4.5, layout: 12, cutting: 20.8 },
    5: { prioritize: 6, layout: 13.5, cutting: 26 },
    6: { prioritize: 7.5, layout: 15, cutting: 31.2 },
    7: { prioritize: 9, layout: 16.5, cutting: 36.4 },
    8: { prioritize: 10.5, layout: 18, cutting: 41.6 },
    9: { prioritize: 12, layout: 19.5, cutting: 46.8 },
    10: { prioritize: 13.5, layout: 21, cutting: 52 },
    11: { prioritize: 15, layout: 22.5, cutting: 57.2 },
    12: { prioritize: 16.5, layout: 24, cutting: 62.4 },
    13: { prioritize: 18, layout: 25.5, cutting: 67.6 },
    14: { prioritize: 19.5, layout: 27, cutting: 72.8 },
    15: { prioritize: 21, layout: 28.5, cutting: 78 },
    16: { prioritize: 22.5, layout: 30, cutting: 83.2 },
    17: { prioritize: 24, layout: 31.5, cutting: 88.4 },
    18: { prioritize: 25.5, layout: 33, cutting: 93.6 },
    19: { prioritize: 27, layout: 34.5, cutting: 98.8 },
    20: { prioritize: 28.5, layout: 36, cutting: 104 },
    21: { prioritize: 30, layout: 37.5, cutting: 109.2 },
    22: { prioritize: 31.5, layout: 39, cutting: 114.4 },
    23: { prioritize: 33, layout: 40.5, cutting: 119.6 },
    24: { prioritize: 34.5, layout: 42, cutting: 124.8 },
    25: { prioritize: 36, layout: 43.5, cutting: 130 },
    26: { prioritize: 37.5, layout: 45, cutting: 135.2 },
    27: { prioritize: 39, layout: 46.5, cutting: 140.4 },
    28: { prioritize: 40.5, layout: 48, cutting: 145.6 },
    29: { prioritize: 42, layout: 49.5, cutting: 150.8 },
    30: { prioritize: 43.5, layout: 51, cutting: 156 },
    31: { prioritize: 45, layout: 52.5, cutting: 161.2 },
    32: { prioritize: 46.5, layout: 54, cutting: 166.4 },
    33: { prioritize: 48, layout: 55.5, cutting: 171.6 },
    34: { prioritize: 49.5, layout: 57, cutting: 176.8 },
    35: { prioritize: 51, layout: 58.5, cutting: 182 },
    36: { prioritize: 52.5, layout: 60, cutting: 187.2 },
    37: { prioritize: 54, layout: 61.5, cutting: 192.4 },
    38: { prioritize: 55.5, layout: 63, cutting: 197.6 },
    39: { prioritize: 57, layout: 64.5, cutting: 202.8 },
    40: { prioritize: 58.5, layout: 66, cutting: 208 },
    41: { prioritize: 60, layout: 67.5, cutting: 213.2 },
    42: { prioritize: 61.5, layout: 69, cutting: 218.4 },
    43: { prioritize: 63, layout: 70.5, cutting: 223.6 },
    44: { prioritize: 64.5, layout: 72, cutting: 228.8 },
    45: { prioritize: 66, layout: 73.5, cutting: 234 },
    46: { prioritize: 67.5, layout: 75, cutting: 239.2 },
    47: { prioritize: 69, layout: 76.5, cutting: 244.4 },
    48: { prioritize: 70.5, layout: 78, cutting: 249.6 },
    49: { prioritize: 72, layout: 79.5, cutting: 254.8 },
    50: { prioritize: 73.5, layout: 81, cutting: 260 },
  }

  useEffect(() => {
    trackViewItem({
      item_id: product.slug,
      item_name: product.name,
      item_category: product.category?.name,
      price: Number(product.basePrice),
    })
  }, [product.slug, product.name, product.basePrice, product.category?.name])

  useEffect(() => {
    const interval = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviews.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [reviews.length])

  // Calcular precio de extras según metros
  const calculateExtrasPrice = () => {
    const meters = Math.floor(quantity)
    // Si la cantidad no está en la tabla, usar el precio más cercano
    const pricing = EXTRAS_PRICING[meters] || EXTRAS_PRICING[50]

    let extrasTotal = 0
    if (selectedExtras.prioritize) extrasTotal += pricing.prioritize
    if (selectedExtras.layout) extrasTotal += pricing.layout
    if (selectedExtras.cutting) extrasTotal += pricing.cutting

    return extrasTotal
  }

  // Obtener precio individual de cada extra
  const getExtraPrice = (extraType: 'prioritize' | 'layout' | 'cutting') => {
    const meters = Math.floor(quantity)
    const pricing = EXTRAS_PRICING[meters] || EXTRAS_PRICING[50]
    return pricing[extraType]
  }

  const handleAddToCart = async () => {
    // Validar selección del método de envío del diseño y el archivo cuando corresponda
    if (product.productType === 'DTF_TEXTILE' || product.productType === 'DTF_UV' || product.productType === 'SUBLIMATION') {
      if (!uploadMethod) {
        toast.error('Selecciona si subes tu diseño ahora o lo envías después')
        return
      }
      if (uploadMethod === 'now' && !uploadedFile) {
        toast.error('Por favor sube tu diseño antes de agregar al carrito')
        return
      }
    }

    setAddingToCart(true)

    try {
      // Preparar datos de extras para guardar en customizations
      const customizations: any = {}

      if (selectedExtras.prioritize || selectedExtras.layout || selectedExtras.cutting) {
        customizations.extras = {
          prioritize: selectedExtras.prioritize ? {
            selected: true,
            price: getExtraPrice('prioritize')
          } : undefined,
          layout: selectedExtras.layout ? {
            selected: true,
            price: getExtraPrice('layout')
          } : undefined,
          cutting: selectedExtras.cutting ? {
            selected: true,
            price: getExtraPrice('cutting')
          } : undefined,
        }
        customizations.extrasTotal = calculateExtrasPrice()
      }

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          fileUrl: uploadedFile?.url, // URL del archivo subido
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size,
          customizations: Object.keys(customizations).length > 0 ? customizations : undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({} as any))
        trackAddToCart({
          item_id: product.slug,
          item_name: product.name,
          item_category: product.category?.name,
          price: priceCalc.unitPrice,
          quantity,
        })
        // Disparar evento para actualizar el botón del carrito
        window.dispatchEvent(new Event('cartUpdated'))

        if (data?.merged) {
          // Ya había unidades del mismo producto en el carrito: avisar
          // claramente al cliente con un toast persistente y dejarle decidir
          // si va al carrito o sigue comprando, en lugar de redirigir solo.
          const unit = data.productUnit || 'm'
          const added = Number(data.addedQty ?? quantity)
          const prev = Number(data.previousQty ?? 0)
          const total = Number(data.newTotalQty ?? added + prev)
          toast.custom((t) => (
            <div
              className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} transition-all duration-200 max-w-sm w-full bg-white border-2 border-orange-500 rounded-xl shadow-2xl pointer-events-auto`}
              role="status"
            >
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Has añadido {added}{unit} de {data.productName || product.name}.
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Tu carrito ahora tiene <strong>{total}{unit}</strong> de este producto (antes tenías {prev}{unit}).
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.dismiss(t.id)
                      router.push('/carrito')
                    }}
                    className="flex-1 inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-3 py-2 min-h-[40px]"
                  >
                    Ver carrito
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-3 py-2 min-h-[40px]"
                  >
                    Seguir comprando
                  </button>
                </div>
              </div>
            </div>
          ), { duration: 15000, position: 'top-center' })
        } else {
          toast.success('Producto agregado al carrito')
          router.push('/carrito')
        }
      } else {
        toast.error('Error al agregar al carrito')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar al carrito')
    } finally {
      setAddingToCart(false)
    }
  }

  const priceCalc = product.priceRanges && product.priceRanges.length > 0
    ? calculateUnitPrice(quantity, product.priceRanges)
    : {
        unitPrice: Number(product.basePrice),
        subtotal: Number(product.basePrice) * quantity,
        discountPct: 0,
        discountAmount: 0,
      }

  // Calcular precio total incluyendo extras
  const extrasPrice = calculateExtrasPrice()
  const totalWithExtras = priceCalc.subtotal + extrasPrice

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-4 sm:py-5">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <Badge className="bg-white text-orange-600 hover:bg-white">
              <Sparkles className="h-3 w-3 mr-1" />
              {product.category?.name}
            </Badge>
            {product.isFeatured && (
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                <Star className="h-3 w-3 mr-1" />
                Destacado
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{product.name}</h1>
          <p className="text-xs sm:text-base text-orange-100 max-w-3xl">{product.shortDescription}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Product Image - top on mobile, top-left on desktop */}
          <div className="col-span-1 lg:col-span-2 lg:row-start-1">
            <Card className="overflow-hidden w-full sm:w-3/4 sm:mx-auto">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center relative">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={`${product.name} - Transfer DTF de alta calidad - LoviPrintDTF`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="text-orange-300 text-7xl sm:text-9xl font-bold">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Column - features, tabs, reviews (last on mobile) */}
          <div className="order-last col-span-1 space-y-4 sm:space-y-6 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:space-y-8">
            {/* Características Principales */}
            <Card>
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <Award className="h-6 w-6 text-orange-600" />
                  Características Principales
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {product.category?.slug === 'sublimacion' ? (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Palette className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Colores Brillantes</h3>
                          <p className="text-sm text-gray-600">Transferencia de colores vibrantes a textiles de poliéster</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ThermometerSun className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Integrado en la Fibra</h3>
                          <p className="text-sm text-gray-600">El diseño se integra en el tejido, no se agrieta ni desprende</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Envío Rápido</h3>
                          <p className="text-sm text-gray-600">Envío en 24-48 horas laborables</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Alta Calidad</h3>
                          <p className="text-sm text-gray-600">Papel de sublimación profesional de 100 g/m²</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Palette className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Colores Vibrantes</h3>
                          <p className="text-sm text-gray-600">Impresión DTF con tecnología CMYK + White de alta calidad</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ThermometerSun className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Resistente al Lavado</h3>
                          <p className="text-sm text-gray-600">Garantizado para más de 50 lavados sin perder calidad</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Entrega Express</h3>
                          <p className="text-sm text-gray-600">Producción y envío en 24-48 horas laborables</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Ruler className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Tamaño Flexible</h3>
                          <p className="text-sm text-gray-600">Desde 1 metro hasta grandes volúmenes</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs: Descripción / Especificaciones / Instrucciones */}
            <Card>
              <CardContent className="p-0">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('description')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 min-h-[44px] font-semibold text-xs sm:text-base whitespace-nowrap transition-all border-b-2 ${
                      activeTab === 'description'
                        ? 'border-orange-600 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Descripción
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('specs')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 min-h-[44px] font-semibold text-xs sm:text-base whitespace-nowrap transition-all border-b-2 ${
                      activeTab === 'specs'
                        ? 'border-orange-600 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                    Especificaciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('instructions')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 min-h-[44px] font-semibold text-xs sm:text-base whitespace-nowrap transition-all border-b-2 ${
                      activeTab === 'instructions'
                        ? 'border-orange-600 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    Instrucciones
                  </button>
                </div>

                {activeTab === 'description' && (
                <div className="p-4 sm:p-6 md:p-8 prose prose-base sm:prose-lg max-w-none text-gray-700">
                  {product.description ? (
                    <>
                      {product.description.split('\n\n').map((paragraph, idx) => {
                        // Detectar si es un párrafo con características (contiene "Características destacadas:" o empieza con •)
                        if (paragraph.includes('Características destacadas:') || paragraph.trim().startsWith('•')) {
                          const lines = paragraph.split('\n')
                          const title = lines.find(l => l.includes('Características destacadas:'))
                          const items = lines.filter(l => l.trim().startsWith('•')).map(l => l.replace('•', '').trim())

                          return (
                            <div key={idx} className="mb-4">
                              {title && <p className="font-semibold mb-2">{title}</p>}
                              <ul className="list-none space-y-2 ml-0">
                                {items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-orange-600 mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        }

                        return paragraph.trim() && <p key={idx} className="mb-4 leading-relaxed">{paragraph}</p>
                      })}
                    </>
                  ) : (
                    <>
                      <p className="mb-4 leading-relaxed">
                        Nuestro servicio de <strong>Transfer DTF (Direct to Film)</strong> te ofrece transferencias textiles
                        de altísima calidad para personalizar tus prendas y productos textiles. La tecnología DTF permite
                        imprimir diseños con colores vibrantes y detalles precisos sobre prácticamente cualquier tipo de tejido.
                      </p>
                      <p className="mb-4 leading-relaxed">
                        Ideal para emprendedores, tiendas de personalización, talleres textiles y marcas de ropa que buscan
                        un servicio profesional, rápido y económico. Sin pedidos mínimos y con descuentos progresivos según
                        el volumen de compra.
                      </p>
                      <p className="leading-relaxed">
                        Cada transfer viene listo para aplicar con plancha doméstica o prensa térmica, incluyendo instrucciones
                        detalladas de aplicación para garantizar resultados perfectos.
                      </p>
                    </>
                  )}
                </div>
                )}

                {activeTab === 'specs' && (
                <div className="p-4 sm:p-6 md:p-8">
                {product.specifications ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {Object.entries(product.specifications as Record<string, any>).slice(0, Math.ceil(Object.entries(product.specifications as Record<string, any>).length / 2)).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-semibold">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {Object.entries(product.specifications as Record<string, any>).slice(Math.ceil(Object.entries(product.specifications as Record<string, any>).length / 2)).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-semibold">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">Ancho máximo:</span>
                        <span className="font-semibold">60 cm</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">Resolución:</span>
                        <span className="font-semibold">1440 DPI</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">Tecnología:</span>
                        <span className="font-semibold">DTF (Direct to Film)</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">Colores:</span>
                        <span className="font-semibold">CMYK + White</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">Aplicación:</span>
                        <span className="font-semibold">170°C / 15 seg</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 font-medium">Durabilidad:</span>
                        <span className="font-semibold">50+ lavados</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
                )}

                {activeTab === 'instructions' && (
                <div className="p-4 sm:p-6 md:p-8">
                {product.category?.slug === 'sublimacion' ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                      <div>
                        <h3 className="font-semibold text-cyan-900 mb-1">Imprimir el diseño</h3>
                        <p className="text-cyan-800">Imprime tu diseño en el papel de sublimación usando una impresora de sublimación con tintas especiales.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                      <div>
                        <h3 className="font-semibold text-cyan-900 mb-1">Preparar el textil</h3>
                        <p className="text-cyan-800">Usa un textil de poliéster (mínimo 50% de poliéster). Precalienta la prensa térmica a 180-200°C.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                      <div>
                        <h3 className="font-semibold text-cyan-900 mb-1">Posicionar y prensar</h3>
                        <p className="text-cyan-800">Coloca el papel con el diseño hacia abajo sobre el textil. Prensa durante 45-60 segundos con presión media-alta.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                      <div>
                        <h3 className="font-semibold text-cyan-900 mb-1">Retirar el papel</h3>
                        <p className="text-cyan-800">Retira el papel de sublimación con cuidado (puede estar caliente). ¡El diseño se ha integrado en la fibra!</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Preparar la prenda</h3>
                        <p className="text-orange-800">Asegúrate de que la prenda esté limpia, seca y sin arrugas. Precalienta la plancha o prensa a 170°C.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Posicionar el transfer</h3>
                        <p className="text-orange-800">Coloca el transfer en la posición deseada con el diseño hacia arriba. Utiliza cinta térmica si es necesario.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Aplicar calor y presión</h3>
                        <p className="text-orange-800">Presiona firmemente durante 15 segundos a 170°C. Deja enfriar completamente antes de retirar el film.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Retirar el film protector</h3>
                        <p className="text-orange-800">Una vez frío al tacto, retira suavemente el film transparente. ¡Tu diseño está listo!</p>
                      </div>
                    </div>
                  </div>
                )}
                </div>
                )}
              </CardContent>
            </Card>

            {/* Carrusel de Reseñas de Google */}
            <Card>
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <svg className="h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Reseñas de clientes</h2>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4].map((i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <div className="relative">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <div className="absolute inset-0 overflow-hidden" style={{ width: '60%' }}>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">4,6</span>
                        <span className="text-sm text-gray-500">· 127 reseñas en Google</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewIndex((reviewIndex - 1 + reviews.length) % reviews.length)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-orange-50 hover:border-orange-400 transition"
                      aria-label="Reseña anterior"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewIndex((reviewIndex + 1) % reviews.length)}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-orange-50 hover:border-orange-400 transition"
                      aria-label="Reseña siguiente"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${reviewIndex * 100}%)` }}
                  >
                    {reviews.map((review, idx) => (
                      <div key={idx} className="w-full flex-shrink-0 px-1">
                        <div className="bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-4 mb-3">
                            <div className={`w-12 h-12 ${review.color} text-white rounded-full flex items-center justify-center font-semibold text-base flex-shrink-0`}>
                              {review.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{review.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            {review.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-5">
                  {reviews.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReviewIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === reviewIndex ? 'bg-orange-500 w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                      }`}
                      aria-label={`Ir a reseña ${idx + 1}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Form - second on mobile, sticky right on desktop */}
          <div className="col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2">
            <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
              {/* Precio y Disponibilidad */}
              <Card className="border-2 border-orange-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="h-6 w-6" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                      </svg>
                      <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">4,6</span>
                          <div className="flex">
                            {[1, 2, 3, 4].map((i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            ))}
                            <div className="relative">
                              <Star className="h-3.5 w-3.5 text-yellow-400" />
                              <div className="absolute inset-0 overflow-hidden" style={{ width: '60%' }}>
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">127 reseñas Google</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Precios: lista vertical en móvil, grid compacto en sm+ */}
                  {product.priceRanges && product.priceRanges.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2 sm:mb-3 text-sm">Descuentos por volumen</h3>
                      <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-4 sm:gap-1.5 md:grid-cols-5">
                        {product.priceRanges.map((range) => {
                          const isActive = quantity >= Number(range.fromQty) && (!range.toQty || quantity <= Number(range.toQty))
                          const rangeLabel = range.toQty
                            ? `${Number(range.fromQty)} - ${Number(range.toQty)} m`
                            : `${Number(range.fromQty)}+ m`
                          return (
                            <button
                              key={range.id}
                              type="button"
                              onClick={() => setQuantity(Number(range.fromQty))}
                              className={`rounded-lg border-2 transition flex items-center justify-between gap-2 px-3 py-2 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:p-1.5 sm:text-center ${
                                isActive
                                  ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                                  : 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
                              }`}
                            >
                              <div className="text-sm font-semibold leading-tight sm:text-[10px]">
                                {rangeLabel}
                              </div>
                              <div className="text-sm font-bold whitespace-nowrap sm:text-xs sm:mt-0.5">
                                {formatCurrency(Number(range.price))}/m
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cantidad + Comprar */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metros
                    </label>
                    {product.slug === 'transfer-dtf' && (
                      <p className="text-xs text-gray-500 mb-2">
                        Cada metro mide 58 cm de ancho × 100 cm de largo
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setQuantity(Math.max(Number(product.minQuantity), quantity - 1))}
                          className="w-11 h-11 p-0 rounded-r-none border-r-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <input
                          type="number"
                          min={Number(product.minQuantity)}
                          max={Number(product.maxQuantity)}
                          step={1}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="text-center text-base font-bold h-11 w-12 border border-gray-300 border-x-0 bg-white focus:outline-none focus:ring-0 px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setQuantity(Math.min(Number(product.maxQuantity), quantity + 1))}
                          className="w-11 h-11 p-0 rounded-l-none border-l-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="flex-1 h-11 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl text-base font-semibold"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {addingToCart ? 'Agregando...' : 'Añadir Metros'}
                      </Button>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-orange-600">
                        {formatCurrency(priceCalc.subtotal)}
                      </span>
                      <span className="text-lg font-semibold text-orange-600">
                        + IVA
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Mín: {Number(product.minQuantity)} • Máx: {Number(product.maxQuantity)}
                    </p>
                  </div>

                  {/* Extras Personalizados - TEMPORALMENTE DESACTIVADO */}
                  {false && (product?.productType === 'DTF_TEXTILE' || product?.productType === 'DTF_UV') && product?.slug === 'transfer-dtf' && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                        ¿Necesitas algo más? Personaliza tu pedido
                      </h3>
                      <div className="space-y-3">
                        {/* Priorizar mi Pedido */}
                        <label className="flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition group">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <input
                                type="checkbox"
                                checked={selectedExtras.prioritize}
                                onChange={(e) => setSelectedExtras({ ...selectedExtras, prioritize: e.target.checked })}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <div>
                                <span className="font-semibold text-gray-900">Priorizar mi Pedido</span>
                                <div className="relative inline-block ml-2">
                                  <HelpCircle className="h-4 w-4 text-gray-400 inline hover:text-orange-600 transition" />
                                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                    Te colocamos en primera posición de la cola y garantizamos que tu pedido salga el mismo día
                                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-orange-700 ml-8 italic">
                              ℹ️ El precio se calcula sobre el TOTAL de metros DTF en tu carrito
                            </p>
                          </div>
                          <span className="font-bold text-orange-600">
                            +{formatCurrency(getExtraPrice('prioritize'))}
                          </span>
                        </label>

                        {/* Maquetación */}
                        <label className="flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition group">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedExtras.layout}
                              onChange={(e) => setSelectedExtras({ ...selectedExtras, layout: e.target.checked })}
                              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <div>
                              <span className="font-semibold text-gray-900">Maquetación</span>
                              <div className="relative inline-block ml-2">
                                <HelpCircle className="h-4 w-4 text-gray-400 inline hover:text-orange-600 transition" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                  Nuestro equipo te ayuda con la maquetación y optimización de tus diseños para obtener el mejor resultado
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-orange-600">
                            +{formatCurrency(getExtraPrice('layout'))}
                          </span>
                        </label>

                        {/* Servicio de Corte */}
                        <label className="flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition group">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedExtras.cutting}
                              onChange={(e) => setSelectedExtras({ ...selectedExtras, cutting: e.target.checked })}
                              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <div>
                              <span className="font-semibold text-gray-900">Servicio de Corte</span>
                              <div className="relative inline-block ml-2">
                                <HelpCircle className="h-4 w-4 text-gray-400 inline hover:text-orange-600 transition" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                  Recortamos cada diseño de tu DTF individualmente para que lleguen listos para aplicar
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-orange-600">
                            +{formatCurrency(getExtraPrice('cutting'))}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Selector de método de envío del diseño */}
                  {(product.productType === 'DTF_TEXTILE' || product.productType === 'DTF_UV' || product.productType === 'SUBLIMATION') && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ¿Cómo quieres enviarnos tu diseño?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setUploadMethod('now')}
                          className={`p-3 rounded-lg border-2 text-sm font-semibold transition ${
                            uploadMethod === 'now'
                              ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          <Upload className="h-4 w-4 inline mr-2" />
                          Subir ahora mis archivos
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod('later')}
                          className={`p-3 rounded-lg border-2 text-sm font-semibold transition ${
                            uploadMethod === 'later'
                              ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          <MessageCircle className="h-4 w-4 inline mr-2" />
                          Subir mis archivos después del pedido
                        </button>
                      </div>

                      {uploadMethod === 'later' && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-green-900 leading-relaxed">
                              Mande su diseño a{' '}
                              <a href="mailto:info@loviprintdtf.es" className="font-semibold underline hover:text-green-700">
                                info@loviprintdtf.es
                              </a>{' '}
                              o a nuestro WhatsApp{' '}
                              <a
                                href="https://wa.me/34614051291"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold underline hover:text-green-700"
                              >
                                614 051 291
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload de Diseño */}
                  {uploadMethod === 'now' && (product.productType === 'DTF_TEXTILE' || product.productType === 'DTF_UV' || product.productType === 'SUBLIMATION') && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="h-4 w-4 inline mr-1" />
                        Subir Diseño *
                      </label>

                      {/* Mensaje informativo sobre tamaño y cantidad + requisitos */}
                      {product.slug === 'transfer-dtf' && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-blue-900 mb-2">
                                📏 Importante: Formato de archivo
                              </p>
                              <p className="text-sm text-blue-800 leading-relaxed mb-3">
                                Suba aquí su <span className="font-semibold">diseño montado en tamaño de metro (100x56cm)</span>.
                                La cantidad de metros que seleccione arriba determinará cuántas copias de este mismo diseño se imprimirán.
                              </p>
                              <p className="text-xs text-blue-900 font-semibold mb-1">Requisitos del archivo:</p>
                              <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Formatos: PNG, PDF, AI, PSD</li>
                                <li>• Resolución mínima: 300 DPI</li>
                                <li>• Fondo transparente (PNG)</li>
                                <li>• Tamaño máximo: 150 MB</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      <FileUpload
                        onFileUpload={setUploadedFile}
                        currentFile={uploadedFile}
                        onRemove={() => setUploadedFile(null)}
                      />

                    </div>
                  )}

                </CardContent>
              </Card>

              {/* Banner de Bonos */}
              {product.category?.slug !== 'sublimacion' && (
                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <Sparkles className="h-6 w-6 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold mb-1">¿Compras regularmente?</h3>
                        <p className="text-sm text-purple-100">Ahorra hasta un 33% con nuestros bonos prepagados</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-purple-700 hover:bg-purple-50 border-0"
                      onClick={() => router.push('/bonos')}
                    >
                      Ver Bonos Disponibles
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
