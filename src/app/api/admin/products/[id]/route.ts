import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { priceRanges, ...productData } = body

    // Si hay price ranges, eliminar los existentes y crear los nuevos
    if (priceRanges !== undefined) {
      await prisma.priceRange.deleteMany({
        where: { productId: id },
      })
    }

    const product = await prisma.product.update({
      where: { id },
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
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el producto (esto eliminará en cascada los price ranges)
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
