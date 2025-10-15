import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        loyaltyPoints: true,
        isProfessional: true,
        emailVerified: true,
        company: true,
        taxId: true,
        professionalDiscount: true,
        shippingAddress: true,
        totalSpent: true,
        loyaltyTier: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener datos de loyalty_points para información más precisa
    const loyaltyData = await prisma.loyaltyPoints.findUnique({
      where: { userId: session.user.id },
      select: {
        totalPoints: true,
        availablePoints: true,
        lifetimePoints: true,
        tier: true,
      },
    })

    // Combinar datos del usuario con datos de loyalty
    const response = {
      ...user,
      loyaltyPoints: loyaltyData?.availablePoints ?? user.loyaltyPoints,
      lifetimePoints: loyaltyData?.lifetimePoints ?? 0,
      loyaltyTier: loyaltyData?.tier ?? user.loyaltyTier,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al cargar datos del usuario' },
      { status: 500 }
    )
  }
}
