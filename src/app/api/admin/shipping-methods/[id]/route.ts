import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/shipping-methods/[id] - Actualizar método
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, price, estimatedDays, isActive, order } = body

    const method = await prisma.shippingMethod.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(estimatedDays !== undefined && { estimatedDays }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    })

    // Serializar para convertir Decimal a número
    const serializedMethod = {
      ...method,
      price: Number(method.price)
    }

    return NextResponse.json(serializedMethod)
  } catch (error) {
    console.error('Error updating shipping method:', error)
    return NextResponse.json(
      { error: 'Error al actualizar método de envío' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/shipping-methods/[id] - Eliminar método
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await prisma.shippingMethod.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping method:', error)
    return NextResponse.json(
      { error: 'Error al eliminar método de envío' },
      { status: 500 }
    )
  }
}
