import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/email-templates/[id] - Obtener una plantilla específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { error: 'Error al obtener plantilla' },
      { status: 500 }
    )
  }
}

// PUT /api/email-templates/[id] - Actualizar plantilla
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      type,
      subject,
      htmlContent,
      textContent,
      variables,
      sampleData,
      isActive,
      isDefault,
      attachments,
    } = body

    // Si se marca como default, desactivar otras plantillas default del mismo tipo
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: {
          type,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(subject && { subject }),
        ...(htmlContent && { htmlContent }),
        textContent: textContent !== undefined ? textContent : undefined,
        variables: variables !== undefined ? variables : undefined,
        sampleData: sampleData !== undefined ? sampleData : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
        attachments: attachments !== undefined ? attachments : undefined,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    )
  }
}

// DELETE /api/email-templates/[id] - Eliminar plantilla
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await prisma.emailTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Error al eliminar plantilla' },
      { status: 500 }
    )
  }
}
