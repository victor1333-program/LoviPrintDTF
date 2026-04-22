import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createManualInvoice } from '@/lib/invoice'
import { createManualInvoiceSchema } from '@/lib/validations/schemas'

// GET: Listar facturas con filtros
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || undefined

    const whereClause: any = {
      AND: []
    }

    if (type) {
      whereClause.AND.push({ type })
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause.AND.length > 0 ? whereClause : {},
      include: {
        order: {
          select: { orderNumber: true, status: true }
        }
      },
      orderBy: { issueDate: 'desc' }
    })

    // Serializar Decimals a números
    const serialized = invoices.map(inv => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      discountAmount: Number(inv.discountAmount),
      taxAmount: Number(inv.taxAmount),
      taxRate: Number(inv.taxRate),
      shippingCost: Number(inv.shippingCost),
      totalPrice: Number(inv.totalPrice)
    }))

    return NextResponse.json(serialized)
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

// POST: Crear factura manual
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    console.log('📝 Datos recibidos para crear factura:', JSON.stringify(body, null, 2))
    const validated = createManualInvoiceSchema.parse(body)

    const invoice = await createManualInvoice(validated)

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

    return NextResponse.json(serialized, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error creating manual invoice:', error)

    if (error.name === 'ZodError') {
      console.error('❌ Errores de validación Zod:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    )
  }
}
