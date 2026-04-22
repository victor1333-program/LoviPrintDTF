"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ChevronDown, HelpCircle, Search } from "lucide-react"

export type FAQCategory = "general" | "tecnico" | "pedidos" | "bonos" | "envios" | "calidad"

export interface FAQItem {
  id: number
  question: string
  answer: string
  category: FAQCategory
}

interface CategoryMeta {
  name: string
  color: string
  count: number
}

interface FAQListProps {
  faqs: FAQItem[]
  categories: Record<string, CategoryMeta>
}

export function FAQList({ faqs, categories }: FAQListProps) {
  const [openId, setOpenId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term)
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar pregunta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-300"
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === key
                ? "bg-orange-600 text-white shadow-lg scale-105"
                : `${cat.color} hover:scale-105`
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              No se encontraron preguntas que coincidan con tu búsqueda
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setActiveCategory("all")
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <Card
                key={faq.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
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
                      openId === faq.id ? "transform rotate-180 text-orange-600" : ""
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    openId === faq.id ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 pb-5 pt-2">
                    <div className="pl-4 border-l-4 border-orange-400">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
