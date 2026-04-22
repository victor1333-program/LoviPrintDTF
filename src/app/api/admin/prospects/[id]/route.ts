import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { updateProspectSchema } from '@/lib/validations/schemas'

// GET /api/admin/prospects/[id] - Detalle de prospecto
export async function GET(
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

    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: {
        historial: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospecto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(prospect)
  } catch (error) {
    console.error('Error fetching prospect:', error)
    return NextResponse.json(
      { error: 'Error al obtener prospecto' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/prospects/[id] - Actualizar prospecto
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
    const validation = updateProspectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verificar existencia
    const existing = await prisma.prospect.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Prospecto no encontrado' },
        { status: 404 }
      )
    }

    const { fechaProximaAccion, ...updateData } = validation.data

    const prospect = await prisma.prospect.update({
      where: { id },
      data: {
        ...updateData,
        fechaProximaAccion: fechaProximaAccion !== undefined
          ? (fechaProximaAccion ? new Date(fechaProximaAccion) : null)
          : undefined
      },
      include: {
        historial: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(prospect)
  } catch (error) {
    console.error('Error updating prospect:', error)
    return NextResponse.json(
      { error: 'Error al actualizar prospecto' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/prospects/[id] - Eliminar prospecto
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

    // Verificar existencia
    const existing = await prisma.prospect.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Prospecto no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar (cascade elimina historial)
    await prisma.prospect.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Prospecto eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting prospect:', error)
    return NextResponse.json(
      { error: 'Error al eliminar prospecto' },
      { status: 500 }
    )
  }
}
