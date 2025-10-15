import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { voucherId, userId } = await request.json()

    if (!voucherId || !userId) {
      return NextResponse.json(
        { error: 'Faltan parámetros' },
        { status: 400 }
      )
    }

    // Obtener el bono plantilla
    const template = await prisma.voucher.findUnique({
      where: { id: voucherId },
    })

    if (!template || !template.isTemplate) {
      return NextResponse.json(
        { error: 'Bono no encontrado o no es una plantilla' },
        { status: 404 }
      )
    }

    // Generar código único para el bono asignado
    const code = `${template.code}-${Date.now()}`

    // Crear una copia del bono asignada al usuario
    const assignedVoucher = await prisma.voucher.create({
      data: {
        name: template.name,
        slug: `${template.slug}-${userId}-${Date.now()}`,
        description: template.description,
        imageUrl: template.imageUrl,
        price: template.price,
        productId: template.productId,
        userId: userId,
        code,
        type: template.type,
        initialMeters: template.initialMeters,
        remainingMeters: template.initialMeters,
        initialShipments: template.initialShipments,
        remainingShipments: template.initialShipments,
        expiresAt: template.expiresAt,
        isActive: true,
        isTemplate: false,
        usageCount: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(assignedVoucher)
  } catch (error) {
    console.error('Error assigning voucher:', error)
    return NextResponse.json(
      { error: 'Error al asignar bono' },
      { status: 500 }
    )
  }
}
