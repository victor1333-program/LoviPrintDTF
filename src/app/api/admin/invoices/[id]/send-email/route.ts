import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendInvoiceEmailSchema } from '@/lib/validations/schemas'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const validated = sendInvoiceEmailSchema.parse(body)

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (!invoice.pdfUrl) {
      return NextResponse.json(
        { error: 'Factura sin PDF generado' },
        { status: 400 }
      )
    }

    const recipientEmail = validated.recipientEmail || invoice.customerEmail

    // TODO: Implementar envío de email con el sistema existente
    // Por ahora, solo registramos en consola
    console.log(`Email would be sent to: ${recipientEmail}`)
    console.log(`Invoice number: ${invoice.invoiceNumber}`)
    console.log(`PDF URL: ${invoice.pdfUrl}`)
    console.log(`Custom message: ${validated.message || 'None'}`)

    // Aquí irá la integración con el sistema de email
    // Ejemplo:
    // await sendEmail({
    //   to: recipientEmail,
    //   subject: `Factura ${invoice.invoiceNumber} - LoviPrintDTF`,
    //   html: `<p>Estimado/a ${invoice.customerName},</p>
    //          <p>${validated.message || 'Adjuntamos su factura.'}</p>
    //          <p>Gracias por confiar en LoviPrintDTF.</p>`,
    //   attachments: [{
    //     url: invoice.pdfUrl,
    //     filename: `Factura-${invoice.invoiceNumber}.pdf`
    //   }]
    // })

    return NextResponse.json({
      success: true,
      sentTo: recipientEmail,
      message: 'Funcionalidad de envío de email pendiente de implementar'
    })
  } catch (error: any) {
    console.error('Error sending invoice email:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al enviar email' },
      { status: 500 }
    )
  }
}
