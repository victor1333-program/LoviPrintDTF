import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token de verificación no proporcionado' },
        { status: 400 }
      )
    }

    // Buscar usuario con este token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(), // Token no expirado
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Ya verificado?
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Este email ya ha sido verificado', alreadyVerified: true },
        { status: 200 }
      )
    }

    // Verificar el email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationExpires: null,
      },
    })

    return NextResponse.json(
      { message: 'Email verificado correctamente', verified: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Error al verificar el email' },
      { status: 500 }
    )
  }
}
