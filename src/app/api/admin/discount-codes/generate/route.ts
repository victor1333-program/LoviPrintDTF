import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Función para generar código aleatorio
function generateDiscountCode(
  length: number = 8,
  prefix?: string
): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix ? `${prefix}-` : ''

  const remainingLength = length - (prefix ? prefix.length + 1 : 0)

  for (let i = 0; i < remainingLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Función para verificar si un código existe
async function codeExists(code: string): Promise<boolean> {
  const existing = await prisma.discountCode.findUnique({
    where: { code },
  })
  return !!existing
}

// Generar un único código garantizado único
async function generateUniqueCode(
  length: number = 8,
  prefix?: string,
  maxAttempts: number = 10
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateDiscountCode(length, prefix)
    if (!(await codeExists(code))) {
      return code
    }
  }
  throw new Error('No se pudo generar un código único')
}

// POST - Generar códigos de descuento (uno o múltiples)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar campos requeridos
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Nombre y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Validar que si no es global, tenga un productId
    if (!body.isGlobal && !body.productId) {
      return NextResponse.json(
        { error: 'Debe especificar un producto si el descuento no es global' },
        { status: 400 }
      )
    }

    const quantity = body.quantity || 1
    const prefix = body.prefix
    const codeLength = body.codeLength || 8

    if (quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { error: 'La cantidad debe estar entre 1 y 1000' },
        { status: 400 }
      )
    }

    const discountCodes = []

    // Generar códigos
    for (let i = 0; i < quantity; i++) {
      const code = await generateUniqueCode(codeLength, prefix)

      const name = quantity > 1
        ? `${body.name} #${i + 1}`
        : body.name

      const discountCode = await prisma.discountCode.create({
        data: {
          code,
          name,
          description: body.description,
          type: body.type,
          value: body.value || 0,
          isEnabled: body.isEnabled ?? true,
          isGlobal: body.isGlobal ?? true,
          productId: body.productId,
          minPurchase: body.minPurchase,
          maxDiscount: body.maxDiscount,
          maxUses: body.maxUses,
          maxUsesPerUser: body.maxUsesPerUser ?? 1,
          validFrom: body.validFrom ? new Date(body.validFrom) : null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      discountCodes.push(discountCode)
    }

    return NextResponse.json({
      success: true,
      count: discountCodes.length,
      codes: discountCodes,
    })
  } catch (error) {
    console.error('Error generating discount codes:', error)
    return NextResponse.json(
      { error: 'Error al generar códigos de descuento' },
      { status: 500 }
    )
  }
}

// GET - Generar un único código (para vista previa)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || undefined
    const length = parseInt(searchParams.get('length') || '8')

    const code = await generateUniqueCode(length, prefix)

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: 'Error al generar código' },
      { status: 500 }
    )
  }
}
