import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const { voucherId, quantity } = await req.json()

    if (!voucherId) {
      return NextResponse.json(
        { error: 'ID de bono requerido' },
        { status: 400 }
      )
    }

    // Obtener el voucher (plantilla)
    const voucherTemplate = await prisma.voucher.findUnique({
      where: { id: voucherId },
    })

    if (!voucherTemplate || !voucherTemplate.isTemplate) {
      return NextResponse.json(
        { error: 'Bono no encontrado o no disponible' },
        { status: 404 }
      )
    }

    if (!voucherTemplate.isActive) {
      return NextResponse.json(
        { error: 'Este bono no está disponible actualmente' },
        { status: 400 }
      )
    }

    // Verificar si el voucher tiene un producto asociado
    if (!voucherTemplate.productId) {
      return NextResponse.json(
        { error: 'Este bono no tiene un producto asociado' },
        { status: 400 }
      )
    }

    // Obtener o crear carrito
    let cart
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (user) {
        cart = await prisma.cart.findFirst({
          where: { userId: user.id },
        })

        if (!cart) {
          cart = await prisma.cart.create({
            data: { userId: user.id },
          })
        }
      }
    }

    if (!cart) {
      // Carrito de invitado (por sessionId)
      const sessionId = req.cookies.get('session-id')?.value || `session-${Date.now()}`

      cart = await prisma.cart.findFirst({
        where: { sessionId },
      })

      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId },
        })
      }
    }

    // Agregar el producto asociado al voucher al carrito
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: voucherTemplate.productId,
        quantity: 1, // Los bonos siempre son cantidad 1
        unitPrice: voucherTemplate.price,
        customizations: {
          voucherTemplateId: voucherTemplate.id,
          voucherName: voucherTemplate.name,
          voucherMeters: Number(voucherTemplate.initialMeters),
        },
      },
    })

    return NextResponse.json({
      success: true,
      cartItem,
      message: 'Bono agregado al carrito'
    })
  } catch (error) {
    console.error('Error purchasing voucher:', error)
    return NextResponse.json(
      { error: 'Error al agregar bono al carrito' },
      { status: 500 }
    )
  }
}
