import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { street, city, state, postalCode, country } = body

    // Validaciones
    if (!street || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Todos los campos de la dirección son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la dirección pertenece al usuario
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    })

    if (!existingAddress || existingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      )
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        street,
        city,
        state,
        postalCode,
        country,
      },
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({ error: 'Error al actualizar la dirección' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la dirección pertenece al usuario
    const address = await prisma.address.findUnique({
      where: { id },
    })

    if (!address || address.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar la dirección predeterminada si hay más direcciones
    if (address.isDefault) {
      const otherAddresses = await prisma.address.count({
        where: {
          userId: session.user.id,
          id: { not: id },
        },
      })

      if (otherAddresses > 0) {
        return NextResponse.json(
          { error: 'No puedes eliminar la dirección predeterminada. Establece otra dirección como predeterminada primero.' },
          { status: 400 }
        )
      }
    }

    await prisma.address.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Error al eliminar la dirección' }, { status: 500 })
  }
}
