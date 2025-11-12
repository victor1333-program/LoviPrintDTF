import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuoteNumber, calculateQuoteExpirationDate } from '@/lib/quotes'
import { auth } from '@/auth'

/**
 * POST /api/quotes
 * Crea un nuevo presupuesto desde la web pública
 * No requiere autenticación
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      customerName,
      customerEmail,
      customerPhone,
      designFileUrl,
      designFileName,
      fileMetadata,
      customerNotes,
      shippingAddress,
    } = body

    // Validaciones
    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      )
    }

    if (!designFileUrl || !designFileName) {
      return NextResponse.json(
        { error: 'Debes subir un diseño' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Buscar si el email corresponde a un usuario registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
    })

    // Generar número de presupuesto
    const quoteNumber = await generateQuoteNumber()

    // Calcular fecha de expiración (15 días)
    const expiresAt = calculateQuoteExpirationDate()

    // Crear presupuesto
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        userId: existingUser?.id || null,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        designFileUrl,
        designFileName,
        fileMetadata: fileMetadata || null,
        customerNotes: customerNotes || null,
        shippingAddress: shippingAddress || null,
        status: 'PENDING_REVIEW',
        expiresAt,
      },
    })

    // TODO: Enviar email de confirmación al cliente
    // TODO: Enviar notificación al admin

    return NextResponse.json(
      {
        success: true,
        quote: {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          status: quote.status,
          expiresAt: quote.expiresAt,
        },
        message: 'Presupuesto creado exitosamente. Te contactaremos pronto.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      {
        error: 'Error al crear el presupuesto',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/quotes
 * Lista todos los presupuestos (solo admin)
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación y rol de admin
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Construir filtros
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Contar total
    const total = await prisma.quote.count({ where })

    // Obtener presupuestos
    const quotes = await prisma.quote.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shippingMethod: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener presupuestos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
