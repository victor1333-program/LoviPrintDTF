# Sistema de Monitoreo y Alertas - LoviPrintDTF

## 📋 Descripción General

Sistema completo de monitoreo, logging y alertas para LoviPrintDTF. Proporciona visibilidad en tiempo real del estado de la aplicación, detecta problemas automáticamente y envía alertas cuando se requiere intervención.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Sistema de Monitoreo                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Logging    │  │ Health Check │  │   Metrics    │     │
│  │  Estructurado│  │   Endpoint   │  │   Endpoint   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
│         └─────────────────┴──────────────────┘             │
│                          │                                 │
│                          ▼                                 │
│              ┌────────────────────┐                        │
│              │  Sistema de        │                        │
│              │  Alertas           │                        │
│              └────────────────────┘                        │
│                          │                                 │
│                          ▼                                 │
│         ┌─────────────────────────────────┐               │
│         │  Email Notifications            │               │
│         │  • Críticas: Inmediatas         │               │
│         │  • Warnings: Agrupadas          │               │
│         │  • Info: Diarias                │               │
│         └─────────────────────────────────┘               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Script de Monitoreo Automatizado           │ │
│  │                                                        │ │
│  │  • Checks cada 5 minutos (cron)                      │ │
│  │  • Verifica: App, DB, Mem, CPU, Disk, SSL           │ │
│  │  • Auto-recuperación de servicios                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Componentes del Sistema

### 1. File Logger (src/lib/monitoring/file-logger.ts)

**Propósito:** Sistema de logging estructurado a archivos para auditoría y debugging.

**Características:**
- ✅ Logs estructurados en formato JSON
- ✅ Rotación automática de archivos (max 10MB por archivo)
- ✅ Retención de logs (máximo 5 archivos por tipo)
- ✅ Categorización por nivel: `info`, `warn`, `error`, `critical`, `security`
- ✅ Logs separados por fecha: `info-2025-10-25.log`, `error-2025-10-25.log`, etc.

**Ubicación de logs:** `/var/log/loviprintdtf/`

**Estructura de log:**
```json
{
  "timestamp": "2025-10-25T04:30:00.000Z",
  "level": "error",
  "category": "Database",
  "message": "Connection timeout",
  "error": {
    "message": "Connection refused",
    "stack": "...",
    "code": "ECONNREFUSED"
  },
  "context": {
    "host": "localhost",
    "port": 5433
  }
}
```

**Uso en código:**
```typescript
import { fileLogger } from '@/lib/monitoring/file-logger'

// Info
fileLogger.info('Auth', 'User logged in', { userId: '123', email: 'user@example.com' })

// Warning
fileLogger.warn('Payment', 'Payment processing slow', { orderId: '456', duration: 5000 })

// Error
fileLogger.error('Database', 'Query failed', error, { query: 'SELECT ...' })

// Critical (envía alerta)
fileLogger.critical('System', 'Out of memory', error)

// Security (envía alerta inmediata)
fileLogger.security('Auth', 'Multiple failed login attempts', {
  ip: '1.2.3.4',
  attempts: 5
})
```

### 2. Health Check Endpoint (src/app/api/health/route.ts)

**URL:** `https://www.loviprintdtf.es/api/health`

**Propósito:** Verificar el estado de la aplicación y sus servicios en tiempo real.

**Checks realizados:**
- ✅ **Database:** Conectividad y tiempo de respuesta
- ✅ **Filesystem:** Capacidad de lectura/escritura
- ✅ **Memory:** Uso de memoria del proceso Node.js

**Respuesta (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-25T04:30:00.000Z",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "ok",
      "details": { "responseTime": 15 }
    },
    "filesystem": {
      "status": "ok"
    },
    "memory": {
      "status": "ok",
      "details": {
        "heapUsed": "150 MB",
        "heapTotal": "200 MB",
        "percentage": "75%"
      }
    }
  },
  "version": "0.1.0"
}
```

**Respuesta (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-25T04:30:00.000Z",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "error",
      "message": "Connection refused"
    },
    "filesystem": { "status": "ok" },
    "memory": { "status": "ok" }
  },
  "version": "0.1.0"
}
```

**Estados:**
- `healthy`: Todos los servicios operando normalmente
- `degraded`: Algunos servicios con warnings (retorna 200)
- `unhealthy`: Uno o más servicios con error (retorna 503)

**Uso externo:**
```bash
# Check manual
curl https://www.loviprintdtf.es/api/health | jq

# Uptime monitoring (UptimeRobot, Pingdom, etc.)
# Configurar alerta si HTTP != 200
```

### 3. Metrics Endpoint (src/app/api/metrics/route.ts)

**URL:** `https://www.loviprintdtf.es/api/metrics`

**Propósito:** Métricas detalladas del sistema para análisis y dashboards.

**⚠️ IMPORTANTE:** Este endpoint debe protegerse con token en producción.

**Autenticación (opcional):**
```bash
# Configurar en .env
METRICS_TOKEN=tu-token-secreto-aqui

# Request
curl -H "Authorization: Bearer tu-token-secreto-aqui" \
  https://www.loviprintdtf.es/api/metrics
```

**Métricas recopiladas:**

#### System Metrics
```json
{
  "system": {
    "hostname": "vmi2857526",
    "platform": "linux",
    "arch": "x64",
    "uptime": 2592000,
    "nodeVersion": "v18.19.1"
  }
}
```

#### CPU Metrics
```json
{
  "cpu": {
    "model": "Intel Xeon",
    "cores": 4,
    "loadAverage": [1.5, 1.3, 1.1],
    "usage": 45.67
  }
}
```

#### Memory Metrics
```json
{
  "memory": {
    "total": 8,        // GB
    "free": 3,         // GB
    "used": 5,         // GB
    "usedPercent": 62,
    "process": {
      "heapUsed": 180,    // MB
      "heapTotal": 250,   // MB
      "rss": 300,         // MB
      "external": 10      // MB
    }
  }
}
```

#### Disk Metrics
```json
{
  "disk": {
    "total": 50,       // GB
    "used": 30,        // GB
    "free": 20,        // GB
    "usedPercent": 60
  }
}
```

#### Database Metrics
```json
{
  "database": {
    "connected": true,
    "responseTime": 12,
    "stats": {
      "users": 150,
      "orders": 450,
      "products": 25
    }
  }
}
```

**Uso con herramientas de monitoreo:**

```bash
# Prometheus/Grafana
# Configurar scraper para parsear JSON

# Datadog
# Usar Datadog Agent con custom check

# New Relic
# Integración custom metrics
```

### 4. Sistema de Alertas (src/lib/monitoring/alerts.ts)

**Propósito:** Enviar notificaciones por email cuando ocurren eventos críticos.

**Configuración (.env):**
```bash
# Habilitar sistema de alertas
ALERTS_ENABLED=true

# Destinatarios (separados por coma)
ALERT_EMAIL_TO=admin@loviprintdtf.es,dev@loviprintdtf.es

# Configuración SMTP (usar misma que nodemailer)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=alerts@loviprintdtf.es
SMTP_PASS=tu-password-aqui
SMTP_FROM=alerts@loviprintdtf.es
```

**Características:**
- ✅ Cooldown de 30 minutos (no enviar la misma alerta más de 1 vez cada 30 min)
- ✅ Emails formateados en HTML con colores por nivel
- ✅ Deduplicación automática
- ✅ Logs de todas las alertas (enviadas o no)

**Niveles de alerta:**
- `info` 🔵 - Informativo
- `warning` ⚠️ - Requiere atención
- `critical` 🚨 - Requiere acción inmediata

**Uso en código:**
```typescript
import { alertSystem } from '@/lib/monitoring/alerts'

// Alert genérica
await alertSystem.sendAlert({
  level: 'critical',
  title: 'Service Down',
  message: 'El servicio X ha dejado de responder',
  details: { service: 'payment-gateway', since: '10 minutes' },
  timestamp: new Date().toISOString(),
})

// Helpers predefinidos
await alertSystem.highMemoryUsage(95, { heapUsed: '1.8GB' })
await alertSystem.highDiskUsage(92, { path: '/', used: '46GB' })
await alertSystem.databaseConnectionError(error)
await alertSystem.paymentSystemError(error, orderId)
await alertSystem.securityEvent('5 failed login attempts', { ip, user })
```

**Formato de email:**
```
┌─────────────────────────────────────┐
│ 🚨 Error de Conexión a Base de     │
│    Datos                            │
│ 2025-10-25T04:30:00.000Z           │
└─────────────────────────────────────┘

No se puede conectar a la base de datos.
La aplicación puede no funcionar
correctamente.

Detalles:
{
  "error": "Connection refused",
  "stack": "..."
}

Sistema de Alertas - LoviPrintDTF
Revisa: https://www.loviprintdtf.es/api/health
```

### 5. Script de Monitoreo Automatizado (/home/loviadmin/scripts/monitor-system.sh)

**Propósito:** Ejecutar checks periódicos y auto-recuperar servicios.

**Ejecución:** Cada 5 minutos via cron

**Checks realizados:**

| Check | Descripción | Acción en Fallo |
|-------|-------------|-----------------|
| **Application** | Health endpoint | Enviar alerta |
| **PM2** | Proceso online | Reiniciar + Alerta |
| **Nginx** | Servicio activo | Iniciar + Alerta |
| **Database** | Conexión PostgreSQL | Alerta crítica |
| **Memory** | Uso < 90% | Alerta si > 80% |
| **Disk** | Uso < 90% | Alerta si > 80% |
| **CPU** | Carga < 95% | Alerta si > 80% |
| **SSL** | Expira > 7 días | Alerta si < 30 días |

**Umbrales configurables:**
```bash
MEM_WARNING=80      # %
MEM_CRITICAL=90     # %
DISK_WARNING=80     # %
DISK_CRITICAL=90    # %
CPU_WARNING=80      # %
CPU_CRITICAL=95     # %
```

**Logs:** `/var/log/loviprintdtf/monitor.log`

**Ejecución manual:**
```bash
# Con output verbose
/home/loviadmin/scripts/monitor-system.sh --verbose

# Silencioso (solo logs)
/home/loviadmin/scripts/monitor-system.sh
```

**Exit codes:**
- `0` - Todos los checks OK
- `1` - Algunos warnings
- `2` - Algunos errores críticos

### 6. Script de Backup Automático (/home/loviadmin/scripts/backup-database.sh)

**Propósito:** Backup diario de la base de datos PostgreSQL.

**Ejecución:** Diariamente a las 3:00 AM via cron

**Características:**
- ✅ Dump completo de la base de datos
- ✅ Compresión gzip automática
- ✅ Verificación de integridad
- ✅ Retención de 30 días
- ✅ Limpieza automática de backups antiguos

**Ubicación:** `/home/loviadmin/projects/loviprintdtf/backups/`

**Formato:** `backup_YYYYMMDD_HHMMSS.sql.gz`

**Logs:** `/var/log/loviprintdtf/backup.log`

**Restaurar backup:**
```bash
# Listar backups disponibles
ls -lh /home/loviadmin/projects/loviprintdtf/backups/

# Restaurar (PELIGRO: sobrescribe datos actuales)
gunzip -c /home/loviadmin/projects/loviprintdtf/backups/backup_20251025_030000.sql.gz | \
  PGPASSWORD=fe06b83ec2c4a7e62c05e514d53277d9 \
  psql -h localhost -p 5433 -U dtf_user -d dtf_print_services
```

## ⏰ Tareas Programadas (Cron)

```bash
# Ver cron actual
crontab -l

# Editar cron
crontab -e
```

**Configuración actual:**

| Frecuencia | Comando | Descripción |
|-----------|---------|-------------|
| */5 * * * * | /home/loviadmin/scripts/monitor-system.sh | Monitoreo sistema cada 5 min |
| */10 * * * * | /home/loviadmin/scripts/monitor-loviprintdtf.sh | Monitor legacy cada 10 min |
| 0 2 * * * | find ... -mtime +30 -delete | Limpieza logs > 30 días |
| 0 3 * * * | /home/loviadmin/scripts/backup-database.sh | Backup diario DB |
| 0 4 * * 0 | find /tmp ... -delete | Limpieza archivos temp semanalmente |
| 0 5 * * 0 | pm2 restart loviprintdtf | Reinicio semanal PM2 |

## 📊 Dashboards y Visualización

### Opción 1: Grafana (Recomendado)

**Instalación:**
```bash
# Instalar Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Iniciar
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Acceder: http://servidor:3000
# Usuario: admin / Contraseña: admin
```

**Configurar datasource:**
1. Add datasource → JSON API
2. URL: `https://www.loviprintdtf.es/api/metrics`
3. Headers: `Authorization: Bearer tu-token`

**Métricas a visualizar:**
- CPU Usage (gauge + graph)
- Memory Usage (gauge + graph)
- Disk Usage (gauge)
- Database Response Time (graph)
- Application Uptime (counter)

### Opción 2: Uptime Monitoring Services

**UptimeRobot (Gratis):**
- URL Monitor: `https://www.loviprintdtf.es/api/health`
- Intervalo: 5 minutos
- Alert cuando HTTP != 200

**Pingdom:**
- Similar a UptimeRobot
- Más opciones de alertas

**Better Uptime:**
- Monitoring + Status page pública

## 🔍 Análisis de Logs

### Ver logs en tiempo real

```bash
# Logs de aplicación (PM2)
pm2 logs loviprintdtf

# Logs de monitoreo
tail -f /var/log/loviprintdtf/monitor.log

# Logs de errores
tail -f /var/log/loviprintdtf/error-$(date +%Y-%m-%d).log

# Logs de seguridad
tail -f /var/log/loviprintdtf/security-$(date +%Y-%m-%d).log
```

### Buscar en logs

```bash
# Buscar errores de hoy
cat /var/log/loviprintdtf/error-$(date +%Y-%m-%d).log | jq

# Filtrar por categoría
cat /var/log/loviprintdtf/error-*.log | jq 'select(.category == "Database")'

# Contar errores por categoría (últimos 7 días)
find /var/log/loviprintdtf -name "error-*.log" -mtime -7 -exec cat {} \; | \
  jq -r '.category' | sort | uniq -c | sort -rn

# Errores de las últimas 24h
find /var/log/loviprintdtf -name "error-*.log" -mtime -1 -exec cat {} \; | jq

# Alertas de seguridad
cat /var/log/loviprintdtf/security-$(date +%Y-%m-%d).log | jq
```

### Análisis con jq

```bash
# Top 10 errores más frecuentes
cat /var/log/loviprintdtf/error-*.log | \
  jq -r '.message' | \
  sort | uniq -c | sort -rn | head -10

# Errores por hora
cat /var/log/loviprintdtf/error-$(date +%Y-%m-%d).log | \
  jq -r '.timestamp' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c

# IPs con más errores de seguridad
cat /var/log/loviprintdtf/security-*.log | \
  jq -r '.context.ip // "unknown"' | \
  sort | uniq -c | sort -rn | head -20
```

## 🚨 Playbook de Respuesta a Alertas

### Alerta: High Memory Usage

**Causa común:** Memory leak, caché no limpiado, demasiados requests concurrentes

**Acciones:**
```bash
# 1. Ver uso actual
free -h
pm2 info loviprintdtf

# 2. Ver procesos que más consumen
top -o %MEM

# 3. Reiniciar aplicación si es necesario
pm2 restart loviprintdtf

# 4. Investigar memory leak
pm2 logs loviprintdtf --lines 200 | grep -i "memory"

# 5. Si persiste, aumentar memoria Node.js en ecosystem.config.js
node_args: "--max-old-space-size=4096"
```

### Alerta: High Disk Usage

**Causa común:** Logs no rotados, backups acumulados, archivos temporales

**Acciones:**
```bash
# 1. Ver qué ocupa espacio
du -sh /* | sort -rh | head -10
du -sh /var/log/* | sort -rh | head -10

# 2. Limpiar logs antiguos
find /var/log/loviprintdtf -name "*.log" -mtime +30 -delete

# 3. Limpiar backups antiguos
find /home/loviadmin/projects/loviprintdtf/backups -name "*.sql.gz" -mtime +30 -delete

# 4. Limpiar archivos temporales
find /tmp -type f -mtime +7 -delete

# 5. Limpiar journal
journalctl --vacuum-time=7d
```

### Alerta: Database Connection Failed

**Causa común:** PostgreSQL down, configuración incorrecta, firewall

**Acciones:**
```bash
# 1. Ver estado PostgreSQL
systemctl status postgresql

# 2. Ver logs de PostgreSQL
tail -100 /var/log/postgresql/postgresql-*-main.log

# 3. Intentar conexión manual
PGPASSWORD=fe06b83ec2c4a7e62c05e514d53277d9 \
  psql -h localhost -p 5433 -U dtf_user -d dtf_print_services

# 4. Ver conexiones activas
PGPASSWORD=fe06b83ec2c4a7e62c05e514d53277d9 \
  psql -h localhost -p 5433 -U dtf_user -d dtf_print_services \
  -c "SELECT count(*) FROM pg_stat_activity;"

# 5. Reiniciar PostgreSQL si es necesario
sudo systemctl restart postgresql

# 6. Verificar aplicación
curl https://www.loviprintdtf.es/api/health | jq
```

### Alerta: Application Unhealthy

**Causa común:** Excepción no manejada, timeout, dependencia down

**Acciones:**
```bash
# 1. Ver logs recientes
pm2 logs loviprintdtf --lines 100

# 2. Ver estado PM2
pm2 status

# 3. Ver health endpoint
curl -k https://localhost/api/health -H "Host: www.loviprintdtf.es" | jq

# 4. Ver errores recientes
cat /var/log/loviprintdtf/error-$(date +%Y-%m-%d).log | jq | tail -20

# 5. Reiniciar aplicación
pm2 restart loviprintdtf

# 6. Ver si se recupera
sleep 10
curl https://www.loviprintdtf.es/api/health | jq
```

### Alerta: SSL Certificate Expiring

**Causa común:** Renovación automática falló

**Acciones:**
```bash
# 1. Ver expiración actual
openssl x509 -enddate -noout -in /etc/letsencrypt/live/loviprintdtf.es/cert.pem

# 2. Renovar manualmente
sudo certbot renew --force-renewal

# 3. Verificar
openssl x509 -enddate -noout -in /etc/letsencrypt/live/loviprintdtf.es/cert.pem

# 4. Reload nginx
sudo systemctl reload nginx

# 5. Probar HTTPS
curl -I https://www.loviprintdtf.es
```

## 📈 Métricas Clave (KPIs)

### Availability
- **Target:** 99.9% uptime
- **Medición:** Health checks cada 5 min
- **Alerta:** Si down > 5 minutos

### Performance
- **Target:** Response time < 500ms (p95)
- **Medición:** Database response time en metrics
- **Alerta:** Si p95 > 1000ms

### Error Rate
- **Target:** < 1% de requests
- **Medición:** Contar errores en logs
- **Alerta:** Si > 5% en 1 hora

### Database
- **Target:** Response time < 50ms
- **Medición:** Health check
- **Alerta:** Si > 200ms o connection failed

## 🔐 Seguridad del Sistema de Monitoreo

### Proteger endpoints

**Opción 1: IP Whitelist (nginx)**
```nginx
location /api/metrics {
    allow 1.2.3.4;  # Tu IP
    deny all;
    proxy_pass http://localhost:3000;
}
```

**Opción 2: Token Bearer**
```typescript
// Ya implementado en src/app/api/metrics/route.ts
// Configurar en .env
METRICS_TOKEN=token-secreto-muy-largo-y-aleatorio
```

**Opción 3: VPN**
- Acceder a métricas solo via VPN
- Más seguro para equipos distribuidos

### Proteger logs

```bash
# Permisos restrictivos
chmod 640 /var/log/loviprintdtf/*.log
chown root:adm /var/log/loviprintdtf/*.log

# Rotar con logrotate
cat > /etc/logrotate.d/loviprintdtf << 'EOF'
/var/log/loviprintdtf/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root adm
}
EOF
```

## 🛠️ Troubleshooting

### Los logs no se escriben

```bash
# Verificar permisos
ls -la /var/log/loviprintdtf/

# Crear directorio si no existe
mkdir -p /var/log/loviprintdtf
chmod 755 /var/log/loviprintdtf

# Ver errores de aplicación
pm2 logs loviprintdtf --err
```

### Las alertas no se envían

```bash
# Verificar configuración SMTP en .env
cat /home/loviadmin/projects/loviprintdtf/.env | grep SMTP

# Test de conexión SMTP
curl telnet://smtp.hostinger.com:587

# Ver logs de alertas
cat /var/log/loviprintdtf/info-$(date +%Y-%m-%d).log | jq 'select(.category == "Alerts")'

# Test manual
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  auth: { user: 'alerts@loviprintdtf.es', pass: 'PASSWORD' }
});
transport.sendMail({
  from: 'alerts@loviprintdtf.es',
  to: 'admin@loviprintdtf.es',
  subject: 'Test',
  text: 'Test alert'
}).then(console.log).catch(console.error);
"
```

### El cron no se ejecuta

```bash
# Verificar cron está activo
systemctl status cron

# Ver logs de cron
grep CRON /var/log/syslog | tail -20

# Ver crontab actual
crontab -l

# Ejecutar manualmente para debug
/home/loviadmin/scripts/monitor-system.sh --verbose
```

## 📚 Referencias

- **Documentación Prisma:** https://www.prisma.io/docs
- **PM2 Monitoring:** https://pm2.keymetrics.io/docs/usage/monitoring/
- **Grafana:** https://grafana.com/docs/
- **Node.js Logging Best Practices:** https://blog.logrocket.com/node-js-logging-best-practices/

## 🔄 Mantenimiento

### Checklist Semanal
- [ ] Revisar dashboards de métricas
- [ ] Verificar que backups se están creando
- [ ] Revisar logs de errores
- [ ] Verificar espacio en disco

### Checklist Mensual
- [ ] Revisar y actualizar umbrales de alertas
- [ ] Limpiar logs antiguos (automático)
- [ ] Revisar logs de seguridad
- [ ] Test de restauración de backup
- [ ] Actualizar documentación si cambia algo

---

**Última actualización:** 25 de octubre de 2025
**Responsable:** Sistema de monitoreo LoviPrintDTF
**Próxima revisión:** 25 de noviembre de 2025
