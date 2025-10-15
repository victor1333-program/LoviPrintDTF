import Stripe from 'stripe'
import { prisma } from './prisma'

interface StripeConfig {
  testMode: boolean
  publishableKey: string
  secretKey: string
}

let cachedConfig: StripeConfig | null = null
let configLastFetched = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutos
let stripeInstance: Stripe | null = null

async function getStripeConfig(): Promise<StripeConfig | null> {
  const now = Date.now()

  // Usar cache si no ha expirado
  if (cachedConfig && (now - configLastFetched) < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  try {
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

    const publishableKey = testMode
      ? config.stripe_publishable_key_test
      : config.stripe_publishable_key_live

    const secretKey = testMode
      ? config.stripe_secret_key_test
      : config.stripe_secret_key_live

    // Verificar que tenemos las claves necesarias
    if (!secretKey) {
      console.warn('Stripe secret key missing')
      return null
    }

    cachedConfig = {
      testMode,
      publishableKey,
      secretKey,
    }

    configLastFetched = now

    // Reinicializar Stripe con la nueva config
    stripeInstance = null

    return cachedConfig
  } catch (error) {
    console.error('Error fetching Stripe config:', error)
    return null
  }
}

export async function getStripeInstance(): Promise<Stripe | null> {
  if (stripeInstance) {
    return stripeInstance
  }

  const config = await getStripeConfig()

  if (!config || !config.secretKey) {
    console.warn('Stripe not configured')
    return null
  }

  stripeInstance = new Stripe(config.secretKey, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  })

  return stripeInstance
}

export async function getStripePublishableKey(): Promise<string | null> {
  const config = await getStripeConfig()
  return config?.publishableKey || null
}

export async function isStripeTestMode(): Promise<boolean> {
  const config = await getStripeConfig()
  return config?.testMode ?? true
}

/**
 * Crea una sesión de pago de Stripe
 */
export async function createCheckoutSession({
  orderId,
  orderNumber,
  amount,
  customerEmail,
  successUrl,
  cancelUrl,
  lineItems,
}: {
  orderId: string
  orderNumber: string
  amount: number
  customerEmail: string
  successUrl: string
  cancelUrl: string
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
}) {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      throw new Error('Stripe not configured')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        orderId,
        orderNumber,
      },
      payment_intent_data: {
        metadata: {
          orderId,
          orderNumber,
        },
      },
    })

    return { success: true, sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Crea un Payment Intent
 */
export async function createPaymentIntent({
  amount,
  currency = 'eur',
  orderId,
  orderNumber,
  customerEmail,
}: {
  amount: number
  currency?: string
  orderId: string
  orderNumber: string
  customerEmail?: string
}) {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      throw new Error('Stripe not configured')
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      metadata: {
        orderId,
        orderNumber,
      },
      receipt_email: customerEmail,
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Verifica el estado de un pago
 */
export async function getPaymentStatus(paymentIntentId: string) {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      throw new Error('Stripe not configured')
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata,
    }
  } catch (error) {
    console.error('Error getting payment status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Reembolsa un pago
 */
export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      throw new Error('Stripe not configured')
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    })

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
    }
  } catch (error) {
    console.error('Error creating refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Construye el evento desde el webhook
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event | null> {
  try {
    const stripe = await getStripeInstance()

    if (!stripe) {
      throw new Error('Stripe not configured')
    }

    const webhookSecretSetting = await prisma.setting.findUnique({
      where: { key: 'stripe_webhook_secret' }
    })

    const webhookSecret = webhookSecretSetting?.value

    if (!webhookSecret) {
      console.warn('Stripe webhook secret not configured')
      return null
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )

    return event
  } catch (error) {
    console.error('Error constructing webhook event:', error)
    return null
  }
}
