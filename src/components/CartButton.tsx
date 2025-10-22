"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "./ui/Button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"

export function CartButton() {
  const [itemCount, setItemCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)

  useEffect(() => {
    loadCartData()

    // Escuchar evento de actualización del carrito
    const handleCartUpdate = () => loadCartData()
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const loadCartData = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()

      const itemsCount = data.items?.length || 0
      setItemCount(itemsCount)

      // Usar el subtotal calculado por el backend (ya incluye descuentos por bonos, extras, etc.)
      const total = data.subtotal || 0

      setCartTotal(total)
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  return (
    <Link href="/carrito">
      <Button variant="outline" size="sm" className="relative hover:bg-orange-50 hover:border-orange-300 transition-colors">
        <ShoppingCart className="h-4 w-4 mr-2" />
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium">Carrito</span>
          {itemCount > 0 && (
            <span className="text-xs text-gray-600">
              {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'} • {formatCurrency(cartTotal)}
            </span>
          )}
        </div>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
            {itemCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
