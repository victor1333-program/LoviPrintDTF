import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { createProspectSchema } from '@/lib/validations/schemas'
import { Prisma } from '@prisma/client'

// GET /api/admin/prospects - Lista de prospectos con filtros
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
    const estado = searchParams.get('estado')
    const search = searchParams.get('search')
    const orderBy = searchParams.get('orderBy') || 'fechaProximaAccion'
    const orderDir = searchParams.get('orderDir') || 'asc'

    // Construir where dinámico
    const where: Prisma.ProspectWhereInput = {}

    if (estado && estado !== 'TODOS') {
      where.estado = estado as 'VERDE' | 'AMARILLO' | 'ROJO'
    }

    if (search) {
      where.OR = [
        { empresa: { contains: search, mode: 'insensitive' } },
        { contacto: { contains: search, mode: 'insensitive' } },
        { ciudad: { contains: search, mode: 'insensitive' } },
        { provincia: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Construir orderBy dinámico
    const orderByClause: Prisma.ProspectOrderByWithRelationInput = {}

    if (orderBy === 'fechaProximaAccion') {
      // Los que tienen fecha primero, ordenados por fecha
      // Los que no tienen fecha al final
      orderByClause.fechaProximaAccion = orderDir === 'asc' ? 'asc' : 'desc'
    } else if (orderBy === 'empresa') {
      orderByClause.empresa = orderDir === 'asc' ? 'asc' : 'desc'
    } else if (orderBy === 'createdAt') {
      orderByClause.createdAt = orderDir === 'asc' ? 'asc' : 'desc'
    } else {
      orderByClause.fechaProximaAccion = 'asc'
    }

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: orderByClause,
      include: {
        _count: {
          select: { historial: true }
        }
      }
    })

    // Ordenar para que los que tienen fechaProximaAccion aparezcan primero
    // y los que no tienen fecha al final
    const sortedProspects = prospects.sort((a, b) => {
      // Si ambos no tienen fecha, mantener orden original
      if (!a.fechaProximaAccion && !b.fechaProximaAccion) return 0
      // Si solo a no tiene fecha, va al final
      if (!a.fechaProximaAccion) return 1
      // Si solo b no tiene fecha, va al final
      if (!b.fechaProximaAccion) return -1
      // Ambos tienen fecha, comparar
      if (orderDir === 'asc') {
        return a.fechaProximaAccion.getTime() - b.fechaProximaAccion.getTime()
      } else {
        return b.fechaProximaAccion.getTime() - a.fechaProximaAccion.getTime()
      }
    })

    return NextResponse.json(sortedProspects)
  } catch (error) {
    console.error('Error fetching prospects:', error)
    return NextResponse.json(
      { error: 'Error al obtener prospectos' },
      { status: 500 }
    )
  }
}

// POST /api/admin/prospects - Crear prospecto
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
    const validation = createProspectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { historialInicial, fechaProximaAccion, ...prospectData } = validation.data

    // Crear prospecto con historial inicial si se proporciona
    const prospect = await prisma.prospect.create({
      data: {
        ...prospectData,
        fechaProximaAccion: fechaProximaAccion ? new Date(fechaProximaAccion) : null,
        historial: historialInicial ? {
          create: {
            texto: historialInicial
          }
        } : undefined
      },
      include: {
        historial: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { historial: true }
        }
      }
    })

    return NextResponse.json(prospect, { status: 201 })
  } catch (error) {
    console.error('Error creating prospect:', error)
    return NextResponse.json(
      { error: 'Error al crear prospecto' },
      { status: 500 }
    )
  }
}
