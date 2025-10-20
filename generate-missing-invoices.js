const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateMissingInvoices() {
  try {
    console.log('🔍 Buscando pedidos pagados sin factura...')

    // Buscar todos los pedidos PAID sin factura
    const ordersWithoutInvoice = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        invoice: null
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`\n📋 Encontrados ${ordersWithoutInvoice.length} pedidos sin factura\n`)

    if (ordersWithoutInvoice.length === 0) {
      console.log('✅ Todos los pedidos pagados ya tienen factura')
      return
    }

    // Obtener el último número de factura
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: {
        invoiceNumber: 'desc'
      }
    })

    let invoiceCounter = 1
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d{4})-(\d+)/)
      if (match) {
        invoiceCounter = parseInt(match[2]) + 1
      }
    }

    const year = new Date().getFullYear()

    // Generar facturas
    for (const order of ordersWithoutInvoice) {
      const invoiceNumber = `INV-${year}-${String(invoiceCounter).padStart(6, '0')}`

      // Calcular totales
      const subtotal = parseFloat(order.subtotal.toString())
      const taxAmount = parseFloat(order.taxAmount.toString())
      const discountAmount = parseFloat(order.discountAmount?.toString() || '0')
      const shippingCost = parseFloat(order.shippingCost?.toString() || '0')
      const total = parseFloat(order.totalPrice.toString())

      // Crear factura
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone || '',
          customerAddress: order.shippingAddress || {},
          subtotal,
          taxAmount,
          discountAmount,
          shippingCost,
          totalPrice: total,
          issueDate: order.createdAt,
        }
      })

      console.log(`✅ Factura ${invoiceNumber} generada para pedido ${order.orderNumber}`)
      invoiceCounter++
    }

    console.log(`\n🎉 ¡Se generaron ${ordersWithoutInvoice.length} facturas exitosamente!`)

  } catch (error) {
    console.error('❌ Error generando facturas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateMissingInvoices()
