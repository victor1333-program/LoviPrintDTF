import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/admin/prospects/alerts - Prospectos con acción pendiente hoy o vencida
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

    // Obtener prospectos con fecha de próxima acción <= hoy
    // Ordenados por fecha (más antiguas primero = más urgentes)
    const alerts = await prisma.prospect.findMany({
      where: {
        fechaProximaAccion: {
          lte: endOfToday
        }
      },
      orderBy: {
        fechaProximaAccion: 'asc'
      },
      select: {
        id: true,
        empresa: true,
        contacto: true,
        telefono: true,
        estado: true,
        proximaAccion: true,
        fechaProximaAccion: true,
        notaClave: true
      }
    })

    // Calcular días vencidos para cada alerta
    const alertsWithDays = alerts.map(alert => {
      const fechaAccion = alert.fechaProximaAccion
      let diasVencidos = 0

      if (fechaAccion) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const actionDate = new Date(
          fechaAccion.getFullYear(),
          fechaAccion.getMonth(),
          fechaAccion.getDate()
        )
        diasVencidos = Math.floor(
          (today.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      return {
        ...alert,
        diasVencidos: Math.max(0, diasVencidos) // 0 si es hoy, positivo si está vencido
      }
    })

    return NextResponse.json(alertsWithDays)
  } catch (error) {
    console.error('Error fetching prospect alerts:', error)
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    )
  }
}
