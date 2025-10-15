import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { replaceVariables } from '@/types/email-templates'

// POST /api/email-templates/preview - Previsualizar email con datos
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, htmlContent, data } = body

    if (!subject || !htmlContent || !data) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Reemplazar variables en el asunto y contenido
    const processedSubject = replaceVariables(subject, data)
    const processedHtml = replaceVariables(htmlContent, data)

    return NextResponse.json({
      subject: processedSubject,
      html: processedHtml,
    })
  } catch (error) {
    console.error('Error previewing email:', error)
    return NextResponse.json(
      { error: 'Error al generar vista previa' },
      { status: 500 }
    )
  }
}
