import PDFDocument from 'pdfkit'
import { prisma } from './prisma'
import { uploadToCloudinary } from './cloudinary'
import path from 'path'
import fs from 'fs'

/**
 * Formatea el nombre del cliente para que se muestre correctamente
 * Si el nombre es un email, extrae la parte antes del @ y la capitaliza
 * Si el nombre ya es un nombre propio, lo devuelve tal cual
 */
function formatCustomerName(name: string): string {
  if (!name) return 'Cliente'

  // Verificar si es un email (contiene @)
  if (name.includes('@')) {
    // Extraer la parte antes del @
    const username = name.split('@')[0]

    // Separar por puntos, guiones o guiones bajos
    const parts = username.split(/[._-]/)

    // Capitalizar cada parte
    const formatted = parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')

    return formatted
  }

  // Si no es un email, devolverlo tal cual (ya es un nombre)
  return name
}

// Configurar rutas de fuentes de PDFKit para Next.js
// PDFKit necesita acceso a sus archivos de fuentes (.afm)
// Usamos require.resolve para encontrar la ruta correcta de pdfkit
try {
  const pdkitPath = require.resolve('pdfkit')
  const fontDataPath = path.join(path.dirname(pdkitPath), 'js', 'data')

  if (fs.existsSync(fontDataPath)) {
    // Configurar variable de entorno que PDFKit puede usar
    process.env.PDFKIT_FONT_PATH = fontDataPath
  } else {
    // Fallback a node_modules directo
    const fallbackPath = path.join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data')
    if (fs.existsSync(fallbackPath)) {
      process.env.PDFKIT_FONT_PATH = fallbackPath
    }
  }
} catch (err) {
  console.error('Error configurando rutas de fuentes de PDFKit:', err)
}

interface InvoiceData {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerTaxId?: string
  customerAddress?: any
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingCost: number
  totalPrice: number
  items: any[]
  issueDate?: Date
}

/**
 * Genera el siguiente número de factura en secuencia
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`

  // Obtener la última factura del año actual
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let nextNumber = 1
  if (lastInvoice) {
    // Extraer el número secuencial de la última factura
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  // Formatear con 5 dígitos: FAC-2025-00001
  return `${prefix}${String(nextNumber).padStart(5, '0')}`
}

/**
 * Genera el PDF de la factura
 */
export async function generateInvoicePDF(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Datos de la empresa
    const companyName = 'LoviPrintDTF'
    const companyOwner = 'Maria Dolores Villena Garcia'
    const companyTaxId = '77598953N'
    const companyAddress = 'Calle Antonio Lopes del Oro 7\n02400 Hellín (Albacete)'
    const companyEmail = 'info@loviprintdtf.es'
    const companyPhone = '+34 XXX XXX XXX'

    // Logo - Cargar y verificar de forma segura
    let logoBuffer: Buffer | null = null
    let logoLoaded = false

    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath)
        logoLoaded = true
      }
    } catch (err) {
      console.error('Error loading logo:', err)
      logoLoaded = false
    }

    // Header - Logo y datos de la empresa
    if (logoLoaded && logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 40, { width: 100, height: 100, fit: [100, 100] })
      } catch (err) {
        console.error('Error adding logo to PDF:', err)
        logoLoaded = false
        // Si falla el logo, mostramos el nombre de la empresa
        doc.fontSize(20).font('Helvetica-Bold').text(companyName, 50, 50)
      }
    }

    if (!logoLoaded) {
      doc.fontSize(20).font('Helvetica-Bold').text(companyName, 50, 50)
    }

    // Datos de la empresa
    doc.fontSize(10).font('Helvetica')
    const dataY = logoLoaded ? 120 : 75
    doc.text(companyOwner, 50, dataY)
    doc.text(`NIF: ${companyTaxId}`, 50, dataY + 15)
    doc.text(companyAddress.replace(/\\n/g, '\n'), 50, dataY + 30)
    doc.text(`Email: ${companyEmail}`, 50, dataY + 60)
    doc.text(`Tel: ${companyPhone}`, 50, dataY + 75)

    // Título de factura
    doc.fontSize(28).font('Helvetica-Bold')
    doc.text('FACTURA', 400, 50)

    // Número de factura y fecha
    doc.fontSize(12).font('Helvetica')
    doc.text(`Nº: ${invoice.invoiceNumber}`, 400, 85)
    doc.text(`Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}`, 400, 100)

    // Línea separadora
    const separatorY = logoLoaded ? 220 : 160
    doc.moveTo(50, separatorY).lineTo(545, separatorY).stroke()

    // Datos del cliente
    const clientY = separatorY + 20
    doc.fontSize(12).font('Helvetica-Bold')
    doc.text('CLIENTE', 50, clientY)
    doc.fontSize(10).font('Helvetica')
    doc.text(formatCustomerName(invoice.customerName), 50, clientY + 20)
    if (invoice.customerTaxId) {
      doc.text(`NIF/CIF: ${invoice.customerTaxId}`, 50, clientY + 35)
    }
    doc.text(invoice.customerEmail, 50, invoice.customerTaxId ? clientY + 50 : clientY + 35)
    if (invoice.customerPhone) {
      doc.text(`Tel: ${invoice.customerPhone}`, 50, invoice.customerTaxId ? clientY + 65 : clientY + 50)
    }

    // Dirección del cliente si existe
    let addressEndY = clientY + 65
    if (invoice.customerAddress) {
      const addr = invoice.customerAddress
      let yPos = invoice.customerTaxId ? clientY + 80 : (invoice.customerPhone ? clientY + 65 : clientY + 50)
      if (addr.street) {
        doc.text(addr.street, 50, yPos)
        yPos += 15
      }
      if (addr.city || addr.postalCode) {
        doc.text(`${addr.postalCode || ''} ${addr.city || ''}`, 50, yPos)
        yPos += 15
      }
      if (addr.state) {
        doc.text(addr.state, 50, yPos)
        yPos += 15
      }
      if (addr.country) {
        doc.text(addr.country, 50, yPos)
        yPos += 15
      }
      addressEndY = yPos
    }

    // Tabla de productos - ajustar para que siempre haya espacio
    const tableTop = Math.max(addressEndY + 30, logoLoaded ? 400 : 350)
    doc.fontSize(10).font('Helvetica-Bold')

    // Cabecera de tabla
    doc.text('Descripción', 50, tableTop)
    doc.text('Cant.', 320, tableTop, { width: 60, align: 'center' })
    doc.text('Precio Unit.', 380, tableTop, { width: 80, align: 'right' })
    doc.text('Total', 460, tableTop, { width: 85, align: 'right' })

    // Línea debajo de cabecera
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke()

    // Items
    let yPosition = tableTop + 25
    doc.font('Helvetica')

    // Obtener items del pedido
    const order = invoice.order
    if (order && order.items) {
      order.items.forEach((item: any) => {
        // Descripción del producto
        let description = item.productName
        if (item.fileName) {
          description += `\n  Archivo: ${item.fileName}`
        }

        // Extras
        if (item.customizations?.extras) {
          const extras = item.customizations.extras
          if (extras.layout) description += '\n  + Maquetación'
          if (extras.cutting) description += '\n  + Servicio de Corte'
          if (extras.prioritize) description += '\n  + Priorización'
        }

        doc.text(description, 50, yPosition, { width: 260 })
        doc.text(
          `${Number(item.quantity).toFixed(2)}`,
          320,
          yPosition,
          { width: 60, align: 'center' }
        )
        doc.text(
          `${Number(item.unitPrice).toFixed(2)}€`,
          380,
          yPosition,
          { width: 80, align: 'right' }
        )
        doc.text(
          `${Number(item.subtotal).toFixed(2)}€`,
          460,
          yPosition,
          { width: 85, align: 'right' }
        )

        yPosition += description.split('\n').length * 15 + 10
      })
    }

    // Línea antes de totales
    yPosition += 10
    doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke()
    yPosition += 20

    // Totales
    const totalsX = 380
    doc.font('Helvetica')

    // Subtotal
    doc.text('Subtotal:', totalsX, yPosition, { width: 80, align: 'right' })
    doc.text(
      `${Number(invoice.subtotal).toFixed(2)}€`,
      460,
      yPosition,
      { width: 85, align: 'right' }
    )
    yPosition += 20

    // Descuento si aplica
    if (Number(invoice.discountAmount) > 0) {
      doc.text('Descuento:', totalsX, yPosition, { width: 80, align: 'right' })
      doc.text(
        `-${Number(invoice.discountAmount).toFixed(2)}€`,
        460,
        yPosition,
        { width: 85, align: 'right' }
      )
      yPosition += 20
    }

    // Envío si aplica
    if (Number(invoice.shippingCost) > 0) {
      doc.text('Envío:', totalsX, yPosition, { width: 80, align: 'right' })
      doc.text(
        `${Number(invoice.shippingCost).toFixed(2)}€`,
        460,
        yPosition,
        { width: 85, align: 'right' }
      )
      yPosition += 20
    }

    // IVA
    const taxRate = Number(invoice.taxRate || 21)
    doc.text(`IVA (${taxRate}%):`, totalsX, yPosition, { width: 80, align: 'right' })
    doc.text(
      `${Number(invoice.taxAmount).toFixed(2)}€`,
      460,
      yPosition,
      { width: 85, align: 'right' }
    )
    yPosition += 25

    // Total
    doc.fontSize(14).font('Helvetica-Bold')
    doc.text('TOTAL:', totalsX, yPosition, { width: 80, align: 'right' })
    doc.text(
      `${Number(invoice.totalPrice).toFixed(2)}€`,
      460,
      yPosition,
      { width: 85, align: 'right' }
    )

    // Notas al pie
    if (invoice.notes) {
      doc.fontSize(9).font('Helvetica')
      doc.text(invoice.notes, 50, yPosition + 50, { width: 495 })
    }

    // Footer
    doc.fontSize(8).font('Helvetica')
    doc.text(
      'Gracias por su confianza en LoviPrintDTF',
      50,
      750,
      { align: 'center', width: 495 }
    )

    doc.end()
  })
}

/**
 * Crea una factura para un pedido
 */
export async function createInvoiceForOrder(orderId: string): Promise<any> {
  // Obtener el pedido con todos sus datos
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: true
    }
  })

  if (!order) {
    throw new Error('Pedido no encontrado')
  }

  // Verificar si ya existe una factura para este pedido
  const existingInvoice = await prisma.invoice.findUnique({
    where: { orderId }
  })

  if (existingInvoice) {
    return existingInvoice
  }

  // Generar número de factura
  const invoiceNumber = await generateInvoiceNumber()

  // Obtener datos fiscales del cliente si existen
  const customerTaxId = order.user?.taxId || null

  // Crear factura en la base de datos
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerTaxId,
      customerAddress: order.shippingAddress as any,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      totalPrice: order.totalPrice,
      issueDate: new Date()
    },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  })

  // Generar el PDF
  const pdfBuffer = await generateInvoicePDF(invoice)

  // Subir el PDF a Cloudinary (o almacenamiento local)
  const uploadResult = await uploadToCloudinary(pdfBuffer, {
    folder: 'invoices',
    resourceType: 'raw',
    publicId: `invoice-${invoiceNumber}`,
    format: 'pdf'
  })

  if (uploadResult.success && uploadResult.url) {
    // Actualizar la factura con la URL del PDF
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        pdfUrl: uploadResult.url,
        pdfPublicId: uploadResult.publicId
      }
    })

    return {
      ...invoice,
      pdfUrl: uploadResult.url,
      pdfPublicId: uploadResult.publicId
    }
  }

  return invoice
}

/**
 * Obtiene el PDF de una factura
 */
export async function getInvoicePDF(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  })

  if (!invoice) {
    throw new Error('Factura no encontrada')
  }

  return generateInvoicePDF(invoice)
}
