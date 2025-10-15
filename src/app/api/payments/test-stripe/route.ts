import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST() {
  try {
    const session = await auth()

    // Requiere autenticación de admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener configuración de Stripe desde la base de datos
    const settings = await prisma.setting.findMany({
      where: {
        category: 'payments',
        key: {
          in: [
            'stripe_test_mode',
            'stripe_publishable_key_test',
            'stripe_secret_key_test',
            'stripe_publishable_key_live',
            'stripe_secret_key_live'
          ]
        }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    const testMode = config.stripe_test_mode === 'true'

    const secretKey = testMode
      ? config.stripe_secret_key_test
      : config.stripe_secret_key_live

    const publishableKey = testMode
      ? config.stripe_publishable_key_test
      : config.stripe_publishable_key_live

    // Verificar que tenemos la configuración necesaria
    if (!secretKey || !publishableKey) {
      return NextResponse.json({
        success: false,
        error: testMode
          ? 'Configuración de Stripe en modo test incompleta. Completa las claves de test.'
          : 'Configuración de Stripe en modo live incompleta. Completa las claves de producción.'
      }, { status: 400 })
    }

    // Intentar inicializar Stripe y hacer una petición simple
    try {
      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
      })

      // Hacer una llamada simple a la API para verificar las credenciales
      // Listar las últimas 1 balance transactions como test
      await stripe.balanceTransactions.list({ limit: 1 })

      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con Stripe',
        mode: testMode ? 'test' : 'live'
      })

    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError)

      // Manejar errores específicos de Stripe
      if (stripeError.type === 'StripeAuthenticationError') {
        return NextResponse.json({
          success: false,
          error: 'Credenciales inválidas. Verifica tu Secret Key de Stripe.'
        }, { status: 401 })
      }

      if (stripeError.type === 'StripePermissionError') {
        return NextResponse.json({
          success: false,
          error: 'Las credenciales no tienen los permisos necesarios.'
        }, { status: 403 })
      }

      return NextResponse.json({
        success: false,
        error: stripeError.message || 'Error al conectar con Stripe'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error testing Stripe:', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Error al probar la conexión con Stripe'
    }, { status: 500 })
  }
}
