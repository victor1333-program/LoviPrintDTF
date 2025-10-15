import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { EmailTemplateType } from '@prisma/client'

// GET /api/email-templates - Obtener todas las plantillas (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as EmailTemplateType | null
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    )
  }
}

// POST /api/email-templates - Crear nueva plantilla
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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

    // Validaciones
    if (!name || !type || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Si se marca como default, desactivar otras plantillas default del mismo tipo
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { type, isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        type,
        subject,
        htmlContent,
        textContent: textContent || null,
        variables: variables || null,
        sampleData: sampleData || null,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        attachments: attachments || null,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Error al crear plantilla' },
      { status: 500 }
    )
  }
}
