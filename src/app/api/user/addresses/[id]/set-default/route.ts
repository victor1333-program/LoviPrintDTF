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

    // Usar una transacción para asegurar consistencia
    await prisma.$transaction([
      // Quitar isDefault de todas las direcciones del usuario
      prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      // Establecer esta dirección como predeterminada
      prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ])

    const updatedAddress = await prisma.address.findUnique({
      where: { id },
    })

    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error('Error setting default address:', error)
    return NextResponse.json(
      { error: 'Error al establecer la dirección predeterminada' },
      { status: 500 }
    )
  }
}
