# Sprint 2 mini — hallazgos adicionales fuera de alcance

Cosas detectadas durante la auditoría/implementación del Sprint 2 mini que
NO se han tocado por estar fuera del alcance acotado (separar direcciones +
completar GA4 ecommerce). Quedan documentadas para futuros sprints.

---

## Analytics / tracking

### A.1 — Naming engañoso de campos `voucherId` / `discountCodeId`

**Dónde:** `src/app/carrito/page.tsx:350-351`, propagado a través de
`CheckoutData` (`src/components/CheckoutModal.tsx`), `OrderConfirmData`
(`src/app/carrito/confirmar/page.tsx:54-55`) y al backend en
`orderPayload.voucherId` / `discountCodeId` (`carrito/confirmar/page.tsx:124-125`).

**Problema:** los campos se llaman `voucherId` y `discountCodeId`, pero su
valor real es el **código string legible** (`appliedVoucher.voucher.code` /
`appliedVoucher.discountCode.code`), no el ID interno de Prisma. Esto se
descubrió durante la auditoría de payloads GA4 (se pensaba que estaban
pasando un ID opaco al campo `coupon` de `purchase`, pero en realidad pasa
el código correcto).

**Riesgo:** alguien que mire el código sin auditar acabará pasando un ID
de verdad creyendo que es lo que se espera. En el backend
(`/api/orders POST`) habría que confirmar cómo se busca el voucher: si por
`code` o por `id`. Si por `id`, el insert se rompería para vouchers nuevos
si alguien arregla el naming sin tocar el backend.

**Fix sugerido:** renombrar a `voucherCode` y `discountCode` en toda la
cadena cliente → API, y actualizar el handler del POST para usar
`findFirst({ where: { code } })` explícito.

### A.2 — `trackGenerateLead` exportado pero nunca usado

**Dónde:** `src/lib/analytics.ts:108`.

**Estado:** la función existe, recibe ahora gating de consent por coherencia,
pero ningún componente la llama. Candidatos lógicos serían el form de
`/contacto`, `B2BContactWidget`, y el form de presupuesto si se añade.

**Decisión Sprint 3:** o se instrumenta en al menos un punto (ideal:
formulario de contacto), o se retira para reducir superficie.

### A.3 — Microsoft Clarity duplica la lógica de consent

**Dónde:** `src/components/analytics/ClarityAnalytics.tsx` lee
`getStoredConsent()` y escucha `lovi:consent-changed` por su cuenta;
GA4 lo hace en `src/app/layout.tsx` con un `<Script>` inline + Consent Mode.

**Estado:** ambas instalaciones funcionan y respetan el consent, pero la
lógica de "si analytics === true, monta el script" está duplicada. Si en
el futuro se añade Meta Pixel o TikTok Pixel, conviene un componente
genérico `<ConsentGatedScript src=... category="analytics|marketing" />`
para no triplicar la duplicación.

### A.4 — `view_cart` solo se dispara una vez por carga de página

**Dónde:** `src/app/carrito/page.tsx:80-91` (state `viewCartFired`).

**Estado:** decisión intencional para no inflar event counts cada vez que
se modifica el carrito en la misma URL. GA4 spec no obliga a re-disparar.

**Si más adelante interesa medir engagement** dentro del carrito (cambios
de cantidad, aplicación de descuentos), considerar añadir un evento custom
`cart_modified` con `dataLayer.push` (no usar view_cart).

### A.5 — `view_item_list` no implementado

**Dónde se necesitaría:** `src/app/productos/page.tsx` (catálogo) y
`src/app/productos/[category]/page.tsx` si existen listados por categoría.

**Estado:** evento estándar de GA4 ecommerce que mide impresiones de
producto. Útil para CTR de catálogo → ficha. Fuera del alcance acotado del
Sprint 2.

### A.6 — GTM container ID hardcoded en `layout.tsx`

**Dónde:** `src/app/layout.tsx` líneas 134 y 141 (`GTM-WSHM34SL`).

**Estado:** Microsoft Clarity ya usa `NEXT_PUBLIC_CLARITY_PROJECT_ID` como
env var. GTM podría seguir el mismo patrón (`NEXT_PUBLIC_GTM_ID`) para
poder cambiar el container sin redeploy. No bloqueante.

---

## Identidad del negocio

### B.1 — Documentación interna conserva direcciones hardcoded

**Dónde:** `docs/gls/GUIA-COMPLETA-INTEGRACION-GLS.md:51`,
`docs/gls/README-IMPLEMENTACION-COMPLETA.md:216`.

**Estado:** son docs internos de configuración GLS, no se sirven cara al
cliente. Si en el futuro alguien genera docs públicos a partir de markdown
del repo, hay que migrar a referencias o auto-sustitución desde
`BUSINESS`.

### B.2 — Footer NO muestra la dirección fiscal

**Dónde:** `src/components/Footer.tsx:98`.

**Estado:** el footer solo muestra la dirección física (tienda). Algunos
juristas recomiendan que el footer también lleve un enlace o nota tipo
"Identificación del titular: ver Aviso Legal". Hoy se puede llegar al
Aviso Legal desde los links del footer, así que es discutible si urge.

---

## Datos y modelos (no relacionados con direcciones ni analytics)

### C.1 — Variantes de spelling en datos del titular

**Resuelto en este sprint:** las 3 variantes coexistentes ("Lopes",
"Lopez", "López") en hardcodes ya están unificadas a "López" vía
`BUSINESS.physicalAddress.street`. Pero en el seed de Prisma
(`prisma/seed.ts`) y en cualquier registro persistido (órdenes ya
emitidas, comprobantes, etc.) puede quedar residual. Auditar si hace
falta migración de datos.

---

## Sin urgencia, pero anotado

- `src/app/cookies/page.tsx:2` importa `Cookie` de lucide-react pero
  no se usa en el JSX. Linter limpio probablemente lo flaggea como warning.
- En `src/app/carrito/page.tsx`, el `useEffect` de view_cart tiene como
  dependencia `viewCartFired` que solo cambia una vez; podría simplificarse
  con un `useRef`, pero la implementación actual es legible y funciona.
