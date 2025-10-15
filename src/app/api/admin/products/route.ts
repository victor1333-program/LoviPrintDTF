import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { priceRanges, ...productData } = body

    // Crear el producto
    const product = await prisma.product.create({
      data: {
        ...productData,
        priceRanges: priceRanges && priceRanges.length > 0 ? {
          create: priceRanges.map((range: any) => ({
            fromQty: range.fromQty,
            toQty: range.toQty || null,
            price: range.price,
            discountPct: range.discountPct || null,
          }))
        } : undefined,
      },
      include: {
        category: true,
        priceRanges: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
