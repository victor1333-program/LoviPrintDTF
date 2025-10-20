# Guía de Despliegue - LoviPrint DTF

## Estado del Proyecto

✅ **Proyecto completamente operativo y configurado en VPS**

### URLs de Acceso
- **Aplicación Web:** http://157.173.97.116:3000
- **Base de Datos PostgreSQL:** 157.173.97.116:5433

## Configuración Actual

### Base de Datos PostgreSQL
- **Host:** 157.173.97.116 (accesible desde cualquier IP)
- **Puerto:** 5433
- **Base de datos:** dtf_print_services
- **Usuario:** dtf_user
- **Contraseña:** dtf2024
- **Estado:** Configurado para escuchar en todas las interfaces (0.0.0.0)

### Aplicación Next.js
- **Puerto:** 3000
- **Modo:** Producción
- **Servidor:** Node.js con servidor HTTP personalizado (server.js)
- **Estado:** Corriendo como servicio systemd con inicio automático

## Gestión del Servicio

Se ha creado un script de gestión para facilitar el manejo del servicio:

```bash
cd /root/loviprintDTF
./manage.sh [comando]
```

### Comandos Disponibles

```bash
./manage.sh start         # Iniciar el servicio
./manage.sh stop          # Detener el servicio
./manage.sh restart       # Reiniciar el servicio
./manage.sh status        # Ver estado del servicio
./manage.sh logs          # Ver logs en tiempo real
./manage.sh logs-error    # Ver solo errores en tiempo real
./manage.sh build         # Construir la aplicación
./manage.sh db-push       # Sincronizar base de datos
./manage.sh db-studio     # Abrir Prisma Studio
```

### Comandos Systemd Directos

También puedes usar los comandos systemd directamente:

```bash
systemctl start loviprint-dtf     # Iniciar
systemctl stop loviprint-dtf      # Detener
systemctl restart loviprint-dtf   # Reiniciar
systemctl status loviprint-dtf    # Ver estado
journalctl -u loviprint-dtf -f    # Ver logs en tiempo real
```

## Estructura de Archivos

```
/root/loviprintDTF/
├── .env                          # Variables de entorno (configurado)
├── .next/                        # Build de producción
├── node_modules/                 # Dependencias instaladas
├── prisma/                       # Esquemas de base de datos
├── src/                          # Código fuente
├── server.js                     # Servidor HTTP personalizado
├── manage.sh                     # Script de gestión
└── package.json                  # Dependencias y scripts
```

## Variables de Entorno (.env)

Las siguientes variables están configuradas:

```env
# Base de datos
DATABASE_URL="postgresql://dtf_user:dtf2024@localhost:5433/dtf_print_services?schema=public"

# Autenticación
AUTH_URL="http://157.173.97.116:3000"
AUTH_SECRET="dtf-print-secret-change-in-production-2024"
NEXTAUTH_URL="http://157.173.97.116:3000"
NEXTAUTH_SECRET="dtf-print-secret-change-in-production-2024"

# Email (opcional - configurar cuando sea necesario)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@dtfprint.com"

# Stripe (configurar con tus claves)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_TEST_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL=http://157.173.97.116:3000
```

## Tareas Pendientes de Configuración

### 1. Configuración de Email (Opcional)
Para habilitar las notificaciones por correo:
```bash
nano /root/loviprintDTF/.env
```
Actualiza las siguientes variables:
- `SMTP_USER`: Tu email de Gmail
- `SMTP_PASSWORD`: Contraseña de aplicación de Gmail

### 2. Configuración de Stripe (Opcional)
Si necesitas pagos en producción:
- Reemplaza `STRIPE_SECRET_KEY` con tu clave secreta de producción
- Configura el webhook secret en `STRIPE_WEBHOOK_SECRET`

### 3. Seguridad Recomendada

⚠️ **IMPORTANTE - Recomendaciones de Seguridad:**

1. **Cambiar secretos de autenticación:**
   ```bash
   nano /root/loviprintDTF/.env
   # Genera nuevos secretos con: openssl rand -base64 32
   ```

2. **Configurar firewall:**
   ```bash
   # Permitir solo puertos necesarios
   ufw allow 3000/tcp
   ufw allow 5433/tcp
   ufw enable
   ```

3. **Restringir acceso a PostgreSQL:**
   Por defecto está abierto a todas las IPs. Para mayor seguridad:
   ```bash
   nano /etc/postgresql/16/main/pg_hba.conf
   # Reemplazar 0.0.0.0/0 con IPs específicas
   systemctl restart postgresql
   ```

4. **Configurar HTTPS con Nginx:**
   Se recomienda usar un proxy reverso con SSL:
   ```bash
   apt install nginx certbot python3-certbot-nginx
   # Configurar dominio y obtener certificado SSL
   ```

## Monitoreo y Mantenimiento

### Ver logs del servicio
```bash
./manage.sh logs
```

### Ver logs de errores
```bash
./manage.sh logs-error
```

### Ver estado de la base de datos
```bash
systemctl status postgresql
```

### Backup de la base de datos
```bash
pg_dump -h localhost -p 5433 -U dtf_user dtf_print_services > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
psql -h localhost -p 5433 -U dtf_user dtf_print_services < backup_YYYYMMDD.sql
```

## Actualización del Proyecto

Cuando necesites actualizar el código:

```bash
cd /root/loviprintDTF

# 1. Detener el servicio
./manage.sh stop

# 2. Hacer backup de la base de datos
pg_dump -h localhost -p 5433 -U dtf_user dtf_print_services > backup_antes_actualizar.sql

# 3. Actualizar código desde Git
git pull origin main  # O el branch que uses

# 4. Instalar nuevas dependencias
npm install

# 5. Sincronizar base de datos si hay cambios
./manage.sh db-push

# 6. Reconstruir aplicación
./manage.sh build

# 7. Reiniciar servicio
./manage.sh start

# 8. Verificar que funciona
./manage.sh status
```

## Solución de Problemas

### El servicio no inicia
```bash
# Ver logs detallados
journalctl -u loviprint-dtf -n 50 --no-pager

# Verificar permisos
ls -la /root/loviprintDTF

# Reconstruir aplicación
./manage.sh build
./manage.sh restart
```

### No se puede conectar a la base de datos
```bash
# Verificar que PostgreSQL está corriendo
systemctl status postgresql

# Verificar que escucha en el puerto correcto
ss -tlnp | grep 5433

# Probar conexión
psql -h localhost -p 5433 -U dtf_user dtf_print_services
```

### La aplicación no responde
```bash
# Verificar que el puerto está abierto
ss -tlnp | grep 3000

# Reiniciar servicio
./manage.sh restart

# Ver logs en tiempo real
./manage.sh logs
```

## Información de Contacto y Soporte

Para más información consulta la documentación del proyecto:
- `README.md` - Información general
- `INSTALACION.md` - Guía de instalación
- `GUIA-RAPIDA.md` - Guía rápida de uso

## Estado Final

✅ PostgreSQL instalado y configurado
✅ Base de datos creada y migrada
✅ Aplicación construida exitosamente
✅ Servicio systemd configurado
✅ Inicio automático habilitado
✅ Accesible desde IP pública
✅ Script de gestión creado

**El proyecto está completamente operativo y listo para usar.**
