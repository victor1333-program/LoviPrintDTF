import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  calculateQuotePrice,
  createStripePaymentLink,
  getQuoteStatusText,
  convertQuoteToOrder
} from '@/lib/quotes'
import { sendQuotePaymentLinkEmail, sendQuoteBizumEmail, sendQuoteWithAllPaymentOptionsEmail } from '@/lib/email'

/**
 * GET /api/quotes/[id]
 * Obtiene un presupuesto específico
 * Admin: puede ver todos
 * Usuario: solo puede ver los suyos
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    const quoteId = id

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        shippingMethod: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    // Admin puede ver todos, usuario solo los suyos
    if (session) {
      if (session.user.role !== 'ADMIN') {
        if (!quote.userId || quote.userId !== session.user.id) {
          return NextResponse.json(
            { error: 'No autorizado' },
            { status: 403 }
          )
        }
      }
    }
    // Si no hay sesión, permitir ver por quoteNumber público
    // (útil para página de confirmación de pago)

    return NextResponse.json({
      success: true,
      quote,
    })
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener el presupuesto',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/quotes/[id]
 * Actualiza un presupuesto (solo admin)
 * Permite:
 * - Agregar cotización (metros, precio, extras)
 * - Cambiar estado
 * - Agregar notas
 * - Generar enlace de pago
 * - Marcar como pagado manualmente
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const quoteId = id
    const body = await req.json()

    const {
      action,
      // Para cotización
      estimatedMeters,
      needsCutting,
      needsLayout,
      isPriority,
      shippingMethodId,
      // Para notas
      adminNotes,
      // Para pago
      paymentMethod,
      // Para estado
      status,
    } = body

    // Verificar que el presupuesto existe
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    // Procesar según la acción
    if (action === 'quote') {
      // ACCIÓN: Cotizar presupuesto (calcular metros y precios)

      if (!estimatedMeters || estimatedMeters <= 0) {
        return NextResponse.json(
          { error: 'Los metros deben ser mayores a 0' },
          { status: 400 }
        )
      }

      // Obtener producto DTF y sus rangos de precio
      const dtfProduct = await prisma.product.findFirst({
        where: {
          productType: 'DTF_TEXTILE',
          isActive: true,
        },
        include: {
          priceRanges: {
            orderBy: {
              fromQty: 'asc',
            },
          },
        },
      })

      if (!dtfProduct || !dtfProduct.priceRanges.length) {
        return NextResponse.json(
          { error: 'No se encontró configuración de precios para DTF' },
          { status: 500 }
        )
      }

      // Obtener método de envío si se especificó
      let shippingCost = 0
      if (shippingMethodId) {
        const shippingMethod = await prisma.shippingMethod.findUnique({
          where: { id: shippingMethodId },
        })
        if (shippingMethod) {
          shippingCost = Number(shippingMethod.price)
        }
      }

      // Calcular precios
      const priceCalc = calculateQuotePrice({
        meters: estimatedMeters,
        priceRanges: dtfProduct.priceRanges,
        needsCutting: needsCutting || false,
        needsLayout: needsLayout || false,
        isPriority: isPriority || false,
        shippingCost,
        taxRate: 0.21, // IVA 21%
        taxExempt: body.taxExempt || false,
      })

      // Manejar pago con bono si se solicitó
      if (body.useVoucher && existingQuote.userId) {
        // Validar que el usuario tenga un bono activo con metros suficientes
        const activeVoucher = await prisma.voucher.findFirst({
          where: {
            userId: existingQuote.userId,
            isActive: true,
            type: 'METERS',
            remainingMeters: {
              gte: estimatedMeters,
            },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          orderBy: {
            expiresAt: 'asc', // Usar primero el que expira antes
          },
        })

        if (!activeVoucher) {
          return NextResponse.json(
            { error: 'No hay bonos activos con metros suficientes para este presupuesto' },
            { status: 400 }
          )
        }

        // Descontar metros del bono
        await prisma.voucher.update({
          where: { id: activeVoucher.id },
          data: {
            remainingMeters: {
              decrement: estimatedMeters,
            },
          },
        })

        // Actualizar presupuesto como PAGADO con bono
        const updatedQuote = await prisma.quote.update({
          where: { id: quoteId },
          data: {
            estimatedMeters,
            pricePerMeter: priceCalc.pricePerMeter,
            needsCutting: needsCutting || false,
            cuttingPrice: priceCalc.cuttingPrice || null,
            needsLayout: needsLayout || false,
            layoutPrice: priceCalc.layoutPrice || null,
            isPriority: isPriority || false,
            priorityPrice: priceCalc.priorityPrice || null,
            shippingMethodId: shippingMethodId || null,
            shippingCost: shippingCost || null,
            subtotal: priceCalc.subtotal,
            taxAmount: priceCalc.taxAmount,
            estimatedTotal: priceCalc.total,
            status: 'PAID',
            adminNotes: adminNotes || existingQuote.adminNotes,
            paymentMethod: 'VOUCHER',
            voucherId: activeVoucher.id,
            useVoucher: true,
            taxExempt: body.taxExempt || false,
          },
          include: {
            shippingMethod: true,
          },
        })

        // Convertir automáticamente a pedido
        const conversionResult = await convertQuoteToOrder(quoteId, session.user.id!)

        if (!conversionResult.success) {
          return NextResponse.json(
            { error: conversionResult.error || 'Error al convertir a pedido' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `Presupuesto pagado con bono y convertido automáticamente a pedido ${conversionResult.order.orderNumber}`,
          quote: updatedQuote,
          calculation: priceCalc,
          order: {
            id: conversionResult.order.id,
            orderNumber: conversionResult.order.orderNumber,
            status: conversionResult.order.status,
            totalPrice: conversionResult.order.totalPrice,
          },
          voucherUsed: {
            code: activeVoucher.code,
            metersDeducted: estimatedMeters,
            remainingMeters: Number(activeVoucher.remainingMeters) - estimatedMeters,
          },
        })
      }

      // Flujo normal: Generar Payment Link de Stripe automáticamente
      const description = `Presupuesto DTF - ${estimatedMeters}m - ${existingQuote.customerName}`

      const paymentLinkResult = await createStripePaymentLink({
        quoteId: existingQuote.id,
        quoteNumber: existingQuote.quoteNumber,
        amount: priceCalc.total,
        customerEmail: existingQuote.customerEmail,
        description,
      })

      if (!paymentLinkResult.success) {
        console.error('Error generating payment link:', paymentLinkResult.error)
        // Continuar aunque falle el payment link
      }

      // Actualizar presupuesto con cotización y payment link
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          estimatedMeters,
          pricePerMeter: priceCalc.pricePerMeter,
          needsCutting: needsCutting || false,
          cuttingPrice: priceCalc.cuttingPrice || null,
          needsLayout: needsLayout || false,
          layoutPrice: priceCalc.layoutPrice || null,
          isPriority: isPriority || false,
          priorityPrice: priceCalc.priorityPrice || null,
          shippingMethodId: shippingMethodId || null,
          shippingCost: shippingCost || null,
          subtotal: priceCalc.subtotal,
          taxAmount: priceCalc.taxAmount,
          estimatedTotal: priceCalc.total,
          status: 'QUOTED',
          adminNotes: adminNotes || existingQuote.adminNotes,
          paymentMethod: paymentLinkResult.success ? 'STRIPE' : null,
          paymentLinkUrl: paymentLinkResult.success ? paymentLinkResult.url : null,
          taxExempt: body.taxExempt || false,
          useVoucher: false,
        },
        include: {
          shippingMethod: true,
        },
      })

      // Enviar email automáticamente con todas las opciones de pago
      try {
        await sendQuoteWithAllPaymentOptionsEmail(updatedQuote, updatedQuote.shippingMethod)
      } catch (emailError) {
        console.error('Error sending quote email:', emailError)
        // No fallar la petición si falla el email
      }

      return NextResponse.json({
        success: true,
        message: 'Presupuesto cotizado y enviado al cliente con todas las opciones de pago',
        quote: updatedQuote,
        calculation: priceCalc,
        paymentLinkGenerated: paymentLinkResult.success,
      })
    }

    if (action === 'generate_payment_link') {
      // ACCIÓN: Generar enlace de pago de Stripe

      if (!existingQuote.estimatedTotal || Number(existingQuote.estimatedTotal) <= 0) {
        return NextResponse.json(
          { error: 'Debes cotizar el presupuesto primero' },
          { status: 400 }
        )
      }

      if (existingQuote.status === 'PAID') {
        return NextResponse.json(
          { error: 'Este presupuesto ya está pagado' },
          { status: 400 }
        )
      }

      const description = `Presupuesto DTF - ${existingQuote.estimatedMeters}m - ${existingQuote.customerName}`

      const paymentLinkResult = await createStripePaymentLink({
        quoteId: existingQuote.id,
        quoteNumber: existingQuote.quoteNumber,
        amount: Number(existingQuote.estimatedTotal),
        customerEmail: existingQuote.customerEmail,
        description,
      })

      if (!paymentLinkResult.success) {
        return NextResponse.json(
          { error: paymentLinkResult.error || 'Error generando enlace de pago' },
          { status: 500 }
        )
      }

      // Actualizar presupuesto con enlace
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          paymentMethod: 'STRIPE',
          paymentLinkUrl: paymentLinkResult.url,
          status: 'PAYMENT_SENT',
        },
      })

      // Enviar email al cliente con el enlace de pago
      try {
        await sendQuotePaymentLinkEmail(updatedQuote)
      } catch (emailError) {
        console.error('Error sending payment link email:', emailError)
        // No fallar la petición si falla el email
      }

      return NextResponse.json({
        success: true,
        message: 'Enlace de pago generado exitosamente',
        quote: updatedQuote,
        paymentUrl: paymentLinkResult.url,
      })
    }

    if (action === 'set_bizum') {
      // ACCIÓN: Indicar que el pago será por Bizum

      if (!existingQuote.estimatedTotal || Number(existingQuote.estimatedTotal) <= 0) {
        return NextResponse.json(
          { error: 'Debes cotizar el presupuesto primero' },
          { status: 400 }
        )
      }

      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          paymentMethod: 'BIZUM',
          status: 'PAYMENT_SENT',
        },
      })

      // Enviar email al cliente con instrucciones de Bizum
      try {
        await sendQuoteBizumEmail(updatedQuote)
      } catch (emailError) {
        console.error('Error sending Bizum email:', emailError)
        // No fallar la petición si falla el email
      }

      return NextResponse.json({
        success: true,
        message: 'Presupuesto configurado para pago por Bizum',
        quote: updatedQuote,
      })
    }

    if (action === 'mark_paid') {
      // ACCIÓN: Marcar como pagado manualmente (para Bizum/Transferencia)
      // Automáticamente convierte el presupuesto en pedido

      if (existingQuote.status === 'PAID') {
        return NextResponse.json(
          { error: 'Este presupuesto ya está marcado como pagado' },
          { status: 400 }
        )
      }

      if (!existingQuote.estimatedTotal || Number(existingQuote.estimatedTotal) <= 0) {
        return NextResponse.json(
          { error: 'El presupuesto no tiene un total calculado' },
          { status: 400 }
        )
      }

      // Marcar como pagado primero
      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: 'PAID',
        },
      })

      // Convertir automáticamente a pedido
      const conversionResult = await convertQuoteToOrder(quoteId, session.user.id!)

      if (!conversionResult.success) {
        return NextResponse.json(
          { error: conversionResult.error || 'Error al convertir a pedido' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Presupuesto marcado como pagado y convertido automáticamente a pedido ${conversionResult.order.orderNumber}`,
        quote: { id: quoteId, status: 'PAID', orderId: conversionResult.order.id },
        order: {
          id: conversionResult.order.id,
          orderNumber: conversionResult.order.orderNumber,
          status: conversionResult.order.status,
          totalPrice: conversionResult.order.totalPrice,
        },
        pointsEarned: conversionResult.pointsEarned,
      })
    }

    if (action === 'cancel' || action === 'expire') {
      // ACCIÓN: Cancelar o caducar presupuesto

      const newStatus = action === 'cancel' ? 'CANCELLED' : 'EXPIRED'

      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: newStatus,
          adminNotes: adminNotes || existingQuote.adminNotes,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Presupuesto ${getQuoteStatusText(newStatus).toLowerCase()}`,
        quote: updatedQuote,
      })
    }

    if (action === 'update_notes') {
      // ACCIÓN: Actualizar notas admin

      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          adminNotes,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Notas actualizadas',
        quote: updatedQuote,
      })
    }

    // Si no se reconoce la acción
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      {
        error: 'Error al actualizar el presupuesto',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/quotes/[id]
 * Elimina un presupuesto (solo admin, solo si está en PENDING_REVIEW)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const quoteId = id

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir eliminar si está en PENDING_REVIEW
    if (quote.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar presupuestos pendientes de revisión' },
        { status: 400 }
      )
    }

    await prisma.quote.delete({
      where: { id: quoteId },
    })

    return NextResponse.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json(
      {
        error: 'Error al eliminar el presupuesto',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
