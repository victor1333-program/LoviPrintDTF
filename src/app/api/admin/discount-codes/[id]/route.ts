import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET - Obtener un código de descuento específico
export async function GET(
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

    const discountCode = await prisma.discountCode.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        usageHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            usageHistory: true,
            orders: true,
          },
        },
      },
    })

    if (!discountCode) {
      return NextResponse.json(
        { error: 'Código de descuento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(discountCode)
  } catch (error) {
    console.error('Error fetching discount code:', error)
    return NextResponse.json(
      { error: 'Error al cargar código de descuento' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar un código de descuento
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

    // Validar que el código no exista (si se está actualizando)
    if (body.code) {
      const existing = await prisma.discountCode.findUnique({
        where: { code: body.code },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'El código ya existe' },
          { status: 400 }
        )
      }
    }

    // Validar que si no es global, tenga un productId
    if (body.isGlobal === false && !body.productId) {
      return NextResponse.json(
        { error: 'Debe especificar un producto si el descuento no es global' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (body.code !== undefined) updateData.code = body.code
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.value !== undefined) updateData.value = body.value
    if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled
    if (body.isGlobal !== undefined) updateData.isGlobal = body.isGlobal
    if (body.productId !== undefined) updateData.productId = body.productId
    if (body.minPurchase !== undefined) updateData.minPurchase = body.minPurchase
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses
    if (body.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = body.maxUsesPerUser
    if (body.validFrom !== undefined) updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null

    const discountCode = await prisma.discountCode.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(discountCode)
  } catch (error) {
    console.error('Error updating discount code:', error)
    return NextResponse.json(
      { error: 'Error al actualizar código de descuento' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un código de descuento
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

    await prisma.discountCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting discount code:', error)
    return NextResponse.json(
      { error: 'Error al eliminar código de descuento' },
      { status: 500 }
    )
  }
}
