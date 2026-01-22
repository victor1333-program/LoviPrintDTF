# ✅ CHECKLIST DE PRODUCCIÓN - LoviPrintDTF

Este documento contiene la lista completa de tareas a completar antes de desplegar a producción.

**Estado actual:** ⚠️ NO LISTO PARA PRODUCCIÓN
**Progreso:** 8/15 tareas críticas completadas

---

## 🔴 CRÍTICO - Resolver ANTES de producción

### 1. Seguridad y Configuración

#### ✅ AUTH_SECRET actualizado
- [x] `AUTH_SECRET` cambiado a valor fuerte de 32+ caracteres
- [x] Nunca comitear `.env` al repositorio
- **Comando usado:**
  ```bash
  openssl rand -base64 32
  ```

#### ⚠️ SMTP Configurado o Desactivado
- [ ] Leer `CONFIGURACION-SMTP.md`
- [ ] Configurar Gmail SMTP o SendGrid
- [ ] Actualizar `.env` con credenciales reales
- [ ] Enviar email de prueba
- [ ] O desactivar emails temporalmente

**Archivo:** `CONFIGURACION-SMTP.md`

#### ⚠️ Stripe Webhook Secret
- [ ] Leer `CONFIGURACION-STRIPE.md`
- [ ] Crear webhook en Stripe Dashboard (Live Mode)
- [ ] Obtener signing secret (`whsec_...`)
- [ ] Actualizar `STRIPE_WEBHOOK_SECRET` en `.env`
- [ ] Probar pago de prueba end-to-end

**Archivo:** `CONFIGURACION-STRIPE.md`

#### ✅ Next.js Actualizado
- [x] Actualizado a Next.js 15.5.5
- [x] Vulnerabilidades de seguridad parcheadas
- **Versión:** 15.5.5

#### ✅ Variables de Entorno Protegidas
- [x] Archivo `.env` en `.gitignore`
- [x] No hay claves en el código fuente
- [x] `.env.example` actualizado

---

### 2. Código y Seguridad

#### ✅ Console.logs Removidos de Middleware
- [x] Middleware sin logs que expongan información sensible
- **Archivo:** `src/middleware.ts`

#### ✅ Rate Limiting Implementado
- [x] Rate limiting en endpoints críticos
- [x] `/api/upload` - 10 requests/min
- [x] `/api/auth/*` - 5 requests/min
- [x] `/api/payments/webhook` - 100 requests/min
- **Archivo:** `src/lib/rate-limit.ts`

#### ✅ Validación de Archivos Robusta
- [x] Validación de tipo MIME
- [x] Validación de extensión
- [x] Límite de tamaño (50MB)
- [x] Prevención de path traversal
- **Archivo:** `src/app/api/upload/route.ts`

#### ✅ Sanitización HTML
- [x] DOMPurify instalado
- [x] Utilidades de sanitización creadas
- [ ] **TODO:** Aplicar en forms de usuario
- **Archivo:** `src/lib/sanitize.ts`

#### ✅ Lógica Duplicada Refactorizada
- [x] Función `awardLoyaltyPointsForOrder` compartida
- [x] Usada en webhook y verify-payment
- **Archivo:** `src/lib/loyalty.ts`

#### ⚠️ Console.logs en APIs
- [x] Logger condicional creado
- [ ] **TODO:** Reemplazar console.log en APIs con logger
- [ ] **TODO:** Usar `logger.info()` en desarrollo, silencio en prod
- **Archivo:** `src/lib/logger.ts`

**Archivos afectados:**
- `src/app/api/payments/create-checkout/route.ts`
- `src/app/api/payments/verify-payment/route.ts`
- `src/app/api/payments/webhook/route.ts`
- `src/app/api/orders/route.ts`

---

### 3. Configuración del Servidor

#### ⚠️ Base de Datos
- [ ] PostgreSQL configurada en producción
- [ ] Backup automático configurado
- [ ] `DATABASE_URL` actualizada en `.env`
- [ ] `prisma migrate deploy` ejecutado
- [ ] Datos de prueba eliminados (si los hay)

#### ⚠️ HTTPS y SSL
- [ ] Certificado SSL válido instalado
- [ ] HTTPS forzado (no HTTP)
- [ ] Redireccion HTTP → HTTPS configurada
- [ ] Certificados de Let's Encrypt renovándose automáticamente

**Scripts:** `setup-ssl.sh` y `get-letsencrypt-ssl.sh`

#### ⚠️ Cloudinary (Si se usa)
- [ ] Cuenta de Cloudinary creada
- [ ] `CLOUDINARY_CLOUD_NAME` configurado
- [ ] `CLOUDINARY_API_KEY` configurado
- [ ] `CLOUDINARY_API_SECRET` configurado
- [ ] Subir imagen de prueba funcionando

#### ⚠️ next.config.js
- [x] `remotePatterns` configurado correctamente
- [x] Sin IPs hardcodeadas
- [ ] Headers de seguridad configurados (opcional)

**Archivo:** `next.config.js`

---

### 4. Integrations Externas

#### ⚠️ GLS Shipping (Si se usa)
- [ ] Cuenta GLS activa
- [ ] API credentials configuradas
- [ ] `GLS_API_KEY` en `.env`
- [ ] `GLS_ENDPOINT` configurado
- [ ] Envío de prueba funcionando

#### ⚠️ WhatsApp Widget
- [ ] Número de WhatsApp configurado
- [ ] Widget visible en producción
- **Archivo:** `src/components/WhatsAppWidget.tsx`

---

## 🟡 IMPORTANTE - Resolver en corto plazo

### 5. Testing

#### ⚠️ Testing End-to-End
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Crear pedido funciona
- [ ] Pago con Stripe funciona
- [ ] Webhook procesa pago correctamente
- [ ] Email de confirmación se envía
- [ ] Puntos de fidelidad se otorgan
- [ ] Uso de bono funciona
- [ ] Descarga de etiqueta funciona (si GLS configurado)

#### ⚠️ Testing de Admin
- [ ] Login como admin funciona
- [ ] Ver pedidos funciona
- [ ] Actualizar estado de pedido funciona
- [ ] Crear producto funciona
- [ ] Configuración se guarda correctamente

---

### 6. Performance y Monitoreo

#### ⚠️ Caché
- [ ] Redis instalado (opcional pero recomendado)
- [ ] Caché de configuraciones activo
- [ ] Caché de sesiones configurado

#### ⚠️ Logging y Monitoreo
- [ ] Logs centralizados (PM2 logs o similar)
- [ ] Sentry configurado para errores (recomendado)
- [ ] Uptime monitoring (UptimeRobot o similar)
- [ ] Google Analytics configurado (opcional)

#### ⚠️ Performance
- [ ] Lighthouse score > 80 en todas las páginas
- [ ] Imágenes optimizadas (usando next/image)
- [ ] Build size aceptable (< 500KB JS inicial)

---

### 7. SEO y Contenido

#### ⚠️ SEO Básico
- [ ] robots.txt creado
- [ ] sitemap.xml generado
- [ ] Metadatos en todas las páginas
- [ ] Open Graph tags configurados
- [ ] Favicon configurado

**Referencia:** Auditoría SEO realizada

#### ⚠️ Contenido Legal
- [x] Términos y Condiciones actualizados
- [x] Política de Privacidad actualizada
- [x] Política de Cookies actualizada
- [ ] Datos de contacto correctos
- [ ] Información de empresa correcta

---

## 🟢 OPCIONAL - Mejoras futuras

### 8. Mejoras Técnicas

- [ ] Migrar next-auth a versión estable (v4.24.11)
- [ ] Implementar compresión gzip/brotli
- [ ] Configurar CDN (Cloudflare)
- [ ] Implementar PWA (manifest.json)
- [ ] Agregar service worker para offline

### 9. Features Opcionales

- [ ] Sistema de reviews de productos
- [ ] Chat en vivo
- [ ] Newsletter/Mailchimp integration
- [ ] Blog de noticias
- [ ] Multi-idioma (i18n)

---

## 📋 RESUMEN DE ARCHIVOS IMPORTANTES

### Archivos de Configuración
- `.env` - Variables de entorno (⚠️ NUNCA COMITEAR)
- `.env.example` - Ejemplo de variables
- `next.config.js` - Configuración Next.js
- `server.js` - Servidor custom de producción
- `manage.sh` - Script de gestión PM2

### Documentación Creada
- `CONFIGURACION-SMTP.md` - Guía de configuración de emails
- `CONFIGURACION-STRIPE.md` - Guía de configuración de webhooks
- `CHECKLIST-PRODUCCION.md` - Este archivo
- `DEPLOYMENT.md` - Guía de despliegue
- `SSL-SETUP.md` - Configuración SSL

### Utilidades de Seguridad
- `src/lib/rate-limit.ts` - Rate limiting
- `src/lib/sanitize.ts` - Sanitización HTML
- `src/lib/logger.ts` - Sistema de logging
- `src/lib/loyalty.ts` - Lógica de fidelidad (refactorizada)

---

## 🚀 PROCESO DE DESPLIEGUE

### Paso 1: Pre-deploy checklist
```bash
# 1. Verificar que todas las tareas críticas estén completadas
# 2. Revisar este checklist línea por línea
# 3. Hacer backup de base de datos
pg_dump -U postgres loviprintdtf > backup-$(date +%Y%m%d).sql
```

### Paso 2: Build y test local
```bash
# Limpiar build anterior
rm -rf .next

# Build de producción
npm run build

# Verificar que no hay errores
echo $?  # Debe ser 0

# Test local en modo producción
NODE_ENV=production npm start

# Probar flujos críticos manualmente
```

### Paso 3: Deploy al servidor
```bash
# Subir código al servidor
git push origin main

# SSH al servidor
ssh root@loviprintdtf.es

# Actualizar código
cd /home/loviadmin/projects/loviprintdtf
git pull

# Instalar dependencias
npm install

# Ejecutar migraciones
npx prisma migrate deploy

# Build
npm run build

# Reiniciar PM2
./manage.sh restart
```

### Paso 4: Post-deploy verificación
```bash
# Verificar que el servicio está corriendo
./manage.sh status

# Ver logs en tiempo real
./manage.sh logs

# Probar endpoints críticos
curl https://loviprintdtf.es/api/health
curl https://loviprintdtf.es
```

### Paso 5: Testing en producción
- [ ] Abrir sitio web
- [ ] Registro de usuario de prueba
- [ ] Crear pedido de prueba (usar tarjeta de test)
- [ ] Verificar que webhook procesa pago
- [ ] Verificar email de confirmación
- [ ] Verificar puntos otorgados
- [ ] Login como admin
- [ ] Verificar dashboard admin

---

## ⚠️ ROLLBACK PLAN

Si algo sale mal en producción:

### Opción 1: Rollback de código
```bash
# Volver al commit anterior
git log --oneline -5  # Ver últimos commits
git reset --hard <commit-anterior>
npm install
npm run build
./manage.sh restart
```

### Opción 2: Rollback de base de datos
```bash
# Restaurar backup
psql -U postgres loviprintdtf < backup-YYYYMMDD.sql
```

### Opción 3: Poner sitio en mantenimiento
```bash
# Detener PM2
./manage.sh stop

# Mostrar página de mantenimiento (crear /home/loviadmin/projects/loviprintdtf/maintenance.html)
```

---

## 📞 CONTACTOS DE EMERGENCIA

### Servicios
- **Hosting:** [Proveedor de servidor]
- **DNS:** [Proveedor de dominio]
- **Stripe Support:** https://support.stripe.com
- **Cloudinary Support:** https://support.cloudinary.com

### Logs y Debugging
```bash
# Logs de PM2
./manage.sh logs

# Logs de Nginx (si aplica)
sudo tail -f /var/log/nginx/error.log

# Logs de base de datos
sudo journalctl -u postgresql

# Verificar puertos
ss -tulpn | grep :3000
```

---

## 📊 MÉTRICAS DE ÉXITO

Después del deploy, monitorear:

- **Uptime:** > 99.9%
- **Response time:** < 500ms promedio
- **Error rate:** < 0.1%
- **Build size:** < 500KB JS
- **Lighthouse score:** > 80

---

## ✅ FIRMA DE APROBACIÓN

Antes de ir a producción, confirmar:

- [ ] He revisado cada punto de este checklist
- [ ] Todas las tareas críticas están completadas
- [ ] He probado los flujos principales end-to-end
- [ ] Tengo un backup reciente de la base de datos
- [ ] Sé cómo hacer rollback si algo falla
- [ ] He leído DEPLOYMENT.md
- [ ] He configurado SMTP según CONFIGURACION-SMTP.md
- [ ] He configurado Stripe según CONFIGURACION-STRIPE.md

**Fecha de revisión:** ___________
**Revisado por:** ___________
**Aprobado para producción:** [ ] SÍ [ ] NO

---

**Última actualización:** 2025-01-16
**Versión del checklist:** 1.0
