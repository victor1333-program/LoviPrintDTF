import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los bonos del usuario
    const vouchers = await prisma.voucher.findMany({
      where: {
        userId: user.id,
        isTemplate: false, // Solo bonos asignados, no plantillas
      },
      orderBy: [
        { isActive: 'desc' }, // Activos primero
        { createdAt: 'desc' }, // Más recientes primero
      ],
    })

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error loading user vouchers:', error)
    return NextResponse.json(
      { error: 'Error al cargar bonos' },
      { status: 500 }
    )
  }
}
