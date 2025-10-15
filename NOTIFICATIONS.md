# Sistema de Notificaciones 🔔

Este documento describe cómo funciona el sistema de notificaciones automáticas del proyecto DTF Print Services.

## 📧 Notificaciones por Email

### Tipos de Notificaciones Implementadas

#### 1. Creación de Pedido
- **Cuándo:** Automáticamente cuando se crea un pedido nuevo
- **Destinatarios:** Cliente y Admin
- **Contenido:**
  - Confirmación del pedido
  - Número de pedido
  - Detalles de productos
  - Total y desglose de precios
  - Tiempo estimado de entrega

#### 2. Cambio de Estado del Pedido
- **Cuándo:** Cuando el estado del pedido cambia
- **Destinatario:** Cliente
- **Estados:**
  - `PENDING` - Pendiente
  - `CONFIRMED` - Confirmado ✅
  - `IN_PRODUCTION` - En Producción 🏭
  - `READY` - Listo para Envío 📦
  - `SHIPPED` - Enviado 🚚
  - `DELIVERED` - Entregado ✅
  - `CANCELLED` - Cancelado ❌

#### 3. Pedido Enviado con Tracking
- **Cuándo:** Cuando el pedido cambia a estado `SHIPPED`
- **Destinatario:** Cliente
- **Contenido:**
  - Número de seguimiento
  - URL de tracking
  - Fecha estimada de entrega

#### 4. Pedido Entregado
- **Cuándo:** Cuando el pedido cambia a estado `DELIVERED`
- **Destinatario:** Cliente
- **Contenido:** Confirmación de entrega y agradecimiento

#### 5. Caducidad de Bono (7 días antes)
- **Cuándo:** 7 días antes de que caduque un bono
- **Destinatario:** Usuario con el bono asignado
- **Contenido:**
  - Nombre del bono
  - Código del bono
  - Fecha de caducidad
  - Metros restantes
  - Envíos restantes

---

## ⚙️ Configuración

### 1. Variables de Entorno

Añade estas variables al archivo `.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="DTF Print Services <noreply@dtfprint.com>"

# Cron Job Secret (para proteger endpoints)
CRON_SECRET=change-this-to-a-random-secret-key
```

### 2. Configuración de Gmail (Ejemplo)

Si usas Gmail:

1. Habilita "Verificación en 2 pasos" en tu cuenta de Google
2. Ve a: https://myaccount.google.com/apppasswords
3. Genera una "Contraseña de aplicación"
4. Usa esa contraseña en `SMTP_PASS`

**Configuración:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Contraseña de aplicación (sin espacios)
```

### 3. Otras Opciones de SMTP

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

#### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

---

## 🤖 Cron Job para Bonos

### Endpoint
```
GET /api/cron/check-voucher-expiration
Authorization: Bearer YOUR_CRON_SECRET
```

### Configurar Cron Job

#### Opción 1: cron-job.org (Gratis y Fácil)

1. Regístrate en https://cron-job.org
2. Crea un nuevo cron job:
   - **URL:** `https://tu-dominio.com/api/cron/check-voucher-expiration`
   - **Schedule:** `0 9 * * *` (Diariamente a las 9 AM)
   - **HTTP Header:**
     - Name: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`

#### Opción 2: GitHub Actions

Crea `.github/workflows/check-vouchers.yml`:

```yaml
name: Check Voucher Expiration

on:
  schedule:
    # Ejecutar diariamente a las 9 AM UTC
    - cron: '0 9 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  check-vouchers:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.com/api/cron/check-voucher-expiration
```

#### Opción 3: Vercel Cron Jobs

Añade a `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/check-voucher-expiration",
    "schedule": "0 9 * * *"
  }]
}
```

Y modifica el endpoint para verificar el header de Vercel en lugar del Bearer token.

#### Opción 4: Linux Crontab

```bash
# Editar crontab
crontab -e

# Añadir esta línea (ejecutar diariamente a las 9 AM)
0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://tu-dominio.com/api/cron/check-voucher-expiration
```

---

## 🧪 Testing

### 1. Test Email Manual

Puedes probar el envío de emails desde el panel de admin:

```bash
# Endpoint para enviar email de prueba
POST /api/notifications/email
Authorization: Bearer admin-token

{
  "type": "ORDER_CREATED",
  "data": {
    "customerEmail": "test@example.com",
    "customerName": "Test User",
    "orderNumber": "ORD-123456",
    "totalPrice": 100,
    "items": [...]
  }
}
```

### 2. Test Cron Job

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3001/api/cron/check-voucher-expiration
```

---

## 📊 Monitoreo

### Logs del Sistema

Los emails enviados se registran en la consola:

```
✅ Email enviado: <message-id>
📧 Preview URL: https://ethereal.email/message/xxx (solo en desarrollo)
```

### Verificar Estado

Los endpoints devuelven información sobre el envío:

```json
{
  "success": true,
  "emailsSent": 5,
  "emailsFailed": 0
}
```

---

## 🎨 Personalización de Templates

Los templates HTML están en:
- `/src/lib/email.ts` - Templates actuales del sistema
- `/src/lib/email/email-service.ts` - Nuevos templates mejorados

Para personalizar:

1. Edita el HTML en las funciones `generate*HTML()`
2. Cambia colores, textos, estilos inline
3. Añade tu logo y branding

---

## 🚨 Solución de Problemas

### Emails No Se Envían

1. **Verifica configuración SMTP:**
   ```bash
   # En la consola deberías ver:
   ✅ Email enviado: <message-id>
   ```

2. **Revisa credenciales:** Asegúrate de que `SMTP_USER` y `SMTP_PASS` sean correctos

3. **Firewall/Puerto bloqueado:** Intenta con puerto 465 (SSL) o 587 (TLS)

4. **Gmail:** Usa contraseña de aplicación, no tu contraseña normal

### Emails Van a Spam

1. Configura SPF, DKIM y DMARC en tu dominio
2. Usa un servicio profesional (SendGrid, Mailgun, Amazon SES)
3. Evita palabras spam ("gratis", "oferta", etc.)
4. Incluye enlace de "unsubscribe"

### Cron Job No Funciona

1. Verifica que el `CRON_SECRET` sea correcto
2. Revisa logs del cron service
3. Prueba manualmente con curl
4. Verifica que la URL sea accesible públicamente

---

## 📝 Notas Importantes

- ✅ Los emails se envían en **background** (no bloquean las peticiones)
- ✅ Si falla el envío, se registra el error pero no afecta el pedido
- ✅ En **desarrollo** sin SMTP configurado, se usa Ethereal Email (emails de prueba)
- ✅ Los templates son **responsivos** y funcionan en móviles
- ✅ Todos los emails incluyen **fallback a texto plano**

---

## 🔜 Mejoras Futuras

- [ ] Notificaciones push en navegador
- [ ] Notificaciones SMS
- [ ] WhatsApp notifications
- [ ] Email tracking (abiertos, clicks)
- [ ] Templates personalizables desde admin
- [ ] Multi-idioma en emails
- [ ] Programación de envíos
- [ ] A/B testing de templates

---

## 📞 Soporte

Si tienes problemas, verifica:
1. Logs de consola
2. Variables de entorno
3. Configuración SMTP
4. Estado del servicio de email

Para más ayuda, revisa la documentación de Nodemailer: https://nodemailer.com/
