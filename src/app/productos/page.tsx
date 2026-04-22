import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ProductsFilterGrid } from "@/components/ProductsFilterGrid"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Productos DTF - Impresión Profesional | LoviPrintDTF",
  description: "Catálogo de productos DTF: transfers para textil, impresión por metros y superficies rígidas. Precios por volumen, entrega en 24-48h, envío gratis +100€.",
  keywords: ["productos DTF", "transfer DTF", "catálogo DTF", "impresión textil DTF", "DTF por metros"],
  alternates: { canonical: "https://loviprintdtf.es/productos" },
  openGraph: {
    title: "Catálogo de Productos DTF - LoviPrintDTF",
    description: "Impresión DTF de alta calidad. Precios por volumen, entrega rápida.",
    url: "https://loviprintdtf.es/productos",
    type: "website",
  },
}

export default async function ProductosPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        priceRanges: { orderBy: { fromQty: "asc" } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Nuestros Productos DTF
            </h1>
            <p className="text-xl text-primary-100">
              Impresión DTF de alta calidad para textil y superficies rígidas.
              Precios competitivos y entrega rápida garantizada.
            </p>
          </div>
        </div>
      </section>

      <ProductsFilterGrid products={products as any} categories={categories as any} />

      <section className="bg-primary-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Contacta con nuestro equipo y te ayudaremos a encontrar la solución perfecta para tu proyecto
          </p>
          <a
            href="/contacto"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
          >
            Contactar con ventas
          </a>
        </div>
      </section>
    </div>
  )
}
