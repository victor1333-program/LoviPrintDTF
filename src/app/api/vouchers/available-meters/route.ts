import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * GET /api/vouchers/available-meters
 *
 * Obtiene los bonos de metros disponibles del usuario para productos DTF
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener bonos de metros activos del usuario
    const meterVouchers = await prisma.voucher.findMany({
      where: {
        userId: session.user.id,
        isTemplate: false,
        isActive: true,
        type: 'METERS',
        remainingMeters: {
          gt: 0
        }
      },
      orderBy: {
        createdAt: 'asc', // Usar los más antiguos primero (FIFO)
      },
    })

    // Calcular total de metros disponibles
    const totalMetersAvailable = meterVouchers.reduce(
      (sum, voucher) => sum + Number(voucher.remainingMeters),
      0
    )

    return NextResponse.json({
      vouchers: meterVouchers,
      totalMetersAvailable,
    })
  } catch (error) {
    console.error('Error fetching available meters:', error)
    return NextResponse.json(
      { error: 'Error al cargar metros disponibles' },
      { status: 500 }
    )
  }
}
