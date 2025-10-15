import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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
    const templates = searchParams.get('templates') === 'true'
    const assigned = searchParams.get('assigned') === 'true'

    const where = templates
      ? { isTemplate: true, userId: null }
      : assigned
      ? { isTemplate: false, userId: { not: null } }
      : {}

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Error al cargar bonos' },
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

    // Generar código único
    const code = `BONO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    const voucher = await prisma.voucher.create({
      data: {
        ...body,
        code,
        type: 'METERS',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(voucher)
  } catch (error) {
    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { error: 'Error al crear bono' },
      { status: 500 }
    )
  }
}
