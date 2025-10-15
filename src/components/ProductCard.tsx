"use client"

import { ProductWithRelations } from "@/types"
import { Card, CardContent } from "./ui/Card"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"
import { ShoppingCart, Zap } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface ProductCardProps {
  product: ProductWithRelations
  onAddToCart?: (productId: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const minPrice = product.priceRanges && product.priceRanges.length > 0
    ? Math.min(...product.priceRanges.map(r => Number(r.price)))
    : Number(product.basePrice)

  const maxDiscount = product.priceRanges && product.priceRanges.length > 0
    ? Math.max(...product.priceRanges.map(r => Number(r.discountPct || 0)))
    : 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/productos/${product.slug}`}>
        <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-primary-400 text-6xl font-bold">
              {product.name.charAt(0)}
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-semibold text-lg hover:text-primary-600 transition">
              {product.name}
            </h3>
          </Link>
          {product.isFeatured && (
            <Badge variant="warning" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Destacado
            </Badge>
          )}
        </div>

        {product.shortDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="info">{product.category?.name}</Badge>
          {product.stockStatus === 'IN_STOCK' && (
            <Badge variant="success">Disponible</Badge>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-primary-600">
            Desde {formatCurrency(minPrice)}
          </span>
          <span className="text-sm text-gray-500">/{product.unit}</span>
          {maxDiscount > 0 && (
            <Badge variant="error">-{maxDiscount.toFixed(0)}%</Badge>
          )}
        </div>

        <Link href={`/productos/${product.slug}`}>
          <Button className="w-full" size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ver Detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
