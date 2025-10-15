import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { calculateUnitPrice } from '@/lib/pricing'

// PATCH - Actualizar cantidad de item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()
    const sessionId = request.cookies.get('cart_session')?.value
    const { quantity } = await request.json()
    const { itemId } = await params

    // Verificar que el item pertenece al carrito del usuario
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: {
          include: {
            priceRanges: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    // Verificar autorización
    const isAuthorized =
      (session?.user?.id && item.cart.userId === session.user.id) ||
      (!session?.user && sessionId && item.cart.sessionId === sessionId)

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Calcular nuevo precio - Para productos sin rangos (VOUCHER), usar basePrice
    let priceCalc
    if (!item.product.priceRanges || item.product.priceRanges.length === 0) {
      const unitPrice = Number(item.product.basePrice)
      priceCalc = {
        unitPrice,
        subtotal: unitPrice * Number(quantity),
        discountPct: 0,
        discountAmount: 0,
      }
    } else {
      priceCalc = calculateUnitPrice(Number(quantity), item.product.priceRanges)
    }

    // Actualizar item
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: Number(quantity),
        unitPrice: priceCalc.unitPrice,
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar item' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar item del carrito
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()
    const sessionId = request.cookies.get('cart_session')?.value
    const { itemId } = await params

    // Verificar que el item pertenece al carrito del usuario
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    // Verificar autorización
    const isAuthorized =
      (session?.user?.id && item.cart.userId === session.user.id) ||
      (!session?.user && sessionId && item.cart.sessionId === sessionId)

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json(
      { error: 'Error al eliminar item' },
      { status: 500 }
    )
  }
}
