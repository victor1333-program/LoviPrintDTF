import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProductDetailClient from "./ProductDetailClient"
import type { ProductWithRelations } from "@/types"

export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      priceRanges: { orderBy: { fromQty: "asc" } },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: false },
    }
  }

  const title = `${product.name} - LoviPrintDTF`
  const description = product.shortDescription || product.description?.slice(0, 155) || `Compra ${product.name} - Impresión DTF profesional con entrega en 24-48h, precios por volumen y envío gratis en pedidos +100€.`
  const url = `https://loviprintdtf.es/productos/${product.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl || "https://loviprintdtf.es/logo.png",
    "description": product.description || product.shortDescription || "Transfer DTF de alta calidad",
    "sku": product.slug,
    "brand": { "@type": "Brand", "name": "LoviPrintDTF" },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "lowPrice": product.priceRanges && product.priceRanges.length > 0
        ? Number(product.priceRanges[product.priceRanges.length - 1].price).toFixed(2)
        : Number(product.basePrice).toFixed(2),
      "highPrice": Number(product.basePrice).toFixed(2),
      "availability": product.stockStatus === "IN_STOCK"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "url": `https://loviprintdtf.es/productos/${product.slug}`,
    },
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://loviprintdtf.es" },
      { "@type": "ListItem", "position": 2, "name": "Productos", "item": "https://loviprintdtf.es/productos" },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://loviprintdtf.es/productos/${product.slug}` },
    ],
  }

  return (
    <>
      <Script
        id="schema-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={product as unknown as ProductWithRelations} />
    </>
  )
}
