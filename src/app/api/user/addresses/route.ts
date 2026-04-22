import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Error al obtener las direcciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { street, city, state, postalCode, country, isDefault: requestedDefault } = body

    // Validaciones
    if (!street || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Calle, ciudad, código postal y país son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario tiene direcciones
    const existingAddresses = await prisma.address.count({
      where: { userId: session.user.id },
    })

    // Si es la primera dirección, siempre es la predeterminada.
    // Si el cliente pidió marcarla como predeterminada, desmarcamos las demás.
    const isFirstAddress = existingAddresses === 0
    const shouldBeDefault = isFirstAddress || requestedDefault === true

    if (shouldBeDefault && !isFirstAddress) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        street,
        city,
        state,
        postalCode,
        country,
        isDefault: shouldBeDefault,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ error: 'Error al crear la dirección' }, { status: 500 })
  }
}
