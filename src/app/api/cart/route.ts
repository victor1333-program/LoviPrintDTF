import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { calculateUnitPrice } from '@/lib/pricing'

// GET - Obtener carrito
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionId = request.cookies.get('cart_session')?.value

    if (!session?.user && !sessionId) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const cart = await prisma.cart.findFirst({
      where: session?.user?.id
        ? { userId: session.user.id }
        : { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                priceRanges: true,
              },
            },
          },
        },
      },
    })

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 })
    }

    // Obtener bonos de metros disponibles si el usuario está autenticado
    let availableMeterVouchers: any[] = []
    let totalMetersAvailable = 0
    let totalShipmentsAvailable = 0

    if (session?.user?.id) {
      availableMeterVouchers = await prisma.voucher.findMany({
        where: {
          userId: session.user.id,
          isTemplate: false,
          isActive: true,
          type: 'METERS',
          remainingMeters: {
            gt: 0
          }
        },
        orderBy: {
          createdAt: 'asc', // Usar los más antiguos primero (FIFO)
        },
      })

      totalMetersAvailable = availableMeterVouchers.reduce(
        (sum, v) => sum + Number(v.remainingMeters),
        0
      )

      totalShipmentsAvailable = availableMeterVouchers.reduce(
        (sum, v) => sum + Number(v.remainingShipments),
        0
      )
    }

    // Calcular totales y detectar si se pueden aplicar bonos de metros
    let subtotal = 0
    let totalMetersNeeded = 0
    const itemsWithPrices = cart.items.map((item) => {
      const qty = Number(item.quantity)
      const isDTFProduct = item.product.productType === 'DTF_TEXTILE' || item.product.productType === 'DTF_UV'

      // Para productos sin rangos de precio (como VOUCHER), usar el precio unitario del item
      let priceCalc
      if (!item.product.priceRanges || item.product.priceRanges.length === 0) {
        const unitPrice = Number(item.unitPrice)
        priceCalc = {
          unitPrice,
          subtotal: unitPrice * qty,
          discountPct: 0,
          discountAmount: 0,
        }
      } else {
        priceCalc = calculateUnitPrice(qty, item.product.priceRanges)
      }

      // Si es producto DTF, sumar metros necesarios
      if (isDTFProduct) {
        totalMetersNeeded += qty
      }

      subtotal += priceCalc.subtotal
      return {
        ...item,
        calculatedPrice: priceCalc,
        isDTFProduct,
      }
    })

    // Calcular si se pueden aplicar bonos (total o parcialmente)
    const canUseVoucherMeters = totalMetersNeeded > 0 && totalMetersAvailable >= totalMetersNeeded
    const canUseVoucherMetersPartially = totalMetersNeeded > 0 && totalMetersAvailable > 0 && totalMetersAvailable < totalMetersNeeded

    // Metros que se usarán del bono
    const metersFromVoucher = canUseVoucherMeters
      ? totalMetersNeeded
      : (canUseVoucherMetersPartially ? totalMetersAvailable : 0)

    // Metros que se deben pagar
    const metersToPay = canUseVoucherMeters
      ? 0
      : (canUseVoucherMetersPartially ? totalMetersNeeded - totalMetersAvailable : totalMetersNeeded)

    const canUseVoucherShipment = canUseVoucherMeters && totalShipmentsAvailable > 0

    // Calcular el subtotal ajustado
    let finalSubtotal = subtotal
    if (canUseVoucherMeters || canUseVoucherMetersPartially) {
      // Calcular cuánto costaría sin bonos los productos DTF
      const dtfSubtotal = itemsWithPrices
        .filter(item => item.isDTFProduct)
        .reduce((sum, item) => sum + item.calculatedPrice.subtotal, 0)

      if (canUseVoucherMeters) {
        // Pago completo con bonos - subtotal sin productos DTF
        finalSubtotal = subtotal - dtfSubtotal
      } else if (canUseVoucherMetersPartially) {
        // Pago parcial - calcular precio solo de los metros faltantes
        // Necesitamos calcular el precio por metro de los productos DTF
        const dtfItems = itemsWithPrices.filter(item => item.isDTFProduct)

        // Calcular precio por metro promedio ponderado
        let totalMeters = 0
        let totalPrice = 0
        dtfItems.forEach(item => {
          const meters = Number(item.quantity)
          const price = item.calculatedPrice.subtotal
          totalMeters += meters
          totalPrice += price
        })

        const pricePerMeter = totalMeters > 0 ? totalPrice / totalMeters : 0
        const costOfMetersToPay = metersToPay * pricePerMeter

        // El subtotal final es: productos no-DTF + metros a pagar
        finalSubtotal = (subtotal - dtfSubtotal) + costOfMetersToPay
      }
    }

    return NextResponse.json({
      ...cart,
      items: itemsWithPrices,
      subtotal: finalSubtotal, // Subtotal ajustado si usa bonos
      originalSubtotal: subtotal, // Subtotal original sin bonos
      meterVouchers: {
        available: availableMeterVouchers.length > 0,
        vouchers: availableMeterVouchers,
        totalMetersAvailable,
        totalMetersNeeded,
        totalShipmentsAvailable,
        canUseVoucherMeters,
        canUseVoucherMetersPartially,
        canUseVoucherShipment,
        metersFromVoucher,
        metersToPay,
      },
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Error al cargar carrito' },
      { status: 500 }
    )
  }
}

// POST - Agregar al carrito
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    let sessionId = request.cookies.get('cart_session')?.value

    if (!session?.user && !sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const body = await request.json()
    const { productId, quantity, fileUrl, fileName, fileSize, fileMetadata, customizations } = body

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { priceRanges: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Calcular precio - Para productos sin rangos (VOUCHER), usar basePrice
    let priceCalc
    if (!product.priceRanges || product.priceRanges.length === 0) {
      const unitPrice = Number(product.basePrice)
      priceCalc = {
        unitPrice,
        subtotal: unitPrice * Number(quantity),
        discountPct: 0,
        discountAmount: 0,
      }
    } else {
      priceCalc = calculateUnitPrice(Number(quantity), product.priceRanges)
    }

    // Buscar o crear carrito
    let cart = await prisma.cart.findFirst({
      where: session?.user?.id
        ? { userId: session.user.id }
        : { sessionId },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session?.user?.id,
          sessionId: !session?.user?.id ? sessionId : undefined,
        },
      })
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    })

    if (existingItem) {
      // Actualizar cantidad
      const newQuantity = Number(existingItem.quantity) + Number(quantity)

      let newPriceCalc
      if (!product.priceRanges || product.priceRanges.length === 0) {
        const unitPrice = Number(product.basePrice)
        newPriceCalc = {
          unitPrice,
          subtotal: unitPrice * newQuantity,
          discountPct: 0,
          discountAmount: 0,
        }
      } else {
        newPriceCalc = calculateUnitPrice(newQuantity, product.priceRanges)
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: newPriceCalc.unitPrice,
        },
      })
    } else {
      // Crear nuevo item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: Number(quantity),
          unitPrice: priceCalc.unitPrice,
          fileUrl,
          fileName,
          fileSize,
          fileMetadata,
          customizations,
        },
      })
    }

    const response = NextResponse.json({ success: true })

    // Establecer cookie de sesión si no hay usuario autenticado
    if (!session?.user && sessionId) {
      response.cookies.set('cart_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
      })
    }

    return response
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Error al agregar al carrito' },
      { status: 500 }
    )
  }
}

// DELETE - Limpiar carrito
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const sessionId = request.cookies.get('cart_session')?.value

    if (!session?.user && !sessionId) {
      return NextResponse.json({ success: true })
    }

    const cart = await prisma.cart.findFirst({
      where: session?.user?.id
        ? { userId: session.user.id }
        : { sessionId },
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Error al limpiar carrito' },
      { status: 500 }
    )
  }
}
