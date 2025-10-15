import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
  company: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  isProfessional: z.boolean().optional(),
  professionalDiscount: z.number().min(0).max(100).optional().nullable(),
  shippingAddress: z.any().optional().nullable(),
  billingAddress: z.any().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailInUse) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.email && { email: validatedData.email }),
      ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      ...(validatedData.role && { role: validatedData.role }),
      ...(validatedData.company !== undefined && { company: validatedData.company }),
      ...(validatedData.taxId !== undefined && { taxId: validatedData.taxId }),
      ...(validatedData.isProfessional !== undefined && {
        isProfessional: validatedData.isProfessional,
      }),
      ...(validatedData.professionalDiscount !== undefined && {
        professionalDiscount: validatedData.professionalDiscount,
      }),
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No permitir eliminar al propio usuario
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
