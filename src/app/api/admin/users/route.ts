import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).or(z.literal('')).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  company: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  isProfessional: z.boolean().default(false),
  professionalDiscount: z.number().min(0).max(100).optional().nullable(),
  shippingAddress: z.any().optional().nullable(),
  billingAddress: z.any().optional().nullable(),
})

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
    const search = searchParams.get('search')

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        company: true,
        taxId: true,
        isProfessional: true,
        professionalDiscount: true,
        shippingAddress: true,
        billingAddress: true,
        createdAt: true,
        loyaltyPoints: true,
        totalSpent: true,
        loyaltyTier: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      take: search ? 10 : undefined,
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

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
    const validatedData = userSchema.parse(body)

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    if (!validatedData.password || validatedData.password === '') {
      return NextResponse.json(
        { error: 'La contraseña es obligatoria' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone || null,
        role: validatedData.role,
        company: validatedData.company || null,
        taxId: validatedData.taxId || null,
        isProfessional: validatedData.isProfessional,
        professionalDiscount: validatedData.professionalDiscount || null,
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    // Nota: Las direcciones se almacenan en los pedidos, no en el usuario
    // Si necesitas almacenarlas en el usuario, necesitarás agregar campos JSON al modelo User

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
