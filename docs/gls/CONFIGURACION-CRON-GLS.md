# ⏰ Configuración del Cron de Sincronización GLS

**Fecha:** 22 de Octubre, 2025
**Propósito:** Sincronizar automáticamente el estado de los envíos con GLS cada hora

---

## 🎯 ¿Qué hace el Cron?

El cron de sincronización ejecuta estas tareas automáticamente cada hora:

1. ✅ Consulta GLS para obtener el estado actualizado de todos los envíos activos
2. ✅ Actualiza el estado en la base de datos
3. ✅ Guarda nuevos eventos de tracking
4. ✅ Detecta envíos entregados
5. ✅ Envía emails automáticos a clientes cuando cambia el estado
6. ✅ Actualiza pedidos a "DELIVERED" cuando GLS confirma entrega

---

## 🔧 Configuración con PM2 (Recomendado)

### Opción 1: Usando PM2 Cron

Añade esto a tu `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'loviprintdtf',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'gls-sync-cron',
      script: 'node',
      args: '-e "setInterval(() => fetch(\'http://localhost:3000/api/cron/sync-shipments\', { headers: { \'Authorization\': \'Bearer \' + process.env.CRON_SECRET } }), 3600000)"',
      env: {
        CRON_SECRET: process.env.CRON_SECRET || 'your-secret-token',
      },
    },
  ],
}
```

Luego reinicia PM2:
```bash
pm2 restart ecosystem.config.js
pm2 save
```

### Opción 2: Usando crontab del sistema

1. **Abrir crontab:**
```bash
crontab -e
```

2. **Añadir esta línea** (ejecutar cada hora en el minuto 0):
```bash
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/sync-shipments >> /var/log/gls-sync.log 2>&1
```

3. **Guardar y salir**

4. **Ver logs:**
```bash
tail -f /var/log/gls-sync.log
```

---

## 🔐 Configurar CRON_SECRET

### 1. Generar un token seguro:
```bash
openssl rand -base64 32
```

### 2. Añadir a `.env`:
```bash
CRON_SECRET=tu_token_generado_aqui
```

### 3. Reiniciar aplicación:
```bash
pm2 restart loviprintdtf
```

---

## ✅ Probar el Cron Manualmente

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/cron/sync-shipments
```

**Respuesta esperada:**
```json
{
  "success": true,
  "totalShipments": 15,
  "updatedCount": 15,
  "deliveredCount": 3,
  "exceptionsCount": 0,
  "timestamp": "2025-10-22T20:00:00.000Z"
}
```

---

## 📊 Monitorear el Cron

### Ver logs en tiempo real:
```bash
# Si usas PM2
pm2 logs gls-sync-cron

# Si usas crontab
tail -f /var/log/gls-sync.log
```

### Ver estadísticas:
```bash
pm2 info gls-sync-cron
```

---

## 🚨 Solución de Problemas

### El cron no se ejecuta

**Verificar que el cron está activo:**
```bash
pm2 list
# o
crontab -l
```

**Verificar CRON_SECRET:**
```bash
echo $CRON_SECRET
```

### Error 401 No autorizado

**Verificar que el token es correcto:**
```bash
grep CRON_SECRET .env
```

**Probar el endpoint manualmente:**
```bash
curl -v -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d '=' -f2)" \
     http://localhost:3000/api/cron/sync-shipments
```

### No se actualizan los estados

**Verificar GLS configurado:**
```bash
# Acceder a https://loviprintdtf.es/admin/configuracion
# Sección "Envíos" → Verificar que GLS está habilitado
```

**Verificar logs de la aplicación:**
```bash
pm2 logs loviprintdtf --lines 100 | grep GLS
```

---

## 📈 Optimización

### Ajustar frecuencia del cron

**Cada 30 minutos:**
```bash
*/30 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" ...
```

**Cada 2 horas:**
```bash
0 */2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" ...
```

**Cada 15 minutos:**
```bash
*/15 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" ...
```

---

## ⚡ Configuración Avanzada: Webhook de GLS (Futuro)

En lugar de polling cada hora, GLS puede enviar notificaciones automáticas:

### 1. Crear endpoint de webhook:
`/api/webhooks/gls` (a implementar)

### 2. Registrar webhook en GLS:
Contactar con GLS para configurar:
```
URL: https://loviprintdtf.es/api/webhooks/gls
Eventos: statusChange, delivered, exception
```

### 3. Ventajas:
- ✅ Actualización en tiempo real (sin esperar 1 hora)
- ✅ Menos llamadas a API de GLS
- ✅ Menor carga en el servidor

---

## 📧 Emails Automáticos Enviados

El cron envía automáticamente estos emails:

| Estado | Email | Cuándo |
|--------|-------|--------|
| **CREATED** | "Tu pedido ha sido enviado" | Primera sincronización después de crear envío |
| **IN_TRANSIT** | "Tu pedido está en camino" | Cuando GLS informa que está en tránsito |
| **OUT_FOR_DELIVERY** | "Tu pedido llega hoy" | Cuando sale para entrega |
| **DELIVERED** | "Tu pedido ha sido entregado" | Cuando GLS confirma entrega |
| **EXCEPTION** | "Incidencia con tu pedido" | Si hay algún problema |

---

## 🎯 Checklist de Implementación

- [ ] Generar CRON_SECRET y añadir a .env
- [ ] Configurar cron en PM2 o crontab
- [ ] Probar endpoint manualmente
- [ ] Verificar que los logs se generan correctamente
- [ ] Esperar 1 hora y verificar que se ejecutó automáticamente
- [ ] Comprobar que los estados se actualizan en /admin/pedidos
- [ ] Verificar que llegan emails a clientes
- [ ] Monitorear durante 24 horas

---

**Última actualización:** 22 de Octubre, 2025
**Siguiente revisión:** Después de 7 días de funcionamiento
