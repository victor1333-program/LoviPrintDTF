import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateVoucherSchema = z.object({
  remainingMeters: z.number().min(0).optional(),
  remainingShipments: z.number().int().min(0).optional(),
  metersDelta: z.number().optional(),
  shipmentsDelta: z.number().int().optional(),
  // Campos adicionales para actualizar plantillas
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  price: z.number().optional(),
  productId: z.string().nullable().optional(),
  initialMeters: z.number().optional(),
  initialShipments: z.number().int().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateVoucherSchema.parse(body)

    // Obtener el bono actual
    const currentVoucher = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!currentVoucher) {
      return NextResponse.json({ error: 'Bono no encontrado' }, { status: 404 })
    }

    // Construir objeto de actualización
    let updateData: any = {}

    // Campos de plantilla
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.productId !== undefined) updateData.productId = validatedData.productId
    if (validatedData.initialMeters !== undefined) updateData.initialMeters = validatedData.initialMeters
    if (validatedData.initialShipments !== undefined) updateData.initialShipments = validatedData.initialShipments
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
    }
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    // Campos de bono asignado (metros y envíos)
    if (validatedData.metersDelta !== undefined) {
      updateData.remainingMeters = Number(currentVoucher.remainingMeters) + validatedData.metersDelta
      if (updateData.remainingMeters < 0) updateData.remainingMeters = 0
    } else if (validatedData.remainingMeters !== undefined) {
      updateData.remainingMeters = validatedData.remainingMeters
    }

    if (validatedData.shipmentsDelta !== undefined) {
      updateData.remainingShipments = currentVoucher.remainingShipments + validatedData.shipmentsDelta
      if (updateData.remainingShipments < 0) updateData.remainingShipments = 0
    } else if (validatedData.remainingShipments !== undefined) {
      updateData.remainingShipments = validatedData.remainingShipments
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedVoucher)
  } catch (error) {
    console.error('Error updating voucher:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar si el bono existe
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    })

    if (!voucher) {
      return NextResponse.json({ error: 'Bono no encontrado' }, { status: 404 })
    }

    // Eliminar el bono
    await prisma.voucher.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Bono eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
