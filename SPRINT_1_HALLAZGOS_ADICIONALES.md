# Sprint 1 — Hallazgos adicionales

Cosas detectadas durante la ejecución del Sprint 1 que están **fuera del alcance** de las 5 tareas y no se han tocado. Se documentan aquí para próximos sprints, junto con su severidad y una recomendación.

---

## Contexto: estado del working tree al iniciar el sprint

Antes de empezar había 16 archivos modificados y una carpeta nueva (`src/components/analytics/ClarityAnalytics.tsx`) sin commitear en `main`. Era trabajo previo coherente que solapaba parcialmente con la Tarea 1 (responsive móvil) y aportaba un setup completo de Microsoft Clarity con consent gating. Decisión acordada: se preserva en 2 commits `chore(pre-sprint): …` al inicio de la rama del sprint, para no perderlo y para que la Tarea 1 construya encima sin duplicar trabajo. Estos 2 commits **no son del sprint**, pero viajan en la rama y se mergearán a `main` con ella.

---

## Discrepancias entre el brief y el estado real del código

Los siguientes puntos del brief original asumían algo que el código ya tenía resuelto, total o parcialmente. No requieren acción nueva pero conviene tenerlos documentados:

1. **Páginas legales no daban 404.** Todas existen y están enlazadas correctamente desde el footer (`/aviso-legal`, `/terminos`, `/privacidad`, `/envios` —incluye devoluciones—, `/cookies`). El alcance de la Tarea 4 se redujo a mejoras puntuales de contenido en lugar de crearlas desde cero.
2. **Hamburguesa del navbar y caja flotante del hero ya estaban tratadas en el working tree previo** (ver commit `chore(pre-sprint): mejoras responsive movil…`). La hamburguesa ya tenía área táctil 44px, `aria-expanded`/`aria-controls` y panel móvil completo. La caja de beneficios del hero estaba oculta en móvil (`hidden md:block`), por lo que el "se superpone al headline" en móvil real no se reproducía. La Tarea 1 se centró por tanto en la pieza que sí quedaba pendiente: la tabla de precios por tramos de la ficha de producto, que era ilegible (3 cols × 10px en móvil).

---

## Hallazgos fuera de alcance

### A. Datos de facturación inconsistentes

- **Severidad:** media-alta (legal/contable).
- **Detalle:** la dirección del titular está en dos sitios distintos:
  - `prisma/seed.ts:843` y todas las páginas legales: `Calle Antonio López del Oro 7, 02400 Hellín (Albacete)`.
  - `src/lib/invoice.ts:24`: `Calle Monecilla 10`.
- **Recomendación:** identificar cuál es la dirección fiscal correcta para facturación y unificar. Si la dirección fiscal es Monecilla 10 pero el centro de operaciones es Antonio López del Oro 7, dejarlo claro en `lib/invoice.ts` y mantener ambas referencias coherentes.

### B. Lógica de "envío gratis" acoplada al precio numérico

- **Severidad:** media.
- **Detalle:** en `src/app/carrito/page.tsx:848` y `src/app/checkout/page.tsx:739` hay un comentario y una condición del tipo `precio <= 6€` para determinar si un método de envío es "estándar" y por tanto elegible para gratis por bono. Si en el futuro la tarifa estándar sube a, por ejemplo, 6,50€, la lógica se rompe silenciosamente.
- **Recomendación:** añadir un flag explícito al modelo `ShippingMethod` (por ejemplo `isFreeEligible: Boolean` o `tier: 'STANDARD' | 'EXPRESS'`) y filtrar por ese flag en lugar de por el precio.

### C. Contenido del FAQ duplicado entre `/faq` y `FAQSection.tsx`

- **Severidad:** baja-media.
- **Detalle:** hay dos fuentes de preguntas/respuestas que solapan: la página completa `/faq/page.tsx` (con preguntas de envíos, entre otras) y el componente `src/components/FAQSection.tsx` que se incrusta en la home y solo contiene 10 preguntas. Esta duplicación fue precisamente la causa raíz de la discrepancia del precio del envío (`/faq` decía 5,95€ y nadie lo notó porque `FAQSection.tsx` no mostraba esa pregunta).
- **Recomendación:** unificar fuente. Pasar todas las FAQ a un solo array (por ejemplo en `src/lib/faqs.ts`) y consumirlo desde ambos lugares, filtrando por categoría en el componente del home.

### D. `/envios` mencionaba mensajeros que no se usan

- **Severidad:** baja (ya corregido en Tarea 4).
- **Detalle:** la página listaba SEUR, MRW y Correos Express, pero la única integración real en el código es **GLS** (`src/lib/services/gls-service`). Corregido en la Tarea 4 dejando solo GLS.
- **Recomendación de futuro:** si se incorporan otros transportistas, mantener `/envios` sincronizado con `prisma.shippingMethod` y la implementación real.

### E. Widgets flotantes acumulados pueden tapar contenido en móvil

- **Severidad:** baja.
- **Detalle:** en móvil hay tres widgets flotantes que pueden coincidir en pantalla: `WhatsAppWidget`, `B2BContactWidget` y `CookieBanner` (este último solo hasta que el usuario lo acepte). El espacio inferior queda muy ocupado.
- **Recomendación:** consolidar widgets de contacto (WhatsApp + B2B) en un único FAB expandible, o ocultar B2B en móvil si el público objetivo es B2C.

### F. Textarea del FAQ-page tiene preguntas redundantes/contradictorias

- **Severidad:** baja.
- **Detalle:** `/faq/page.tsx` tiene preguntas que se solapan entre sí (varias hablan de tiempos de envío, varias hablan de garantías) y algunas usan formato con punto decimal (`5.95€`) mientras otras usan formato europeo. La Tarea 5 unificó el caso del envío a `6,00€`, pero el resto del FAQ no se ha homogeneizado.
- **Recomendación:** auditoría editorial del FAQ completo y migración a formato europeo (coma decimal) en todos los precios y separador de miles.

### G. SEO/metadata de páginas legales

- **Severidad:** baja.
- **Detalle:** las páginas legales no tienen `noindex` ni canonical específicos (excepto `/aviso-legal`). Si bien es legítimo indexarlas, lo habitual en e-commerce es marcarlas como `noindex, follow` para no diluir el ranking de las páginas comerciales.
- **Recomendación:** decidir estrategia SEO para legales y aplicar `robots` consistente.

---

## Verificación pendiente

Como Claude Code no puede abrir un navegador interactivo, no he podido validar visualmente los cambios responsive en viewport real (390 / 414 / 360 px). Esta verificación queda pendiente para el usuario antes de mergear a `main`:

- **Home (`/`)**: en 390px, comprobar que el headline se vea entero, los CTAs queden visibles sin scroll y la navegación funcione.
- **Ficha de producto (`/productos/transfer-dtf`)**: en 390px, comprobar que la tabla de precios por tramos se vea como **lista vertical** con el rango a la izquierda y el precio a la derecha, sin truncamiento, y que el widget de compra no se solape con la foto/contenido.
- **Carrito**: añadir 2m, volver a la ficha, añadir 3m y verificar que aparece el toast persistente naranja con `[Ver carrito]` y `[Seguir comprando]` que muestra el total (5m) sin redirigir solo.
- **Footer → legales**: visitar las 5 páginas y comprobar que cargan, el contenido renderiza y los teléfonos/datos del titular aparecen.

Build de producción (`npm run build`) recomendado antes del merge.
