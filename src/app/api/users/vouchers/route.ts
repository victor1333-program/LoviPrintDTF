import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/users/vouchers?userId=xxx - Obtener bonos activos de un usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    // Buscar vouchers activos del usuario
    const activeVouchers = await prisma.voucher.findMany({
      where: {
        userId,
        isActive: true,
        isTemplate: false,
        remainingMeters: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: {
        createdAt: 'asc' // El más antiguo primero
      }
    })

    return NextResponse.json(activeVouchers)

  } catch (error) {
    console.error('Error getting user vouchers:', error)
    return NextResponse.json({ error: 'Error al obtener bonos del usuario' }, { status: 500 })
  }
}
