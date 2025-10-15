import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProductType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const type = searchParams.get('type') as ProductType | null
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search')

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = {
        slug: category,
      }
    }

    if (type) {
      where.productType = type
    }

    if (featured) {
      where.isFeatured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        priceRanges: {
          orderBy: {
            fromQty: 'asc',
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error al cargar productos' },
      { status: 500 }
    )
  }
}
