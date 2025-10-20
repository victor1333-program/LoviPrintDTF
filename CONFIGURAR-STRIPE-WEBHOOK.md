# ⚡ Guía Rápida: Configurar Stripe Webhook (5 minutos)

## Estado Actual
- ✅ Stripe Secret Key configurada (test mode)
- ❌ Webhook Secret sin configurar
- **Impacto:** Los pagos NO se confirmarán automáticamente

---

## Pasos para Configurar (5 minutos)

### 1. Ir a Stripe Dashboard
```
https://dashboard.stripe.com/test/webhooks
```
(Asegúrate de estar en **Test Mode** - toggle arriba a la derecha)

### 2. Crear Webhook
1. Click en **"+ Add endpoint"**

2. Configurar:
   ```
   Endpoint URL: https://loviprintdtf.es/api/payments/webhook
   ```

3. En "Events to send", seleccionar:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

4. Click **"Add endpoint"**

### 3. Copiar Signing Secret
1. En la lista de webhooks, click en el webhook recién creado
2. En la sección **"Signing secret"**, click **"Reveal"**
3. Copiar el secret completo (empieza con `whsec_...`)
   ```
   Ejemplo: whsec_1a2b3c4d5e6f7g8h9i0j
   ```

### 4. Actualizar .env en el Servidor
```bash
# SSH al servidor
ssh root@loviprintdtf.es

# Editar .env
nano /root/loviprintDTF/.env

# Buscar la línea:
STRIPE_WEBHOOK_SECRET=whsec_REEMPLAZAR_CON_TU_WEBHOOK_SECRET

# Reemplazar con el secret copiado:
STRIPE_WEBHOOK_SECRET=whsec_1a2b3c4d5e6f7g8h9i0j  # ← Pegar aquí

# Guardar: Ctrl+O, Enter, Ctrl+X
```

### 5. Reiniciar Aplicación
```bash
./manage.sh restart
```

### 6. Verificar Configuración
```bash
node scripts/test-stripe-webhook.js
```

Deberías ver:
```
✅ Stripe Secret Key: Configurada (TEST MODE)
✅ Webhook Secret: Configurado correctamente
✅ Stripe completamente configurado
```

---

## Probar que Funciona

### Test Completo de Pago

1. **Ir a tu web:**
   ```
   https://loviprintdtf.es
   ```

2. **Crear un pedido de prueba:**
   - Agregar producto al carrito
   - Ir a checkout
   - Completar datos

3. **Usar tarjeta de prueba de Stripe:**
   ```
   Número: 4242 4242 4242 4242
   Fecha: Cualquier fecha futura (ej: 12/25)
   CVC: Cualquier 3 dígitos (ej: 123)
   ```

4. **Completar el pago**

5. **Verificar que TODO funciona:**
   - ✅ Redirige a página de confirmación
   - ✅ Pedido marcado como PAID en la base de datos
   - ✅ Email de confirmación enviado
   - ✅ Puntos de fidelidad otorgados

### Ver Logs del Webhook en Stripe

1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Click en tu webhook
3. Ver la pestaña **"Events"**
4. Deberías ver evento con status **200 OK**

---

## Troubleshooting

### Error: "Webhook signature verification failed"
**Causa:** El webhook secret está mal configurado

**Solución:**
1. Verifica que copiaste el secret completo
2. Asegúrate que no hay espacios extra
3. Reinicia la aplicación después de cambiar el .env

### Webhook recibe 404
**Causa:** URL incorrecta

**Verificar:**
- URL debe ser exactamente: `https://loviprintdtf.es/api/payments/webhook`
- Sin trailing slash al final
- HTTPS, no HTTP

### Eventos no llegan
**Causa:** Stripe no puede alcanzar tu servidor

**Verificar:**
1. Tu servidor está corriendo: `./manage.sh status`
2. Puerto 3000 está abierto
3. SSL/HTTPS funciona correctamente

---

## Para Producción (Cuando sea el momento)

Cuando quieras activar pagos REALES:

1. **Cambiar a Live Mode en Stripe Dashboard**
2. **Crear nuevo webhook en Live Mode**
   - Misma URL: `https://loviprintdtf.es/api/payments/webhook`
   - Mismos eventos
3. **Actualizar .env con claves LIVE:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_XXXXXXXX        # Desde Live Mode
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX      # Desde webhook Live
   ```
4. **Reiniciar aplicación**

⚠️ **IMPORTANTE:** Las claves de test NO funcionan en live mode y viceversa

---

## Resumen

**Tiempo total:** 5-10 minutos

**Pasos:**
1. ✅ Ir a https://dashboard.stripe.com/test/webhooks
2. ✅ Crear endpoint con URL: https://loviprintdtf.es/api/payments/webhook
3. ✅ Copiar signing secret
4. ✅ Actualizar STRIPE_WEBHOOK_SECRET en .env
5. ✅ Reiniciar aplicación
6. ✅ Probar con pago de prueba

**Resultado:** Sistema de pagos completamente funcional ✅

---

**¿Necesitas ayuda?** Contáctanos o revisa `CONFIGURACION-STRIPE.md` para más detalles.
