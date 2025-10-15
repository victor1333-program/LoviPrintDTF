import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Obtener todos los vouchers que son plantillas (disponibles para comprar)
    const templates = await prisma.voucher.findMany({
      where: {
        isTemplate: true,
        isActive: true,
      },
      orderBy: {
        initialMeters: 'asc', // Ordenar por metros ascendente
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error loading voucher templates:', error)
    return NextResponse.json(
      { error: 'Error al cargar plantillas de bonos' },
      { status: 500 }
    )
  }
}
