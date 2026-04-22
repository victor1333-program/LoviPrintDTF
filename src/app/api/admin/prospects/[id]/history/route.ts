import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { addProspectHistorySchema } from '@/lib/validations/schemas'

// POST /api/admin/prospects/[id]/history - Añadir entrada al historial
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
    const validation = addProspectHistorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verificar que el prospecto existe
    const prospect = await prisma.prospect.findUnique({
      where: { id }
    })

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospecto no encontrado' },
        { status: 404 }
      )
    }

    // Crear entrada en historial
    const historyEntry = await prisma.prospectHistory.create({
      data: {
        prospectId: id,
        texto: validation.data.texto
      }
    })

    return NextResponse.json(historyEntry, { status: 201 })
  } catch (error) {
    console.error('Error adding history entry:', error)
    return NextResponse.json(
      { error: 'Error al añadir entrada al historial' },
      { status: 500 }
    )
  }
}
