import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { code, orderTotal } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Código requerido' },
        { status: 400 }
      )
    }

    // Primero buscar en vouchers (bonos prepagados)
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    })

    // Si no se encuentra, buscar en discount_codes (códigos de descuento)
    if (!voucher) {
      const discountCode = await prisma.discountCode.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          product: true,
        }
      })

      if (!discountCode) {
        return NextResponse.json(
          { isValid: false, error: 'Código de descuento no encontrado' },
          { status: 404 }
        )
      }

      // Validar código de descuento
      if (!discountCode.isEnabled) {
        return NextResponse.json({
          isValid: false,
          error: 'Este código de descuento no está activo',
        })
      }

      // Verificar fecha de validez
      const now = new Date()
      if (discountCode.validFrom && discountCode.validFrom > now) {
        return NextResponse.json({
          isValid: false,
          error: 'Este código de descuento aún no es válido',
        })
      }

      if (discountCode.validUntil && discountCode.validUntil < now) {
        return NextResponse.json({
          isValid: false,
          error: 'Este código de descuento ha expirado',
        })
      }

      // Verificar límite de usos
      if (discountCode.maxUses && discountCode.usageCount >= discountCode.maxUses) {
        return NextResponse.json({
          isValid: false,
          error: 'Este código de descuento ha alcanzado su límite de usos',
        })
      }

      // Verificar límite de usos por usuario
      if (session?.user?.id && discountCode.maxUsesPerUser) {
        const userUsageCount = await prisma.discountCodeUsage.count({
          where: {
            discountCodeId: discountCode.id,
            userId: session.user.id,
          }
        })

        if (userUsageCount >= discountCode.maxUsesPerUser) {
          return NextResponse.json({
            isValid: false,
            error: 'Has alcanzado el límite de usos para este código',
          })
        }
      }

      // Verificar compra mínima
      if (discountCode.minPurchase && orderTotal < Number(discountCode.minPurchase)) {
        return NextResponse.json({
          isValid: false,
          error: `Compra mínima de ${Number(discountCode.minPurchase).toFixed(2)}€ requerida`,
        })
      }

      // Calcular descuento según el tipo
      let discountAmount = 0

      switch (discountCode.type) {
        case 'PERCENTAGE':
          discountAmount = orderTotal * (Number(discountCode.value) / 100)
          if (discountCode.maxDiscount && discountAmount > Number(discountCode.maxDiscount)) {
            discountAmount = Number(discountCode.maxDiscount)
          }
          break

        case 'FIXED':
          discountAmount = Number(discountCode.value)
          break

        case 'FREE_SHIPPING':
          // El descuento del envío se calculará en el checkout
          discountAmount = 0
          break

        case 'FREE_PRODUCT':
          // Producto gratuito = descuento del 100% del subtotal
          // Si tiene un productId específico, solo ese producto es gratis
          // Si no tiene productId, todo el pedido es gratis
          if (discountCode.productId) {
            // TODO: Calcular el precio solo de ese producto en el carrito
            discountAmount = 0
          } else {
            // Todo el pedido gratis
            discountAmount = orderTotal
          }
          break
      }

      return NextResponse.json({
        isValid: true,
        discountCode: discountCode,
        discountAmount,
        discountType: discountCode.type, // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, FREE_PRODUCT
        type: 'discount_code',
      })
    }

    // Verificar si está activo
    if (!voucher.isActive) {
      return NextResponse.json({
        isValid: false,
        error: 'Este bono ya no está activo',
      })
    }

    // Verificar fecha de expiración
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return NextResponse.json({
        isValid: false,
        error: 'Este bono ha expirado',
      })
    }

    // Verificar límite de usos
    if (voucher.maxUsage && voucher.usageCount >= voucher.maxUsage) {
      return NextResponse.json({
        isValid: false,
        error: 'Este bono ha alcanzado su límite de usos',
      })
    }

    // Verificar si es de un usuario específico
    if (voucher.userId && voucher.userId !== session?.user?.id) {
      return NextResponse.json({
        isValid: false,
        error: 'Este bono no es válido para tu cuenta',
      })
    }

    // Verificar compra mínima
    if (voucher.minPurchase && orderTotal < Number(voucher.minPurchase)) {
      return NextResponse.json({
        isValid: false,
        error: `Compra mínima de ${Number(voucher.minPurchase).toFixed(2)}€ requerida`,
      })
    }

    // Calcular descuento
    let discountAmount = 0

    if (voucher.type === 'DISCOUNT_AMOUNT') {
      discountAmount = Number(voucher.discountAmount || 0)
    } else if (voucher.type === 'DISCOUNT_PERCENT') {
      discountAmount = orderTotal * (Number(voucher.discountPct || 0) / 100)

      // Aplicar descuento máximo si existe
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount)
      }
    }

    return NextResponse.json({
      isValid: true,
      voucher,
      discountAmount,
      type: 'voucher',
    })
  } catch (error) {
    console.error('Error validating voucher:', error)
    return NextResponse.json(
      { error: 'Error al validar bono' },
      { status: 500 }
    )
  }
}
