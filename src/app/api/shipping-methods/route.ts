import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/shipping-methods - Obtener métodos de envío activos
export async function GET() {
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    // Serializar para convertir Decimal a número
    const serializedMethods = methods.map(method => ({
      ...method,
      price: Number(method.price)
    }))

    return NextResponse.json(serializedMethods)
  } catch (error) {
    console.error('Error fetching shipping methods:', error)
    return NextResponse.json(
      { error: 'Error al obtener métodos de envío' },
      { status: 500 }
    )
  }
}
