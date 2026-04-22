import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/admin/prospects/stats - Estadísticas de prospectos
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

    // Ejecutar todas las consultas en paralelo
    const [
      totalActivos,
      verdeCount,
      amarilloCount,
      rojoCount,
      pendientesHoy,
      pendientesSemana
    ] = await Promise.all([
      // Total activos (no rojos)
      prisma.prospect.count({
        where: {
          estado: { not: 'ROJO' }
        }
      }),
      // Verdes
      prisma.prospect.count({
        where: { estado: 'VERDE' }
      }),
      // Amarillos
      prisma.prospect.count({
        where: { estado: 'AMARILLO' }
      }),
      // Rojos
      prisma.prospect.count({
        where: { estado: 'ROJO' }
      }),
      // Pendientes hoy (fecha <= hoy)
      prisma.prospect.count({
        where: {
          fechaProximaAccion: {
            lte: endOfToday
          }
        }
      }),
      // Pendientes esta semana (fecha <= hoy + 7 días)
      prisma.prospect.count({
        where: {
          fechaProximaAccion: {
            lte: endOfWeek
          }
        }
      })
    ])

    return NextResponse.json({
      totalActivos,
      porEstado: {
        verde: verdeCount,
        amarillo: amarilloCount,
        rojo: rojoCount
      },
      pendientesHoy,
      pendientesSemana
    })
  } catch (error) {
    console.error('Error fetching prospect stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
