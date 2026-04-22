import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateManualInvoice } from '@/lib/invoice'
import { updateManualInvoiceSchema } from '@/lib/validations/schemas'
import { deleteFromCloudinary } from '@/lib/cloudinary'

// GET: Obtener detalle de factura
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
            user: { select: { name: true, email: true } }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Serializar Decimals
    const serialized = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      taxAmount: Number(invoice.taxAmount),
      taxRate: Number(invoice.taxRate),
      shippingCost: Number(invoice.shippingCost),
      totalPrice: Number(invoice.totalPrice),
      order: invoice.order
        ? {
            ...invoice.order,
            subtotal: Number(invoice.order.subtotal),
            discountAmount: Number(invoice.order.discountAmount),
            taxAmount: Number(invoice.order.taxAmount),
            shippingCost: Number(invoice.order.shippingCost),
            totalPrice: Number(invoice.order.totalPrice),
            items: invoice.order.items?.map((item: any) => ({
              ...item,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal)
            }))
          }
        : null
    }

    return NextResponse.json(serialized)
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    )
  }
}

// PATCH: Actualizar factura manual
export async function PATCH(
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
    const validated = updateManualInvoiceSchema.parse(body)

    const invoice = await updateManualInvoice(id, validated)

    // Serializar Decimals
    const serialized = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      taxAmount: Number(invoice.taxAmount),
      taxRate: Number(invoice.taxRate),
      shippingCost: Number(invoice.shippingCost),
      totalPrice: Number(invoice.totalPrice)
    }

    return NextResponse.json(serialized)
  } catch (error: any) {
    console.error('Error updating invoice:', error)

    if (error.message === 'Factura no encontrada') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'Solo se pueden editar facturas manuales') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar factura' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar factura manual
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (invoice.type !== 'MANUAL') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar facturas manuales' },
        { status: 403 }
      )
    }

    // Eliminar PDF de Cloudinary
    if (invoice.pdfPublicId) {
      try {
        await deleteFromCloudinary(invoice.pdfPublicId)
      } catch (err) {
        console.error('Error deleting PDF from Cloudinary:', err)
        // Continuar aunque falle el borrado del PDF
      }
    }

    // Eliminar de DB
    await prisma.invoice.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Error al eliminar factura' },
      { status: 500 }
    )
  }
}
