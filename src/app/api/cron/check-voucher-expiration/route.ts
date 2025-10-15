import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVoucherExpirationEmail } from '@/lib/email/email-service'

// Este endpoint debe ser llamado diariamente por un cron job
// Puedes usar servicios como cron-job.org, GitHub Actions, o Vercel Cron Jobs
export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorización (para evitar llamadas no autorizadas)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-this'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Calcular fecha 7 días después
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Calcular fecha 8 días después (para el rango)
    const eightDaysFromNow = new Date()
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8)

    // Buscar bonos que caducan en exactamente 7 días
    const expiringVouchers = await prisma.voucher.findMany({
      where: {
        expiresAt: {
          gte: sevenDaysFromNow,
          lt: eightDaysFromNow,
        },
        isActive: true,
        userId: {
          not: null, // Solo bonos asignados a usuarios
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    console.log(`Found ${expiringVouchers.length} vouchers expiring in 7 days`)

    // Enviar emails
    const emailPromises = expiringVouchers.map(async (voucher) => {
      if (!voucher.user?.email) {
        console.warn(`Voucher ${voucher.id} has no user email`)
        return { voucherId: voucher.id, sent: false, error: 'No user email' }
      }

      try {
        const sent = await sendVoucherExpirationEmail(voucher.user.email, {
          customerName: voucher.user.name || 'Cliente',
          voucherName: voucher.name,
          voucherCode: voucher.code,
          expiresAt: new Date(voucher.expiresAt!),
          remainingMeters: Number(voucher.remainingMeters),
          remainingShipments: voucher.remainingShipments,
        })

        return { voucherId: voucher.id, voucherCode: voucher.code, sent }
      } catch (error) {
        console.error(`Error sending email for voucher ${voucher.id}:`, error)
        return { voucherId: voucher.id, sent: false, error: String(error) }
      }
    })

    const results = await Promise.all(emailPromises)

    const successCount = results.filter((r) => r.sent).length
    const failCount = results.filter((r) => !r.sent).length

    return NextResponse.json({
      success: true,
      message: `Checked ${expiringVouchers.length} vouchers`,
      emailsSent: successCount,
      emailsFailed: failCount,
      results,
    })
  } catch (error) {
    console.error('Error checking voucher expiration:', error)
    return NextResponse.json(
      { error: 'Error al verificar caducidad de bonos', details: String(error) },
      { status: 500 }
    )
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request)
}
