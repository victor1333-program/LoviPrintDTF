# Configuración de Dominio y SSL - LoviPrint DTF

## Estado Actual

✅ **Nginx instalado y configurado**
✅ **Certbot instalado**
✅ **Configuración de proxy reverso lista**
⏳ **Esperando propagación completa de DNS**

## URLs

- **Dominio:** loviprintdtf.es / www.loviprintdtf.es
- **IP del servidor:** 157.173.97.116
- **Aplicación corriendo en:** http://157.173.97.116:3000

## Problema Actual

Los registros DNS apuntan a la IP correcta, pero el tráfico HTTP todavía está siendo servido por Hostinger (servidor anterior). Esto es normal durante la propagación de DNS y puede tomar hasta 24-48 horas.

## Verificar Propagación de DNS

Puedes verificar el estado de propagación en:
- https://dnschecker.org/#A/loviprintdtf.es
- https://dnschecker.org/#A/www.loviprintdtf.es

**Debe mostrar:** 157.173.97.116 en todos los servidores DNS

También puedes verificar localmente:
```bash
dig +short loviprintdtf.es
dig +short www.loviprintdtf.es
```

**Resultado esperado:** 157.173.97.116

## Instalar Certificado SSL

Una vez que los DNS estén completamente propagados, ejecuta:

```bash
cd /root/loviprintDTF
./setup-ssl.sh
```

Este script:
1. ✅ Verificará que los DNS apunten correctamente
2. ✅ Obtendrá el certificado SSL de Let's Encrypt
3. ✅ Configurará HTTPS automáticamente
4. ✅ Configurará redirección de HTTP a HTTPS
5. ✅ Actualizará las variables de entorno (.env)
6. ✅ Reiniciará el servicio

## Configuración Manual (si prefieres)

Si prefieres hacerlo manualmente:

### 1. Obtener certificado SSL
```bash
certbot --nginx -d loviprintdtf.es -d www.loviprintdtf.es
```

### 2. Actualizar variables de entorno
```bash
nano /root/loviprintDTF/.env
```

Cambiar:
- `AUTH_URL="http://157.173.97.116:3000"` → `AUTH_URL="https://www.loviprintdtf.es"`
- `NEXTAUTH_URL="http://157.173.97.116:3000"` → `NEXTAUTH_URL="https://www.loviprintdtf.es"`
- `NEXT_PUBLIC_APP_URL=http://157.173.97.116:3000` → `NEXT_PUBLIC_APP_URL=https://www.loviprintdtf.es"`

### 3. Reiniciar servicio
```bash
./manage.sh restart
```

## Renovación Automática

Certbot instaló un timer de systemd que renovará automáticamente el certificado antes de que expire:

```bash
# Ver estado del timer
systemctl status certbot.timer

# Ver próxima renovación
certbot renew --dry-run
```

## Solución de Problemas

### DNS todavía no propaga
```bash
# Verificar DNS desde diferentes servidores
dig @8.8.8.8 loviprintdtf.es
dig @1.1.1.1 loviprintdtf.es
```

### Certbot falla
```bash
# Ver logs detallados
tail -50 /var/log/letsencrypt/letsencrypt.log

# Verificar que Nginx responde
curl -I http://loviprintdtf.es

# Debe mostrar "Server: nginx" y no "Server: LiteSpeed"
```

### Certificado necesita renovación manual
```bash
certbot renew --force-renewal
systemctl restart nginx
./manage.sh restart
```

## Configuración en Hostinger

**IMPORTANTE:** Si tienes el dominio en Hostinger, debes:

1. **Desactivar cualquier proxy/CDN** que Hostinger tenga activo
2. **Eliminar redirecciones** configuradas en Hostinger
3. **Verificar que los registros DNS** apunten directamente a tu VPS sin intermediarios

Para verificar esto, accede a tu panel de Hostinger y:
- Ve a la gestión de DNS del dominio
- Asegúrate de que NO haya registros CNAME que redirijan a servicios de Hostinger
- Los registros A deben apuntar directamente a: 157.173.97.116

## Una vez configurado HTTPS

Tu sitio estará accesible en:
- https://www.loviprintdtf.es (recomendado)
- https://loviprintdtf.es (redirige automáticamente a www)
- http://loviprintdtf.es (redirige automáticamente a HTTPS)

## Tiempo Estimado

- **Propagación DNS:** 5 minutos a 48 horas (típicamente 30 minutos)
- **Obtención de SSL:** 30 segundos
- **Configuración total:** 2-3 minutos

## Próximos Pasos

Una vez que el SSL esté configurado:
1. ✅ Verificar que https://www.loviprintdtf.es funciona correctamente
2. ✅ Probar el proceso de registro e inicio de sesión
3. ✅ Verificar que la subida de archivos funciona
4. ✅ Configurar los webhooks de Stripe (si los usas) con la nueva URL HTTPS
5. ✅ Actualizar cualquier integración externa con la nueva URL

## Soporte

Si encuentras problemas, revisa:
- `/var/log/nginx/loviprintdtf_error.log` - Errores de Nginx
- `/var/log/letsencrypt/letsencrypt.log` - Logs de Certbot
- `journalctl -u loviprint-dtf -f` - Logs de la aplicación
