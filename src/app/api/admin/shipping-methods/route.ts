import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/shipping-methods - Listar todos los métodos
export async function GET() {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const methods = await prisma.shippingMethod.findMany({
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

// POST /api/admin/shipping-methods - Crear nuevo método
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, price, estimatedDays, isActive, order } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Nombre y precio son obligatorios' },
        { status: 400 }
      )
    }

    const method = await prisma.shippingMethod.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        estimatedDays,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    // Serializar para convertir Decimal a número
    const serializedMethod = {
      ...method,
      price: Number(method.price)
    }

    return NextResponse.json(serializedMethod)
  } catch (error) {
    console.error('Error creating shipping method:', error)
    return NextResponse.json(
      { error: 'Error al crear método de envío' },
      { status: 500 }
    )
  }
}
