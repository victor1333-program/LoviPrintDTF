import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateInvoicePDF } from '@/lib/invoice'
import { uploadToCloudinary } from '@/lib/cloudinary'

/**
 * POST /api/admin/regenerate-invoices
 * Regenera los PDFs de facturas que no tienen pdfUrl
 * Solo accesible por administradores
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Verificar que el usuario sea administrador
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('🔍 Buscando facturas sin PDF...')

    // Buscar facturas que no tienen pdfUrl
    const invoicesWithoutPdf = await prisma.invoice.findMany({
      where: {
        OR: [
          { pdfUrl: null },
          { pdfUrl: '' }
        ]
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

    console.log(`📄 Encontradas ${invoicesWithoutPdf.length} facturas sin PDF`)

    if (invoicesWithoutPdf.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todas las facturas tienen PDF',
        processed: 0
      })
    }

    const results = []

    // Procesar cada factura
    for (const invoice of invoicesWithoutPdf) {
      console.log(`📝 Procesando factura ${invoice.invoiceNumber}...`)

      try {
        // Generar el PDF
        const pdfBuffer = await generateInvoicePDF(invoice)
        console.log(`  ✅ PDF generado (${pdfBuffer.length} bytes)`)

        // Subir a Cloudinary
        const uploadResult = await uploadToCloudinary(pdfBuffer, {
          folder: 'invoices',
          resourceType: 'raw',
          publicId: `invoice-${invoice.invoiceNumber}`,
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

          console.log(`  ✅ PDF subido a Cloudinary: ${uploadResult.url}`)
          console.log(`  ✅ Factura ${invoice.invoiceNumber} actualizada`)

          results.push({
            invoiceNumber: invoice.invoiceNumber,
            success: true,
            pdfUrl: uploadResult.url
          })
        } else {
          console.error(`  ❌ Error al subir PDF: ${uploadResult.error}`)
          results.push({
            invoiceNumber: invoice.invoiceNumber,
            success: false,
            error: uploadResult.error
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error(`  ❌ Error al procesar factura ${invoice.invoiceNumber}:`, errorMessage)
        results.push({
          invoiceNumber: invoice.invoiceNumber,
          success: false,
          error: errorMessage
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Procesadas ${successCount}/${invoicesWithoutPdf.length} facturas correctamente`,
      processed: invoicesWithoutPdf.length,
      successful: successCount,
      results
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      {
        error: 'Error al regenerar facturas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
