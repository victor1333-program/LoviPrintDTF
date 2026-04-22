import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/admin/prospects/alerts/count - Count de alertas para badge del sidebar
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const now = new Date()
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59, 999
    )

    // Contar prospectos con fecha de próxima acción <= hoy
    const count = await prisma.prospect.count({
      where: {
        fechaProximaAccion: {
          lte: endOfToday
        }
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching prospect alerts count:', error)
    return NextResponse.json(
      { error: 'Error al obtener conteo de alertas' },
      { status: 500 }
    )
  }
}
