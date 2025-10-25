# Política de Seguridad de Contenido (CSP) - LoviPrintDTF

## 📋 Resumen

Este documento describe la política de Content Security Policy (CSP) implementada en LoviPrintDTF para proteger contra ataques XSS, inyección de código malicioso, clickjacking y otros vectores de ataque.

## 🛡️ Headers de Seguridad Implementados

### 1. Content-Security-Policy (CSP)

Política completa implementada en `next.config.js` y como fallback en nginx:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https: https://res.cloudinary.com https://images.unsplash.com https://www.googletagmanager.com https://www.google-analytics.com;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.stripe.com;
frame-src 'self' https://www.googletagmanager.com https://wa.me;
media-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
block-all-mixed-content
```

### 2. X-Frame-Options
```
X-Frame-Options: DENY
```
Previene que el sitio sea embebido en iframes (protección anti-clickjacking).

### 3. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Previene MIME type sniffing attacks.

### 4. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
Activa la protección XSS del navegador (legacy, pero incluido para compatibilidad).

### 5. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controla qué información de referrer se envía en las peticiones.

### 6. Permissions-Policy
```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
Deshabilita permisos no necesarios (cámara, micrófono, geolocalización).

### 7. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
Fuerza HTTPS durante 1 año, incluyendo subdominios.

## 🔍 Directivas CSP Explicadas

### default-src 'self'
**¿Qué hace?** Establece la política por defecto: solo permitir recursos del mismo origen.

**Protege contra:** Carga de recursos de dominios no autorizados.

### script-src 'self' 'unsafe-inline' 'unsafe-eval' [CDNs]
**¿Qué hace?** Controla qué scripts pueden ejecutarse.

**Permitido:**
- Scripts del propio dominio (`'self'`)
- Scripts inline (`'unsafe-inline'`) - necesario para Next.js y GTM
- eval() (`'unsafe-eval'`) - necesario para Next.js en desarrollo
- Google Tag Manager y Analytics

**⚠️ Mejora futura:** Reemplazar `'unsafe-inline'` y `'unsafe-eval'` con nonces o hashes para mayor seguridad.

**Protege contra:** Ejecución de scripts maliciosos inyectados.

### style-src 'self' 'unsafe-inline' [CDNs]
**¿Qué hace?** Controla qué hojas de estilo pueden cargarse.

**Permitido:**
- Estilos del propio dominio
- Estilos inline (Next.js usa CSS-in-JS)
- Google Fonts

**Protege contra:** Inyección de CSS malicioso.

### img-src 'self' data: blob: https: [CDNs]
**¿Qué hace?** Controla qué imágenes pueden cargarse.

**Permitido:**
- Imágenes del propio dominio
- Data URIs (`data:`)
- Blob URLs (`blob:`)
- Cualquier origen HTTPS (`https:`)
- Cloudinary (CDN de imágenes)
- Unsplash (imágenes de stock)
- GTM/Analytics

**Nota:** `https:` es amplio pero necesario para imágenes de productos subidas por usuarios.

**Protege contra:** Carga de imágenes maliciosas desde HTTP.

### font-src 'self' data: [CDNs]
**¿Qué hace?** Controla qué fuentes pueden cargarse.

**Permitido:**
- Fuentes del propio dominio
- Data URIs
- Google Fonts

**Protege contra:** Carga de fuentes maliciosas.

### connect-src 'self' [APIs]
**¿Qué hace?** Controla a qué APIs puede conectarse el cliente.

**Permitido:**
- APIs del propio dominio
- Google Analytics/GTM
- Stripe (pagos)

**Protege contra:** Envío de datos a servidores no autorizados.

### frame-src 'self' [servicios embebidos]
**¿Qué hace?** Controla qué iframes pueden cargarse.

**Permitido:**
- Propio dominio
- Google Tag Manager
- WhatsApp (wa.me)

**Protege contra:** Carga de iframes maliciosos.

### media-src 'self'
**¿Qué hace?** Controla qué elementos de audio/video pueden cargarse.

**Permitido:** Solo del propio dominio.

**Protege contra:** Carga de contenido multimedia malicioso.

### object-src 'none'
**¿Qué hace?** Bloquea completamente `<object>`, `<embed>`, y `<applet>`.

**Protege contra:** Ejecución de plugins (Flash, Java, etc.) que son vectores de ataque conocidos.

### base-uri 'self'
**¿Qué hace?** Controla qué URLs pueden usarse en `<base>` tag.

**Protege contra:** Base tag injection attacks.

### form-action 'self'
**¿Qué hace?** Controla a dónde pueden enviarse formularios.

**Permitido:** Solo al propio dominio.

**Protege contra:** Envío de datos de formularios a dominios maliciosos.

### frame-ancestors 'none'
**¿Qué hace?** Previene que el sitio sea embebido en iframes.

**Protege contra:** Clickjacking attacks.

**Nota:** Más moderno que X-Frame-Options y más flexible.

### upgrade-insecure-requests
**¿Qué hace?** Convierte automáticamente peticiones HTTP a HTTPS.

**Protege contra:** Mixed content warnings y ataques man-in-the-middle.

### block-all-mixed-content
**¿Qué hace?** Bloquea cualquier contenido HTTP en páginas HTTPS.

**Protege contra:** Downgrade attacks.

## 📁 Archivos de Configuración

### Next.js (next.config.js:3-78)
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [...] // Ver política completa arriba
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        // ... otros headers
      ]
    }
  ]
}
```

### Nginx (/etc/nginx/sites-available/loviprintdtf.es:53-62)
```nginx
# Security headers (fallback si Next.js no los aplica)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# Content Security Policy (mismo que Next.js como fallback)
add_header Content-Security-Policy "..." always;
```

**Defensa en Profundidad:** Los headers se aplican tanto en Next.js como en nginx para asegurar que siempre estén presentes.

## 🧪 Verificación de Headers

### Comando para verificar headers en producción:
```bash
curl -I https://www.loviprintdtf.es/ | grep -E "(content-security-policy|x-frame-options|referrer-policy|permissions-policy)" -i
```

### Verificación local:
```bash
curl -k -I https://localhost/ -H "Host: www.loviprintdtf.es" | grep -i "content-security-policy"
```

### Headers esperados en la respuesta:
```
✅ content-security-policy: default-src 'self'; script-src ...
✅ x-frame-options: DENY
✅ x-content-type-options: nosniff
✅ x-xss-protection: 1; mode=block
✅ referrer-policy: strict-origin-when-cross-origin
✅ permissions-policy: camera=(), microphone=(), geolocation=()
✅ strict-transport-security: max-age=31536000; includeSubDomains
```

## 🔧 Debugging CSP

### Ver violaciones CSP en la consola del navegador:
1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Buscar mensajes tipo: `Refused to load ... because it violates the following Content Security Policy directive: ...`

### Modo Report-Only (para testing):
Para probar cambios sin bloquear contenido, cambiar en next.config.js:
```javascript
{
  key: 'Content-Security-Policy-Report-Only',  // Cambiar aquí
  value: [...]
}
```

Esto solo reportará violaciones sin bloquear.

### CSP Evaluator (Google):
Usar https://csp-evaluator.withgoogle.com/ para analizar la política.

## ⚠️ Mejoras Futuras Recomendadas

### 1. Eliminar 'unsafe-inline' y 'unsafe-eval'
**Riesgo Actual:** Estas directivas reducen la efectividad del CSP.

**Solución:** Implementar nonces o hashes para scripts inline.

```javascript
// Ejemplo con nonce
<script nonce="random-value-generated-per-request">
  // código inline
</script>

// En CSP:
script-src 'self' 'nonce-random-value-generated-per-request'
```

### 2. Restringir img-src
**Riesgo Actual:** `https:` permite cualquier imagen HTTPS.

**Solución:** Especificar solo los dominios necesarios.

```
img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.googletagmanager.com
```

### 3. Implementar CSP Reporting
**Beneficio:** Recibir notificaciones de violaciones CSP.

**Implementación:**
```javascript
// Añadir a la política CSP
report-uri /api/csp-report;
report-to csp-endpoint;
```

```javascript
// Crear endpoint en src/app/api/csp-report/route.ts
export async function POST(req: Request) {
  const report = await req.json();
  console.error('CSP Violation:', report);
  // Enviar a sistema de logging/monitoring
  return new Response('OK', { status: 200 });
}
```

### 4. Subresource Integrity (SRI)
**Beneficio:** Verificar integridad de scripts de CDNs.

**Implementación:**
```html
<script
  src="https://www.googletagmanager.com/gtag/js"
  integrity="sha384-hash-del-archivo"
  crossorigin="anonymous"
></script>
```

## 📊 Nivel de Seguridad Actual

### ✅ Protecciones Implementadas:
- [x] CSP básico con directivas principales
- [x] Anti-clickjacking (frame-ancestors + X-Frame-Options)
- [x] MIME-type sniffing protection
- [x] HSTS con subdominios
- [x] Referrer Policy configurado
- [x] Permissions Policy restrictivo
- [x] Upgrade de HTTP a HTTPS
- [x] Bloqueo de mixed content
- [x] Bloqueo de plugins (object-src)

### ⚠️ Áreas de Mejora:
- [ ] Eliminar 'unsafe-inline' y 'unsafe-eval'
- [ ] Implementar nonces para scripts inline
- [ ] Restringir img-src (eliminar `https:` genérico)
- [ ] Implementar CSP reporting
- [ ] Añadir Subresource Integrity para CDNs
- [ ] Auditar periódicamente la política

## 🔐 Cumplimiento de Estándares

### OWASP Top 10 2021
- **A03:2021 - Injection:** ✅ Mitigado con CSP y form-action
- **A05:2021 - Security Misconfiguration:** ✅ Headers de seguridad configurados
- **A07:2021 - XSS:** ✅ Mitigado con CSP (parcialmente por 'unsafe-inline')

### Mozilla Observatory
**Score Esperado:** A- o B+

**Mejoras para A+:**
- Eliminar 'unsafe-inline' y 'unsafe-eval'
- Implementar CSP Reporting
- Añadir SRI para recursos externos

## 📚 Referencias

- [MDN - Content Security Policy](https://developer.mozilla.org/es/docs/Web/HTTP/CSP)
- [CSP Quick Reference](https://content-security-policy.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## 🔄 Mantenimiento

### Auditoría Mensual
```bash
# 1. Verificar headers en producción
curl -I https://www.loviprintdtf.es/ | grep -i "security\|policy"

# 2. Revisar consola del navegador en diferentes páginas
# Buscar violaciones CSP

# 3. Evaluar política en CSP Evaluator
# Copiar política actual y pegar en https://csp-evaluator.withgoogle.com/

# 4. Revisar logs de nginx
grep "CSP" /var/log/nginx/loviprintdtf_error.log
```

### Actualización de Política
Cuando se añadan nuevos servicios o CDNs:

1. Identificar el dominio del recurso
2. Añadir a la directiva correspondiente en `next.config.js`
3. Actualizar también en `/etc/nginx/sites-available/loviprintdtf.es`
4. Hacer rebuild: `npm run build`
5. Reiniciar servicios: `pm2 restart loviprintdtf && systemctl reload nginx`
6. Verificar en navegador que no hay violaciones CSP
7. Documentar el cambio en este archivo

---

**Última actualización:** 25 de octubre de 2025
**Responsable:** Sistema de seguridad LoviPrintDTF
**Próxima revisión:** 25 de noviembre de 2025
