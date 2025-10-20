# Configuración de Stripe Webhook

Este documento explica cómo configurar los webhooks de Stripe para procesar pagos correctamente.

## Estado Actual

⚠️ **WEBHOOK SECRET NO CONFIGURADO** - Los pagos no se verificarán correctamente

## ¿Qué es un Webhook Secret?

El webhook secret es una clave que Stripe usa para firmar los eventos que envía a tu servidor. Esto garantiza que:
- Los eventos provienen realmente de Stripe (no de un atacante)
- Los eventos no han sido modificados en tránsito
- No se pueden replicar eventos antiguos

**Sin este secret, tu aplicación es vulnerable a ataques de pago falso.**

---

## Configuración en Modo Desarrollo (Test Mode)

### Paso 1: Acceder al Dashboard de Stripe

1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Asegúrate de estar en **Test Mode** (toggle arriba a la derecha)

### Paso 2: Crear un nuevo webhook

1. Click en **"+ Add endpoint"**
2. Configurar:
   - **Endpoint URL**: `https://tu-dominio.com/api/payments/webhook`
     - Para desarrollo local: `http://localhost:3000/api/payments/webhook`
     - Para producción: `https://loviprintdtf.es/api/payments/webhook`

3. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`

4. Click **"Add endpoint"**

### Paso 3: Obtener el Signing Secret

1. En la lista de webhooks, click en el webhook recién creado
2. En la sección **"Signing secret"**, click en **"Reveal"**
3. Copiar el secret (empieza con `whsec_...`)

### Paso 4: Actualizar .env

```bash
# Stripe Test Mode
STRIPE_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXX"
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXXX"  # ⚠️ REEMPLAZAR
```

---

## Configuración en Producción (Live Mode)

⚠️ **IMPORTANTE**: Nunca uses las claves de test en producción

### Paso 1: Cambiar a Live Mode

1. En Stripe Dashboard, cambiar toggle a **Live Mode**
2. Ir a: https://dashboard.stripe.com/webhooks

### Paso 2: Crear webhook de producción

Seguir los mismos pasos que en test mode, pero con:
- **Endpoint URL**: `https://loviprintdtf.es/api/payments/webhook`
- Usar **Live Mode** keys

### Paso 3: Actualizar .env de producción

```bash
# Stripe Production
STRIPE_SECRET_KEY="sk_live_XXXXXXXXXXXXXXXX"      # ⚠️ Clave LIVE
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXXX"    # ⚠️ Secret LIVE
```

⚠️ **CRÍTICO**:
- Las claves `sk_test_` solo funcionan en test mode
- Las claves `sk_live_` solo funcionan en live mode
- Los webhook secrets también son diferentes entre test y live

---

## Testing de Webhooks en Local (Stripe CLI)

Para probar webhooks en desarrollo local sin exponer tu servidor:

### Paso 1: Instalar Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Paso 2: Autenticar

```bash
stripe login
```

### Paso 3: Escuchar webhooks

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Esto generará un webhook secret temporal:
```
> Ready! Your webhook signing secret is whsec_XXXXX (^C to quit)
```

Usar este secret en `.env.local` para desarrollo:
```bash
STRIPE_WEBHOOK_SECRET="whsec_XXXXX"  # Del Stripe CLI
```

### Paso 4: Disparar eventos de prueba

```bash
# Simular un pago exitoso
stripe trigger checkout.session.completed

# Simular un pago fallido
stripe trigger payment_intent.payment_failed
```

---

## Verificar que Webhooks Funcionan

### 1. Revisar logs de Stripe Dashboard

1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Click en tu webhook
3. Ver la pestaña **"Events"**
4. Deberías ver eventos con status `200 OK`

### 2. Revisar logs de la aplicación

Cuando un webhook se procesa correctamente, verás logs como:

```
✅ Webhook verified: checkout.session.completed
✅ Order DTP-20250116-XXXX marked as PAID
✅ Awarded 150 loyalty points
```

### 3. Crear un pago de prueba

```bash
# Test mode - usar tarjeta de prueba
# Número: 4242 4242 4242 4242
# Fecha: Cualquier fecha futura
# CVC: Cualquier 3 dígitos

# Debería:
# 1. Crear el pedido
# 2. Redirigir a Stripe Checkout
# 3. Completar pago
# 4. Webhook actualiza pedido a PAID
# 5. Email de confirmación enviado
```

---

## Errores Comunes

### Error 401: "No signatures found"

**Causa**: `STRIPE_WEBHOOK_SECRET` no configurado o incorrecto

**Solución**:
```bash
# Verificar que .env tiene el secret correcto
echo $STRIPE_WEBHOOK_SECRET

# Debe empezar con whsec_
```

### Error 400: "Timestamp outside of tolerance"

**Causa**: Reloj del servidor desincronizado

**Solución**:
```bash
# Sincronizar reloj del servidor
sudo ntpdate -s time.nist.gov
```

### Webhook recibe 404

**Causa**: Ruta incorrecta

**Verificar**:
- URL debe ser exactamente: `/api/payments/webhook`
- Sin trailing slash
- HTTPS en producción

### Eventos duplicados

**Causa**: Stripe reintenta webhooks si no recibe 200 OK

**Solución**:
- Asegurarse de que el endpoint siempre devuelve status 200
- Implementar idempotencia (ya implementado en el código)

---

## Seguridad del Webhook

### Verificación de firma (Ya implementado)

El código actual en `src/app/api/payments/webhook/route.ts` ya verifica:

```typescript
const signature = headers().get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  signature!,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

✅ Esto previene ataques de webhook spoofing

### Rate Limiting (Ya implementado)

Ya hay rate limiting en el endpoint de webhooks.

### HTTPS Obligatorio en Producción

⚠️ Stripe requiere HTTPS para webhooks en producción.

---

## Eventos Soportados

La aplicación maneja estos eventos de Stripe:

| Evento | Descripción | Acción |
|--------|-------------|--------|
| `checkout.session.completed` | Pago completado | Marcar pedido como PAID, otorgar puntos |
| `payment_intent.succeeded` | Intento de pago exitoso | Backup del anterior |
| `payment_intent.payment_failed` | Pago falló | Marcar pedido como FAILED |
| `charge.refunded` | Reembolso procesado | Actualizar pedido (TODO) |

---

## Monitoreo de Webhooks

### Dashboard de Stripe

1. Ver eventos recientes: https://dashboard.stripe.com/test/events
2. Buscar eventos específicos por ID
3. Ver payload completo y respuesta del servidor

### Logs de Aplicación

```bash
# Ver logs de webhooks en producción
pm2 logs loviprintdtf --lines 100 | grep webhook

# Filtrar solo errores
pm2 logs loviprintdtf --err
```

---

## Rollback Plan

Si los webhooks fallan en producción:

1. **Procesar pedidos manualmente**:
   ```sql
   UPDATE "Order"
   SET status = 'PAID', "paidAt" = NOW()
   WHERE "orderNumber" = 'DTP-XXXXXXXX';
   ```

2. **Reenviar webhook desde Stripe**:
   - Dashboard > Events > Click evento > "Resend event"

3. **Desactivar webhook temporalmente**:
   - Dashboard > Webhooks > Deshabilitar endpoint

---

## Checklist de Configuración

### Test Mode
- [ ] Webhook creado en Stripe Dashboard (Test Mode)
- [ ] URL correcta: `http://localhost:3000/api/payments/webhook`
- [ ] Eventos configurados: `checkout.session.completed`, `payment_intent.*`
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado en `.env`
- [ ] Pago de prueba completado exitosamente
- [ ] Pedido marcado como PAID en base de datos
- [ ] Puntos de fidelidad otorgados correctamente

### Production
- [ ] Webhook creado en Stripe Dashboard (Live Mode)
- [ ] URL correcta: `https://loviprintdtf.es/api/payments/webhook`
- [ ] HTTPS configurado y funcionando
- [ ] `STRIPE_WEBHOOK_SECRET` de producción en `.env`
- [ ] SSL certificate válido
- [ ] Primer pago real probado
- [ ] Monitoreo configurado (alertas si webhook falla)

---

## Enlaces Útiles

- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Dashboard Test](https://dashboard.stripe.com/test/webhooks)
- [Dashboard Live](https://dashboard.stripe.com/webhooks)
- [Test Cards](https://stripe.com/docs/testing#cards)

---

**Última actualización:** 2025-01-16
**Estado:** ⚠️ Pendiente de configuración
