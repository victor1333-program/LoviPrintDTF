import { NextRequest, NextResponse } from 'next/server'
import { expireOldQuotes } from '@/lib/quotes'

/**
 * CRON Job: Caducar presupuestos vencidos
 * Ruta: GET /api/cron/expire-quotes
 *
 * Este endpoint debe ser llamado periódicamente (ej: cada día)
 * por un servicio de CRON externo o similar.
 *
 * Busca presupuestos con fecha de expiración pasada y los marca como EXPIRED.
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación básica o token de CRON (opcional pero recomendado)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('🕒 CRON: Iniciando caducidad de presupuestos...')

    // Ejecutar función de caducidad
    const result = await expireOldQuotes()

    console.log(`✅ CRON: Caducados ${result.expired} presupuestos`)

    return NextResponse.json({
      success: true,
      message: `${result.expired} presupuestos caducados`,
      expired: result.expired,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ CRON: Error al caducar presupuestos:', error)
    return NextResponse.json(
      {
        error: 'Error al caducar presupuestos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
