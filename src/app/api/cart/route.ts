import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { calculateUnitPrice } from '@/lib/pricing'
import { validateRequest } from '@/lib/validations/validate'
import { addToCartSchema } from '@/lib/validations/schemas'
import { logger } from '@/lib/logger'

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
      const customizations = item.customizations as any
      const isVoucherPurchase = !!customizations?.voucherTemplateId
      const isDTFProduct = !isVoucherPurchase && (item.product.productType === 'DTF_TEXTILE' || item.product.productType === 'DTF_UV')

      // Para bonos o productos sin rangos de precio, usar el precio unitario del item
      let priceCalc
      if (isVoucherPurchase || !item.product.priceRanges || item.product.priceRanges.length === 0) {
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

      // IMPORTANTE: Sumar extras al subtotal del item (excepto priorización que es global)
      // Los bonos no tienen extras
      let extrasTotal = 0
      if (!isVoucherPurchase && customizations?.extras) {
        // Maquetación y Corte se suman por item
        if (customizations.extras.layout) {
          extrasTotal += Number(customizations.extras.layout.price || 0)
        }
        if (customizations.extras.cutting) {
          extrasTotal += Number(customizations.extras.cutting.price || 0)
        }
        // NOTA: Priorización NO se suma aquí, se calculará globalmente más adelante
      }

      // Actualizar subtotal del item con extras
      priceCalc.subtotal += extrasTotal
      priceCalc.extrasTotal = extrasTotal

      // Si es producto DTF, sumar metros necesarios
      if (isDTFProduct) {
        totalMetersNeeded += qty
      }

      subtotal += priceCalc.subtotal
      return {
        ...item,
        calculatedPrice: priceCalc,
        isDTFProduct,
        isVoucherPurchase,
      }
    })

    // Calcular PRIORIZACIÓN GLOBAL (sobre el total de metros DTF del carrito)
    let prioritizationPrice = 0
    let hasPrioritization = false

    // Verificar si algún item DTF tiene priorización seleccionada
    for (const item of itemsWithPrices) {
      const customizations = item.customizations as any
      if (item.isDTFProduct && customizations?.extras?.prioritize) {
        hasPrioritization = true
        break
      }
    }

    // Si hay priorización, calcular precio según TOTAL de metros DTF
    if (hasPrioritization && totalMetersNeeded > 0) {
      // Tabla de precios de priorización (misma que en el frontend)
      const PRIORITIZE_PRICING: Record<number, number> = {
        1: 4.5, 2: 4.5, 3: 4.5, 4: 4.5, 5: 6, 6: 7.5, 7: 9, 8: 10.5, 9: 12, 10: 13.5,
        11: 15, 12: 16.5, 13: 18, 14: 19.5, 15: 21, 16: 22.5, 17: 24, 18: 25.5, 19: 27, 20: 28.5,
        21: 30, 22: 31.5, 23: 33, 24: 34.5, 25: 36, 26: 37.5, 27: 39, 28: 40.5, 29: 42, 30: 43.5,
        31: 45, 32: 46.5, 33: 48, 34: 49.5, 35: 51, 36: 52.5, 37: 54, 38: 55.5, 39: 57, 40: 58.5,
        41: 60, 42: 61.5, 43: 63, 44: 64.5, 45: 66, 46: 67.5, 47: 69, 48: 70.5, 49: 72, 50: 73.5
      }

      const meters = Math.floor(totalMetersNeeded)
      prioritizationPrice = PRIORITIZE_PRICING[meters] || PRIORITIZE_PRICING[50] || 0
      subtotal += prioritizationPrice // Sumar al subtotal global
    }

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

    // IMPORTANTE: Si usa bonos (total o parcialmente) Y tiene envíos disponibles, aplicar envío gratis
    // Esto permite que un cliente que compra más metros de los que tiene en su bono
    // aún pueda usar sus envíos gratis incluidos en el bono
    const canUseVoucherShipment = (canUseVoucherMeters || canUseVoucherMetersPartially) && totalShipmentsAvailable > 0

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
      prioritization: {
        enabled: hasPrioritization,
        price: prioritizationPrice,
        totalMeters: totalMetersNeeded,
      },
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
    logger.error('Error fetching cart', error)
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

    // Validar request body
    const validation = await validateRequest(request, addToCartSchema)
    if (validation.error) {
      return validation.error
    }

    const { productId, quantity, fileUrl, fileName, fileSize, fileMetadata, customizations } = validation.data

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

    // Si hay archivo adjunto, SIEMPRE crear un nuevo item (para permitir múltiples diseños)
    // Si NO hay archivo, buscar item existente y actualizar cantidad
    let existingItem = null

    if (!fileUrl && !fileName) {
      existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          fileName: null, // Solo agrupar items SIN archivos
        },
      })
    }

    if (existingItem) {
      // Actualizar cantidad del item existente (solo para items sin archivos)
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
      // Crear nuevo item (siempre para items con archivos, o si no existe item sin archivo)
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
    logger.error('Error adding to cart', error)
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
    logger.error('Error clearing cart', error)
    return NextResponse.json(
      { error: 'Error al limpiar carrito' },
      { status: 500 }
    )
  }
}
