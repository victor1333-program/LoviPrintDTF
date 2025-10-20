import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        taxId: true,
        isProfessional: true,
        billingStreet: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, isProfessional, company, taxId, billingStreet, billingCity, billingState, billingPostalCode } = body

    // Validaciones
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      )
    }

    if (isProfessional) {
      if (!company || !taxId) {
        return NextResponse.json(
          { error: 'Razón social y NIF/CIF son requeridos para profesionales' },
          { status: 400 }
        )
      }
      // La dirección de facturación es opcional en el checkout
      // Se puede añadir más tarde desde el perfil completo
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        isProfessional,
        company: isProfessional ? company : null,
        taxId: isProfessional ? taxId : null,
        // Actualizar dirección de facturación si se proporciona en el body
        ...(billingStreet !== undefined && { billingStreet: isProfessional ? billingStreet : null }),
        ...(billingCity !== undefined && { billingCity: isProfessional ? billingCity : null }),
        ...(billingState !== undefined && { billingState: isProfessional ? billingState : null }),
        ...(billingPostalCode !== undefined && { billingPostalCode: isProfessional ? billingPostalCode : null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        taxId: true,
        isProfessional: true,
        billingStreet: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
  }
}
