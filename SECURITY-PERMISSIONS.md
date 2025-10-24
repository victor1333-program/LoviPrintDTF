# Guía de Permisos de Seguridad - LoviPrintDTF

## Resumen
Este documento describe los permisos correctos de archivos y directorios para mantener la seguridad del sistema en producción.

## Permisos de Archivos

### Archivos de Configuración Sensibles (600 - Solo propietario lectura/escritura)

```bash
chmod 600 /root/loviprintDTF/.env
chmod 600 /root/loviprintDTF/.env.local
chmod 600 /root/loviprintDTF/ecosystem.config.js
chmod 600 ~/.ssh/id_*
chmod 600 ~/.ssh/authorized_keys
```

**Razón**: Estos archivos contienen credenciales, secretos y claves privadas que NO deben ser accesibles por otros usuarios del sistema.

**Contenido sensible**:
- `.env` / `.env.local`: DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET, claves API
- `ecosystem.config.js`: Credenciales en variables de entorno
- Claves SSH: Autenticación sin contraseña

### Archivos de Log (640 - Propietario lectura/escritura, grupo solo lectura)

```bash
chmod 640 /var/log/loviprintdtf*.log
chmod 640 /var/log/nginx/loviprintdtf*.log
chmod 640 /root/loviprintDTF/server.log
```

**Razón**: Los logs pueden contener información sensible (IPs, emails, errores con datos internos). Solo el propietario debe poder escribir, el grupo puede leer para debugging.

### Archivos de Código Fuente (644 - Lectura general, escritura propietario)

```bash
chmod 644 /root/loviprintDTF/package.json
chmod 644 /root/loviprintDTF/tsconfig.json
chmod 644 /root/loviprintDTF/next.config.mjs
chmod 644 /root/loviprintDTF/src/**/*.ts
chmod 644 /root/loviprintDTF/src/**/*.tsx
```

**Razón**: El código fuente no es ejecutable y puede ser leído por el sistema, pero solo el propietario debe modificarlo.

### Scripts Ejecutables (744 - Propietario ejecución, otros solo lectura)

```bash
chmod 744 /root/*.sh
chmod 744 /root/loviprintDTF/scripts/*.sh
```

**Razón**: Scripts de mantenimiento deben ser ejecutables por el propietario, pero otros usuarios no deben poder ejecutarlos.

### Archivos Subidos por Usuarios (644 - Lectura general, escritura propietario)

```bash
# Establecer permisos por defecto para uploads
chmod 644 /root/loviprintDTF/public/uploads/designs/*
chmod 644 /root/loviprintDTF/public/uploads/images/*
```

**Razón**: Los archivos subidos deben ser servidos por el servidor web, pero no ejecutables.

## Permisos de Directorios

### Directorio Raíz del Proyecto (755 - Ejecución y lectura general)

```bash
chmod 755 /root/loviprintDTF
```

**Razón**: El directorio debe ser navegable por el proceso de Node.js y otros servicios.

### Directorio SSH (700 - Solo propietario)

```bash
chmod 700 ~/.ssh
```

**Razón**: Requerimiento estricto de SSH para seguridad de claves privadas.

### Directorios de Uploads (755 - Ejecución y lectura general)

```bash
chmod 755 /root/loviprintDTF/public
chmod 755 /root/loviprintDTF/public/uploads
chmod 755 /root/loviprintDTF/public/uploads/designs
chmod 755 /root/loviprintDTF/public/uploads/images
```

**Razón**: nginx necesita acceso de lectura y navegación para servir archivos estáticos.

### Directorios de Código Fuente (755 - Ejecución y lectura general)

```bash
chmod 755 /root/loviprintDTF/src
chmod 755 /root/loviprintDTF/prisma
chmod 755 /root/loviprintDTF/scripts
```

**Razón**: Node.js necesita acceso de lectura para cargar módulos.

## Protección a Nivel de nginx

Los siguientes archivos están bloqueados mediante reglas nginx en `/etc/nginx/sites-available/loviprintdtf.es`:

### Archivos Bloqueados (Return 404)

1. **Archivos de entorno**: `/.env*`
2. **Configuración del proyecto**: `/ecosystem.config.js`, `/package.json`, `/package-lock.json`, `/tsconfig.json`, `/next.config.mjs`, `/.gitignore`, `/.gitattributes`
3. **Control de versiones**: `/.git/*`
4. **Archivos ocultos**: `/.*` (excepto `/.well-known/` para Let's Encrypt)
5. **Dependencias**: `/node_modules/*`
6. **Logs y bases de datos**: `*.log`, `*.sql`, `*.sqlite`, `*.db`
7. **Backups**: `*.bak`, `*.backup`, `*.old`, `*.orig`, `*.save`, `*.swp`, `*.tmp`
8. **Código fuente**: `/src/*`, `/prisma/*`, `/scripts/*`, `/backups/*`
9. **Build interno**: `/.next/*` (excepto `/.next/static/` que es servido)

### Verificación de Reglas nginx

```bash
# Verificar que archivos sensibles retornan 404
curl -k -I -H "Host: www.loviprintdtf.es" https://localhost/.env
# Debe retornar: HTTP/2 404

curl -k -I -H "Host: www.loviprintdtf.es" https://localhost/package.json
# Debe retornar: HTTP/2 404

curl -k -I -H "Host: www.loviprintdtf.es" https://localhost/src/
# Debe retornar: HTTP/2 404

# Verificar que la página principal funciona
curl -k -I -H "Host: www.loviprintdtf.es" https://localhost/
# Debe retornar: HTTP/2 200
```

## Comandos de Auditoría

### Verificar Permisos de Archivos Sensibles

```bash
# Ver permisos de archivos críticos
ls -la /root/loviprintDTF/.env
ls -la /root/loviprintDTF/ecosystem.config.js
ls -la ~/.ssh/id_*
ls -la /var/log/loviprintdtf*.log

# Buscar archivos con permisos demasiado abiertos (777, 666)
find /root/loviprintDTF -type f -perm /o+w ! -path "*/node_modules/*" ! -path "*/.next/*"

# Buscar archivos .env accidentalmente expuestos
find /root/loviprintDTF -name ".env*" -type f -exec ls -la {} \;
```

### Corregir Permisos Automáticamente

```bash
# Script para corregir permisos
cd /root/loviprintDTF

# Archivos sensibles
chmod 600 .env* ecosystem.config.js 2>/dev/null

# Logs
chmod 640 server.log 2>/dev/null
sudo chmod 640 /var/log/loviprintdtf*.log 2>/dev/null

# SSH
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_* ~/.ssh/authorized_keys 2>/dev/null

# Directorios
chmod 755 public public/uploads public/uploads/designs public/uploads/images

# Archivos subidos (si existen)
find public/uploads -type f -exec chmod 644 {} \; 2>/dev/null
```

## Principios de Seguridad Aplicados

### 1. Principio de Mínimo Privilegio
Los archivos tienen el mínimo permiso necesario para funcionar:
- **600**: Solo propietario (credenciales, claves)
- **640**: Propietario y grupo (logs, auditoría)
- **644**: Lectura pública (código fuente, assets)
- **755**: Directorios navegables

### 2. Defensa en Profundidad
Múltiples capas de protección:
1. **Sistema de archivos**: Permisos Unix restrictivos
2. **nginx**: Reglas de bloqueo de archivos sensibles
3. **Aplicación**: Rate limiting y validación de inputs
4. **Código**: Sanitización de nombres de archivo

### 3. Separación de Preocupaciones
- **Archivos públicos** en `/public` (servidos por nginx)
- **Código fuente** en `/src` (nunca expuesto directamente)
- **Configuración** en raíz (bloqueada por nginx, permisos restrictivos)
- **Logs** en `/var/log` (fuera del árbol web)

## Alertas de Seguridad

### ⚠️ NUNCA hacer esto:
```bash
# ❌ NO dar permisos 777 a nada
chmod 777 /root/loviprintDTF  # INSEGURO

# ❌ NO dar permisos de escritura global
chmod 666 .env  # EXPONE CREDENCIALES

# ❌ NO hacer el proyecto propiedad de www-data
chown -R www-data:www-data /root/loviprintDTF  # PELIGROSO
```

### ✅ Buenas Prácticas:
```bash
# ✅ Usar permisos específicos
chmod 600 .env

# ✅ Verificar propietario correcto
chown root:root /root/loviprintDTF/.env

# ✅ Auditar regularmente
find /root/loviprintDTF -type f -perm -002  # Buscar archivos escribibles por todos
```

## Checklist de Seguridad de Permisos

- [✅] `.env` tiene permisos 600
- [✅] `ecosystem.config.js` tiene permisos 600
- [✅] Claves SSH tienen permisos 600
- [✅] Logs tienen permisos 640
- [✅] Directorio `/public/uploads` tiene permisos 755
- [✅] nginx bloquea acceso a archivos de configuración
- [✅] nginx bloquea acceso a directorio `.git`
- [✅] nginx bloquea acceso a `node_modules`
- [✅] nginx bloquea acceso a directorio `src/`
- [✅] nginx permite acceso a archivos estáticos de Next.js
- [✅] Rate limiting activo en endpoints públicos
- [✅] Sanitización de nombres de archivo implementada

## Mantenimiento Regular

### Auditoría Mensual
1. Ejecutar comandos de verificación de permisos
2. Revisar logs de nginx en busca de intentos de acceso a archivos bloqueados
3. Verificar que no hayan nuevos archivos `.env*` sin permisos correctos
4. Revisar permisos de nuevos archivos subidos

### Después de Deploys
1. Verificar permisos de `.env` (puede resetearse)
2. Verificar configuración de nginx
3. Ejecutar tests de seguridad (curl a archivos bloqueados)

---

**Última actualización**: 2025-10-24
**Estado**: ✅ SPRINT 2 - Punto 8 completado
**Próximo review**: 2025-11-24
