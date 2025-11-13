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

    // Verificar si hay un parámetro userId (solo para admins)
    const { searchParams } = new URL(req.url)
    const requestedUserId = searchParams.get('userId')

    let targetUserId: string

    if (requestedUserId) {
      // Si se solicita un userId específico, verificar que el usuario actual sea admin
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado para consultar bonos de otros usuarios' },
          { status: 403 }
        )
      }
      targetUserId = requestedUserId
    } else {
      // Si no hay userId en la query, usar el usuario autenticado
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }
      targetUserId = user.id
    }

    // Obtener todos los bonos del usuario objetivo
    const vouchers = await prisma.voucher.findMany({
      where: {
        userId: targetUserId,
        isTemplate: false, // Solo bonos asignados, no plantillas
      },
      orderBy: [
        { isActive: 'desc' }, // Activos primero
        { createdAt: 'desc' }, // Más recientes primero
      ],
    })

    return NextResponse.json({ vouchers })
  } catch (error) {
    console.error('Error loading user vouchers:', error)
    return NextResponse.json(
      { error: 'Error al cargar bonos' },
      { status: 500 }
    )
  }
}
