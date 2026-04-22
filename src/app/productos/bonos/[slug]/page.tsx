import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import VoucherDetailClient from "./VoucherDetailClient"
import type { ProductWithRelations } from "@/types"

export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getVoucher(slug: string) {
  return prisma.voucher.findFirst({
    where: { slug, isTemplate: true, isActive: true },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const voucher = await getVoucher(slug)

  if (!voucher) {
    return {
      title: "Bono no encontrado",
      robots: { index: false, follow: false },
    }
  }

  const title = `${voucher.name} - Bono DTF Prepagado | LoviPrintDTF`
  const description = voucher.description?.slice(0, 155) ||
    `${voucher.name}: ${voucher.initialMeters} metros de impresión DTF con ${voucher.initialShipments} envíos incluidos. Sin caducidad, ahorra hasta 33%.`
  const url = `https://loviprintdtf.es/productos/bonos/${voucher.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: voucher.imageUrl ? [{ url: voucher.imageUrl, alt: voucher.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: voucher.imageUrl ? [voucher.imageUrl] : undefined,
    },
  }
}

export default async function VoucherProductPage({ params }: PageProps) {
  const { slug } = await params
  const voucher = await getVoucher(slug)

  if (!voucher) {
    notFound()
  }

  const product = {
    id: voucher.id,
    name: voucher.name,
    slug: voucher.slug,
    description: voucher.description,
    shortDescription: `Bono prepagado de ${voucher.initialMeters} metros de Transfer DTF`,
    categoryId: "",
    productType: "VOUCHER",
    basePrice: voucher.price,
    unit: "unidad",
    minQuantity: voucher.initialMeters,
    maxQuantity: voucher.initialMeters,
    imageUrl: voucher.imageUrl,
    images: null,
    specifications: null,
    isActive: voucher.isActive,
    isFeatured: false,
    stockStatus: "IN_STOCK",
    metadata: null,
    createdAt: voucher.createdAt,
    updatedAt: voucher.updatedAt,
  } as unknown as ProductWithRelations

  return (
    <VoucherDetailClient
      product={product}
      initialShipments={voucher.initialShipments || 0}
    />
  )
}
