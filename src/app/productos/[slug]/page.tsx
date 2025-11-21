"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Script from "next/script"
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
  MessageCircle
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { calculateUnitPrice } from "@/lib/pricing"
import { FileUpload } from "@/components/FileUpload"
import toast from "react-hot-toast"

interface UploadedFileData {
  url: string
  name: string
  size: number
  publicId?: string
  metadata?: any
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<ProductWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<UploadedFileData | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedExtras, setSelectedExtras] = useState({
    prioritize: false,
    layout: false,
    cutting: false
  })

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
    loadProduct()
  }, [params.slug])

  const loadProduct = async () => {
    try {
      // Obtener todos los productos y buscar por slug
      const res = await fetch(`/api/products`)
      const products = await res.json()
      const foundProduct = products.find((p: any) => p.slug === params.slug)

      if (foundProduct) {
        setProduct(foundProduct)
      }
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

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
    if (!product) return

    // Validar archivo si es DTF textil o UV DTF
    if ((product.productType === 'DTF_TEXTILE' || product.productType === 'DTF_UV') && !uploadedFile) {
      toast.error('Por favor sube tu diseño antes de agregar al carrito')
      return
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
        toast.success('Producto agregado al carrito')
        // Disparar evento para actualizar el botón del carrito
        window.dispatchEvent(new Event('cartUpdated'))
        router.push('/carrito')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Button onClick={() => router.push('/productos')}>
            Volver a productos
          </Button>
        </div>
      </div>
    )
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

  // Schema.org Product
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl || "https://loviprintdtf.es/logo.png",
    "description": product.description || product.shortDescription || "Transfer DTF de alta calidad",
    "sku": product.slug,
    "brand": {
      "@type": "Brand",
      "name": "LoviPrintDTF"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "lowPrice": product.priceRanges && product.priceRanges.length > 0
        ? Number(product.priceRanges[product.priceRanges.length - 1].price).toFixed(2)
        : Number(product.basePrice).toFixed(2),
      "highPrice": Number(product.basePrice).toFixed(2),
      "availability": product.stockStatus === 'IN_STOCK'
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "url": `https://loviprintdtf.es/productos/${product.slug}`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  } : null

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://loviprintdtf.es"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Productos",
        "item": "https://loviprintdtf.es/productos"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://loviprintdtf.es/productos/${product.slug}`
      }
    ]
  }

  return (
    <>
      {productSchema && (
        <Script
          id="schema-product"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
          <p className="text-lg sm:text-xl text-orange-100 max-w-3xl">{product.shortDescription}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Product Image & Features */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Image */}
            <Card className="overflow-hidden">
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
                    <div className="text-orange-300 text-9xl font-bold">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Características Principales */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="h-6 w-6 text-orange-600" />
                  Características Principales
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
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
                </div>
              </CardContent>
            </Card>

            {/* Descripción Detallada */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                  Descripción del Producto
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700">
                  {product.description ? (
                    <p className="leading-relaxed">{product.description}</p>
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
              </CardContent>
            </Card>

            {/* Especificaciones Técnicas */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Info className="h-6 w-6 text-orange-600" />
                  Especificaciones Técnicas
                </h2>
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
                {product.specifications && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase">Especificaciones Adicionales</h3>
                    <dl className="grid md:grid-cols-2 gap-3">
                      {Object.entries(product.specifications as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b text-sm">
                          <dt className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</dt>
                          <dd className="font-medium">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instrucciones de Aplicación */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2 text-orange-900">
                  <CheckCircle2 className="h-6 w-6 text-orange-600" />
                  Instrucciones de Aplicación
                </h2>
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sticky Order Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Precio y Disponibilidad */}
              <Card className="border-2 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Precio desde</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {formatCurrency(priceCalc.unitPrice)}
                        <span className="text-base text-gray-600 font-normal">/{product.unit}</span>
                      </p>
                    </div>
                    {product.stockStatus === 'IN_STOCK' && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Disponible
                      </Badge>
                    )}
                  </div>

                  {/* Tabla de Precios */}
                  {product.priceRanges && product.priceRanges.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 text-sm">Descuentos por volumen</h3>
                      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="space-y-2 min-w-[300px]">
                          {product.priceRanges.map((range) => {
                            const isActive = quantity >= Number(range.fromQty) && (!range.toQty || quantity <= Number(range.toQty))
                            return (
                              <div
                                key={range.id}
                                className={`flex justify-between items-center text-sm p-2 rounded ${
                                  isActive ? 'bg-orange-100 border border-orange-300' : 'bg-gray-50'
                                }`}
                              >
                                <span className={isActive ? 'font-semibold text-orange-900' : 'text-gray-600'}>
                                  {Number(range.fromQty)}
                                  {range.toQty ? ` - ${Number(range.toQty)}` : '+'}
                                  {' '}{product.unit}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isActive ? 'text-orange-600' : ''}`}>
                                    {formatCurrency(Number(range.price))}
                                  </span>
                                  {range.discountPct && Number(range.discountPct) > 0 && (
                                    <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                                      -{Number(range.discountPct).toFixed(0)}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cantidad */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad ({product.unit})
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(Number(product.minQuantity), quantity - 1))}
                        className="w-10 h-10 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        type="number"
                        min={Number(product.minQuantity)}
                        max={Number(product.maxQuantity)}
                        step={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="text-center text-xl font-bold h-10 flex-1 max-w-24"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuantity(Math.min(Number(product.maxQuantity), quantity + 1))}
                        className="w-10 h-10 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Mín: {Number(product.minQuantity)} • Máx: {Number(product.maxQuantity)}
                    </p>
                  </div>

                  {/* Extras Personalizados */}
                  {(product.productType === 'DTF_TEXTILE' || product.productType === 'DTF_UV') && product.slug === 'transfer-dtf' && (
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

                  {/* Upload de Diseño */}
                  {(product.productType === 'DTF_TEXTILE' || product.productType === 'DTF_UV') && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="h-4 w-4 inline mr-1" />
                        Subir Diseño *
                      </label>

                      {/* Mensaje informativo sobre tamaño y cantidad */}
                      {product.slug === 'transfer-dtf' && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-blue-900 mb-2">
                                📏 Importante: Formato de archivo
                              </p>
                              <p className="text-sm text-blue-800 leading-relaxed">
                                Suba aquí su <span className="font-semibold">diseño montado en tamaño de metro (100x56cm)</span>.
                                La cantidad de metros que seleccione arriba determinará cuántas copias de este mismo diseño se imprimirán.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <FileUpload
                        onFileUpload={setUploadedFile}
                        currentFile={uploadedFile}
                        onRemove={() => setUploadedFile(null)}
                      />

                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-900 font-medium mb-1">Requisitos del archivo:</p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Formatos: PNG, PDF, AI, PSD</li>
                          <li>• Resolución mínima: 300 DPI</li>
                          <li>• Fondo transparente (PNG)</li>
                          <li>• Tamaño máximo: 150 MB</li>
                        </ul>
                      </div>

                      {/* Instrucciones para múltiples diseños */}
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-orange-900 mb-1">¿Necesitas diferentes diseños?</p>
                            <p className="text-xs text-orange-800">
                              Si quieres añadir varios metros con diseños diferentes, añade primero estos metros con su diseño al carrito,
                              y luego vuelve a esta página para añadir otros metros con otro diseño. En el carrito aparecerán como productos separados.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Información de WeTransfer */}
                      <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                        <div className="flex items-start gap-3">
                          <Upload className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-purple-900 mb-2">¿Archivos muy pesados?</p>
                            <p className="text-xs text-purple-800 mb-2">
                              Si tus diseños superan el límite de 150 MB, envíalos a través de WeTransfer
                            </p>
                            <div className="flex flex-col gap-2 text-xs text-purple-700">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">1.</span>
                                <span>Sube tus archivos en <a href="https://wetransfer.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-purple-900">wetransfer.com</a></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">2.</span>
                                <span>Usa el mismo email de tu pedido como destinatario</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">3.</span>
                                <span>Incluye tu número de pedido en el mensaje</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ayuda con metros */}
                      <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-900 mb-2">¿No sabes cuántos metros necesitas?</p>
                            <p className="text-xs text-orange-800 mb-3">
                              No te preocupes, nuestro equipo te ayudará a calcular la cantidad exacta según tus diseños
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                onClick={() => router.push('/solicitar-presupuesto')}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
                              >
                                <FileText className="h-4 w-4" />
                                Solicitar Presupuesto
                              </Button>
                              <a
                                href="https://wa.me/34614040296?text=Hola,%20necesito%20ayuda%20para%20calcular%20los%20metros%20de%20mi%20pedido%20DTF"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
                              >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Precio */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-6 border">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">Precio unitario:</span>
                      <span className="font-semibold">{formatCurrency(priceCalc.unitPrice)}</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">Cantidad:</span>
                      <span className="font-semibold">{quantity} {product.unit}</span>
                    </div>
                    {priceCalc.discountPct > 0 && (
                      <div className="flex justify-between mb-2 text-sm text-green-600">
                        <span>Descuento ({priceCalc.discountPct.toFixed(0)}%):</span>
                        <span className="font-semibold">-{formatCurrency(priceCalc.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(priceCalc.subtotal)}</span>
                    </div>

                    {/* Mostrar extras si están seleccionados */}
                    {(selectedExtras.prioritize || selectedExtras.layout || selectedExtras.cutting) && (
                      <div className="border-t pt-2 pb-2 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Extras:</p>
                        {selectedExtras.prioritize && (
                          <div className="flex justify-between text-sm text-orange-700">
                            <span>• Priorizar mi Pedido</span>
                            <span className="font-semibold">+{formatCurrency(getExtraPrice('prioritize'))}</span>
                          </div>
                        )}
                        {selectedExtras.layout && (
                          <div className="flex justify-between text-sm text-orange-700">
                            <span>• Maquetación</span>
                            <span className="font-semibold">+{formatCurrency(getExtraPrice('layout'))}</span>
                          </div>
                        )}
                        {selectedExtras.cutting && (
                          <div className="flex justify-between text-sm text-orange-700">
                            <span>• Servicio de Corte</span>
                            <span className="font-semibold">+{formatCurrency(getExtraPrice('cutting'))}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-3xl font-bold text-orange-600">
                        {formatCurrency(totalWithExtras)}
                      </span>
                    </div>
                  </div>

                  {/* Botón de Compra */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full h-12 text-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {addingToCart ? 'Agregando...' : 'Agregar al Carrito'}
                  </Button>

                  {/* Garantías */}
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Truck className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span>Envío 24-48h laborables</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Shield className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span>Garantía de calidad total</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Droplets className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span>Resistente a 50+ lavados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Banner de Bonos */}
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
                <CardContent className="p-6">
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
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
