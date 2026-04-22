import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { markProspectDoneSchema } from '@/lib/validations/schemas'

// POST /api/admin/prospects/[id]/mark-done - Marcar acción como hecha
export async function POST(
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
    const validation = markProspectDoneSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { resultado, nuevaProximaAccion, nuevaFechaProximaAccion, nuevoEstado } = validation.data

    // Verificar que el prospecto existe
    const existingProspect = await prisma.prospect.findUnique({
      where: { id }
    })

    if (!existingProspect) {
      return NextResponse.json(
        { error: 'Prospecto no encontrado' },
        { status: 404 }
      )
    }

    // Usar transacción para añadir historial y actualizar prospecto
    const prospect = await prisma.$transaction(async (tx) => {
      // 1. Añadir entrada al historial con el resultado
      await tx.prospectHistory.create({
        data: {
          prospectId: id,
          texto: resultado
        }
      })

      // 2. Preparar datos de actualización
      const updateData: {
        proximaAccion?: string | null
        fechaProximaAccion?: Date | null
        estado?: 'VERDE' | 'AMARILLO' | 'ROJO'
      } = {}

      // Actualizar próxima acción si se proporciona
      if (nuevaProximaAccion !== undefined) {
        updateData.proximaAccion = nuevaProximaAccion || null
      }

      // Actualizar fecha próxima acción
      if (nuevaFechaProximaAccion !== undefined) {
        updateData.fechaProximaAccion = nuevaFechaProximaAccion
          ? new Date(nuevaFechaProximaAccion)
          : null
      } else if (nuevaProximaAccion === undefined || nuevaProximaAccion === '') {
        // Si no hay nueva acción, limpiar la fecha también
        updateData.fechaProximaAccion = null
        updateData.proximaAccion = null
      }

      // Actualizar estado si se proporciona
      if (nuevoEstado) {
        updateData.estado = nuevoEstado
      }

      // 3. Actualizar prospecto
      const updated = await tx.prospect.update({
        where: { id },
        data: updateData,
        include: {
          historial: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      return updated
    })

    return NextResponse.json(prospect)
  } catch (error) {
    console.error('Error marking prospect as done:', error)
    return NextResponse.json(
      { error: 'Error al marcar acción como completada' },
      { status: 500 }
    )
  }
}
