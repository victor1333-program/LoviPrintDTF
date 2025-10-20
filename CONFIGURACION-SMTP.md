# Configuración SMTP para Emails

Este documento explica cómo configurar el envío de emails en LoviPrintDTF.

## Estado Actual

⚠️ **SMTP NO CONFIGURADO** - Los emails están configurados con valores placeholder

## Opción 1: Configurar Gmail SMTP (Recomendado)

### Paso 1: Crear contraseña de aplicación en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com
2. Navega a **Seguridad**
3. Activa la **Verificación en 2 pasos** (si no está activada)
4. Busca **Contraseñas de aplicaciones**
5. Selecciona:
   - Aplicación: **Correo**
   - Dispositivo: **Otro (nombre personalizado)**
   - Nombre: `LoviPrintDTF Production`
6. Copia la contraseña de 16 caracteres generada

### Paso 2: Actualizar variables de entorno

Edita tu archivo `.env`:

```bash
# Gmail SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="tu-email@gmail.com"          # ⚠️ REEMPLAZAR
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"     # ⚠️ REEMPLAZAR con contraseña de aplicación
SMTP_FROM="info@loviprintdtf.es"        # Email que aparecerá como remitente
```

### Paso 3: Verificar configuración

```bash
# Enviar email de prueba desde la aplicación
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"tu-email@gmail.com"}'
```

---

## Opción 2: Usar SendGrid (Alternativa Profesional)

SendGrid ofrece 100 emails/día gratis, ideal para producción.

### Paso 1: Crear cuenta en SendGrid

1. Registrarse en: https://sendgrid.com
2. Verificar tu dominio `loviprintdtf.es`
3. Crear un API Key

### Paso 2: Actualizar variables de entorno

```bash
# SendGrid Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"                      # Siempre es "apikey"
SMTP_PASSWORD="SG.XXXXXXXXXXXXXXXX"     # ⚠️ Tu API Key de SendGrid
SMTP_FROM="info@loviprintdtf.es"
```

### Ventajas de SendGrid:
- ✅ Mayor tasa de entrega
- ✅ Estadísticas de emails
- ✅ No hay límites de Gmail
- ✅ Reputación mejorada

---

## Opción 3: Usar Resend (Más Moderno)

Resend es una alternativa moderna y fácil de configurar.

### Paso 1: Crear cuenta en Resend

1. Registrarse en: https://resend.com
2. Verificar tu dominio
3. Obtener API Key

### Paso 2: Instalar SDK de Resend

```bash
npm install resend
```

### Paso 3: Modificar código de emails

Editar `src/lib/email.ts` para usar Resend en vez de Nodemailer:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}) {
  await resend.emails.send({
    from: 'LoviPrintDTF <info@loviprintdtf.es>',
    to,
    subject,
    html,
  })
}
```

---

## Opción 4: Desactivar Emails Temporalmente

Si no necesitas emails inmediatamente, puedes desactivarlos:

### Editar `src/lib/email.ts`

```typescript
export async function sendEmail(...args) {
  // Modo desarrollo - solo logear
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Email que se enviaría:', args)
    return { success: true, messageId: 'dev-mode' }
  }

  // Producción - enviar real
  // ... código actual
}
```

---

## Verificación de Configuración

### Script de prueba

Crear archivo `scripts/test-email.js`:

```javascript
const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'tu-email@gmail.com',
      subject: 'Test LoviPrintDTF',
      html: '<h1>Email funcionando correctamente</h1>',
    })
    console.log('✅ Email enviado:', info.messageId)
  } catch (error) {
    console.error('❌ Error enviando email:', error)
  }
}

testEmail()
```

Ejecutar:
```bash
node scripts/test-email.js
```

---

## Troubleshooting

### Error: "Invalid login"
- ✅ Verifica que SMTP_USER y SMTP_PASSWORD sean correctos
- ✅ Si usas Gmail, asegúrate de usar contraseña de aplicación, no tu contraseña normal
- ✅ Verifica que la verificación en 2 pasos esté activada

### Error: "Connection timeout"
- ✅ Verifica SMTP_HOST y SMTP_PORT
- ✅ Asegúrate de que tu firewall permita conexiones SMTP
- ✅ Algunos ISP bloquean puerto 587, prueba puerto 465

### Emails van a spam
- ✅ Configura SPF record en tu DNS
- ✅ Configura DKIM
- ✅ Usa un servicio profesional como SendGrid

---

## Emails que envía la aplicación

La aplicación envía estos emails:

1. **Confirmación de pedido** - Cuando se crea un pedido
2. **Actualización de estado** - Cuando cambia el estado del pedido
3. **Etiqueta de envío** - Cuando se genera etiqueta GLS
4. **Bono activado** - Cuando se compra un bono
5. **Recordatorio de bono** - Cuando un bono está por caducar (si implementado)

---

## Recomendación Final

Para **producción inmediata**: Usar Gmail SMTP (rápido de configurar)
Para **largo plazo**: Migrar a SendGrid o Resend (más profesional)

---

## Checklist

- [ ] SMTP_HOST configurado
- [ ] SMTP_PORT configurado
- [ ] SMTP_USER configurado
- [ ] SMTP_PASSWORD configurado
- [ ] SMTP_FROM configurado
- [ ] Email de prueba enviado correctamente
- [ ] SPF/DKIM configurados (opcional pero recomendado)
- [ ] Emails de confirmación de pedido probados
- [ ] Emails no van a spam

---

**Última actualización:** $(date)
**Estado:** ⚠️ Pendiente de configuración
