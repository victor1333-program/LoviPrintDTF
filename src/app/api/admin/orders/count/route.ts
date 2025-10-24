import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    // Verificar que el usuario sea admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Contar pedidos con estado CONFIRMED (pagados y confirmados, listos para atender)
    const confirmedCount = await prisma.order.count({
      where: {
        status: 'CONFIRMED'
      }
    })

    return NextResponse.json({ count: confirmedCount })

  } catch (error) {
    console.error('Error al contar pedidos confirmados:', error)
    return NextResponse.json(
      { error: 'Error al contar pedidos' },
      { status: 500 }
    )
  }
}
