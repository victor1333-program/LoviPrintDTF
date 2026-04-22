"use client"

import { useState } from "react"
import { ProductWithRelations, Category } from "@/types"
import { ProductCard } from "@/components/ProductCard"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Search, Filter } from "lucide-react"

interface ProductsFilterGridProps {
  products: ProductWithRelations[]
  categories: Category[]
}

export function ProductsFilterGrid({ products, categories }: ProductsFilterGridProps) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase()
    const matchesSearch = term
      ? product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      : true

    const matchesCategory =
      selectedCategory === "all" || product.category?.slug === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <>
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="md:w-64">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: "all", label: "Todas las categorías" },
                  ...categories.map((cat) => ({
                    value: cat.slug,
                    label: cat.name,
                  })),
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando <span className="font-semibold">{filteredProducts.length}</span> productos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
