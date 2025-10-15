import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const vouchers = await prisma.voucher.findMany({
      where: {
        userId: session.user.id, // Solo bonos asignados al usuario
        isTemplate: false,        // Excluir plantillas
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error fetching user vouchers:', error)
    return NextResponse.json(
      { error: 'Error al cargar bonos' },
      { status: 500 }
    )
  }
}
