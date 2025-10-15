import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { code, orderTotal } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Código de bono requerido' },
        { status: 400 }
      )
    }

    // Buscar el bono
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!voucher) {
      return NextResponse.json(
        { isValid: false, error: 'Bono no encontrado' },
        { status: 404 }
      )
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
    })
  } catch (error) {
    console.error('Error validating voucher:', error)
    return NextResponse.json(
      { error: 'Error al validar bono' },
      { status: 500 }
    )
  }
}
