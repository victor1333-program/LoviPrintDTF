# Sprint 3 — Hallazgos adicionales fuera de alcance

Cosas que no he tocado en este sprint pero conviene tener en el radar.

## 1. Stripe Checkout sigue limitado a `card`

La V1 de los iconos de pago muestra Visa, Mastercard, AMEX, Bizum, Apple Pay,
Google Pay y Transferencia en footer y en `/carrito`. Esto fue una decisión
consciente para preparar la UI a los métodos que están a punto de habilitarse.

**Estado real de la pasarela hoy:**
- `src/lib/stripe.ts` y `src/app/api/payments/create-checkout/route.ts` crean la
  sesión sin `payment_method_types` ni `automatic_payment_methods`. Stripe usa
  el default del dashboard. Conviene confirmar en el panel de Stripe qué
  métodos están realmente activos: tarjeta, Apple Pay y Google Pay vienen
  juntos; Bizum hay que habilitarlo explícito; la transferencia bancaria no es
  parte de Stripe (tu flujo actual la usa solo en presupuestos admin).
- Bizum y transferencia en la tienda online aún no existen. Si un cliente entra
  desde el footer creyendo que puede pagar con Bizum y no aparece en checkout,
  abandona.

**Riesgo:** los iconos prometen métodos que checkout puede no ofrecer todavía.

**Sugerencia próximo sprint:**
1. Activar Bizum en el dashboard de Stripe (España, requiere validación
   adicional del comercio).
2. Confirmar Apple Pay / Google Pay activos para el dominio.
3. Decidir qué hacer con "Transferencia": o bien añadir flujo manual en la
   tienda online, o retirar el icono del bloque público.
4. Si algo no se va a activar en el corto plazo, retirar su icono de
   `PaymentMethodsBadge`.

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

## 5. Cambios externos en `stripe.ts` y `route.ts` durante el sprint

Durante el sprint apareció una modificación menor en working tree en
`src/lib/stripe.ts` y `src/app/api/payments/create-checkout/route.ts` (quitar
la línea `payment_method_types: ['card']`). No formaba parte de ninguna de
las 5 tareas y se dejó sin commitear en la rama del sprint. Si fueron cambios
intencionales del entorno de desarrollo (linter, autosave del editor), conviene
commitearlos aparte con su propio mensaje y contexto.
