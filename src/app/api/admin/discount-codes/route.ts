import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Función para generar código aleatorio
function generateDiscountCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET - Listar todos los códigos de descuento
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
    const enabled = searchParams.get('enabled')

    const where = enabled
      ? { isEnabled: enabled === 'true' }
      : {}

    const discountCodes = await prisma.discountCode.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            usageHistory: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(discountCodes)
  } catch (error) {
    console.error('Error fetching discount codes:', error)
    return NextResponse.json(
      { error: 'Error al cargar códigos de descuento' },
      { status: 500 }
    )
  }
}

// POST - Crear código de descuento
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

    // Validar que el código no exista
    if (body.code) {
      const existing = await prisma.discountCode.findUnique({
        where: { code: body.code },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'El código ya existe' },
          { status: 400 }
        )
      }
    }

    // Generar código si no se proporciona
    const code = body.code || generateDiscountCode()

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

    const discountCode = await prisma.discountCode.create({
      data: {
        code,
        name: body.name,
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

    return NextResponse.json(discountCode)
  } catch (error) {
    console.error('Error creating discount code:', error)
    return NextResponse.json(
      { error: 'Error al crear código de descuento' },
      { status: 500 }
    )
  }
}
