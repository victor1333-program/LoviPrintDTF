# Sprint 3 — Hallazgos adicionales fuera de alcance

Cosas que no he tocado en este sprint pero conviene tener en el radar.

## 1. Métodos de pago alineados entre UI y Stripe Checkout

El `PaymentMethodsBadge` (footer y `/carrito`) muestra **6 métodos** que ya
están activos en el dashboard de Stripe:

- Visa
- Mastercard
- Apple Pay
- Google Pay
- Bizum
- Link by Stripe

`src/lib/stripe.ts` y `src/app/api/payments/create-checkout/route.ts` crean la
sesión sin `payment_method_types` hardcoded, así que respetan los métodos
activados en el dashboard. UI y pasarela están en sync — no hay falsa
expectativa.

**Decisiones explícitas tomadas durante el sprint:**
- **AMEX**: descartado. Uso marginal en el mercado español B2B/B2C de DTF.
- **Transferencia**: descartada en el flujo público. Se mantiene solo en el
  flujo B2B / presupuestos admin, no en el checkout estándar.
- **Amazon Pay**: desactivado en el dashboard de Stripe. No mostrado.

**Verificación visual:** el icono de Link usa SVG inline con el wordmark
"link" en blanco sobre fondo verde corporativo (#00D66F). Si en el futuro
queréis fidelidad de marca total, considerar `react-payment-icons` o asset
oficial descargado del press kit de Stripe.

## 2. Helper `buildWhatsAppUrl` creado pero usado solo en lo nuevo

Lo nuevo de este sprint (B2B modal, calculadora V1) usa el helper unificado en
`src/lib/whatsapp.ts`. Los componentes existentes siguen construyendo el URL
a mano cada uno:

- `src/components/B2BContactWidget.tsx`
- `src/components/WhatsAppWidget.tsx`
- `src/components/CheckoutModal.tsx`
- `src/app/contacto/page.tsx`
- `src/app/productos/[slug]/ProductDetailClient.tsx`
- `src/app/api/contact/route.ts` (server-side, en el email de respuesta)

**Sugerencia:** refactor pequeño para que todos consuman `buildWhatsAppUrl`.
Beneficio: cambiar el número de teléfono en un sitio y que se propague. Hoy
hay que tocar al menos `business-info.ts` + posibles fallbacks hardcoded.

## 3. Reseñas siguen siendo placeholders

`src/data/google-reviews.ts` centraliza las 7 reseñas que antes vivían en
`ProductDetailClient.tsx`. Mismo dato hardcoded, mismo cliente: home y ficha
ahora consumen la misma fuente.

Pendiente para sprint dedicado:
- Integración con Google Business Profile API, o widget externo (Elfsight,
  Trustindex, Reviewsonmywebsite). Si se va por API directa, requiere OAuth
  con la cuenta de la ficha de Google Business y caché razonable (no llamar
  en cada render).

## 4. DTFCalculator viejo borrado

`src/components/DTFCalculator.tsx` (huérfano, sin imports vivos) se borró. Era
un calculador en frontend con precios y redirección a `/checkout`. La V1
nueva (`/calculadora-dtf`) tiene arquitectura distinta: pre-cualificación de
leads a WhatsApp, sin cálculo en cliente.

Si en el futuro se quiere una V3 visual (configurador de gang sheet con
preview, cálculo real), partir de cero — la lógica del viejo no es reusable
para ese caso.

## 5. Stripe Checkout abierto al dashboard

Durante el sprint se eliminó el `payment_method_types: ['card']` hardcoded en
`src/lib/stripe.ts` y `src/app/api/payments/create-checkout/route.ts`.
Stripe Checkout pasa a usar los métodos activos en el dashboard, que el
usuario ya configuró: Bizum, Apple Pay, Google Pay y Link (Amazon Pay
desactivado). Commit `f38d4f7`.
