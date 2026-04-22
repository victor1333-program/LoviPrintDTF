import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/search?email=xxx
 * Busca un usuario por email
 * Solo accesible para admins
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        totalSpent: true,
      }
    })

    if (!user) {
      return NextResponse.json(null, { status: 200 })
    }

    return NextResponse.json(user, { status: 200 })

  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json(
      { error: 'Error al buscar usuario' },
      { status: 500 }
    )
  }
}
