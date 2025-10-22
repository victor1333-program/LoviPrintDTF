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

    // Actualizar usuario y dirección en una transacción
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Actualizar datos del usuario
      const user = await tx.user.update({
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

      // Si se proporciona una dirección de envío, actualizarla o crearla en la tabla Address
      if (validatedData.shippingAddress && typeof validatedData.shippingAddress === 'object') {
        const { street, city, state, postalCode, country } = validatedData.shippingAddress

        // Solo actualizar/crear si hay al menos calle o ciudad
        if (street || city) {
          // Buscar dirección predeterminada existente
          const existingAddress = await tx.address.findFirst({
            where: {
              userId: id,
              isDefault: true
            }
          })

          if (existingAddress) {
            // Actualizar dirección existente
            await tx.address.update({
              where: { id: existingAddress.id },
              data: {
                street: street || existingAddress.street,
                city: city || existingAddress.city,
                state: state || existingAddress.state || '',
                postalCode: postalCode || existingAddress.postalCode,
                country: country || existingAddress.country || 'España',
              }
            })
          } else {
            // Crear nueva dirección como predeterminada
            await tx.address.create({
              data: {
                userId: id,
                street: street || '',
                city: city || '',
                state: state || '',
                postalCode: postalCode || '',
                country: country || 'España',
                isDefault: true
              }
            })
          }
        }
      }

      return user
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
