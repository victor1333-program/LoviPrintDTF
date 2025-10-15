# Configuración del Cron Job para Actualización de Tracking GLS

Este documento explica cómo configurar el cron job para actualizar automáticamente el tracking de GLS a las 19:00 (cuando cierra la agencia de transporte).

## Endpoint del Cron Job

```
GET /api/cron/update-tracking
```

## Opciones de Configuración

### Opción 1: Cron Job del Sistema (Linux/macOS)

1. Genera una clave secreta para proteger el endpoint:

```bash
# Generar una clave secreta aleatoria
openssl rand -base64 32
```

2. Agrega la clave al archivo `.env`:

```env
CRON_SECRET=tu_clave_secreta_generada_aqui
```

3. Edita el crontab:

```bash
crontab -e
```

4. Agrega la siguiente línea para ejecutar a las 19:00 todos los días:

```cron
0 19 * * * curl -H "Authorization: Bearer tu_clave_secreta_generada_aqui" https://tu-dominio.com/api/cron/update-tracking
```

### Opción 2: Vercel Cron Jobs

Si estás usando Vercel, puedes configurar cron jobs en el archivo `vercel.json`:

1. Crea o edita `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-tracking",
      "schedule": "0 19 * * *"
    }
  ]
}
```

2. Asegúrate de tener la clave secreta en las variables de entorno de Vercel:

```bash
vercel env add CRON_SECRET
```

### Opción 3: GitHub Actions

Crea un archivo `.github/workflows/cron-tracking.yml`:

```yaml
name: Update GLS Tracking

on:
  schedule:
    # Ejecutar a las 19:00 UTC todos los días
    - cron: '0 19 * * *'
  workflow_dispatch: # Permite ejecutar manualmente

jobs:
  update-tracking:
    runs-on: ubuntu-latest
    steps:
      - name: Call tracking update endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.com/api/cron/update-tracking
```

### Opción 4: Servicios de Cron Externos

Puedes usar servicios como:

- **cron-job.org**: Servicio gratuito de cron jobs
- **EasyCron**: Servicio de cron jobs con plan gratuito
- **Google Cloud Scheduler**: Servicio de Google Cloud

Configuración:
- URL: `https://tu-dominio.com/api/cron/update-tracking`
- Método: GET
- Header: `Authorization: Bearer tu_clave_secreta`
- Horario: `0 19 * * *` (todos los días a las 19:00)

## Actualización Manual

Los administradores también pueden actualizar el tracking manualmente desde el panel de administración:

1. Ve a **Admin > Pedidos**
2. Haz clic en el botón **"Actualizar Tracking GLS"** en la parte superior derecha
3. El sistema actualizará todos los pedidos enviados y mostrará un resumen

## Funcionamiento

El cron job:

1. **Obtiene** todos los pedidos en estado `SHIPPED` o `READY` que tienen envío creado
2. **Consulta** el tracking de cada pedido en la API de GLS
3. **Actualiza** los eventos de tracking en la base de datos
4. **Detecta** si un pedido ha sido entregado según GLS
5. **Cambia automáticamente** el estado a `DELIVERED` si corresponde
6. **Envía un correo** al cliente confirmando la entrega

## Logs

Los logs del cron job se pueden ver en:

- **Development**: Terminal donde corre `npm run dev`
- **Production**: Logs de tu plataforma de hosting (Vercel, Railway, etc.)

Busca líneas que empiecen con `[CRON]` para ver la actividad del cron job.

## Variables de Entorno Requeridas

```env
# Clave secreta para proteger el endpoint del cron
CRON_SECRET=tu_clave_secreta_aqui

# Configuración de GLS (ya debería estar configurada)
# Ver documentación de GLS para más detalles
```

## Verificación

Para verificar que el cron job funciona correctamente:

1. Ejecuta manualmente el endpoint:

```bash
curl -H "Authorization: Bearer tu_clave_secreta" \
  https://tu-dominio.com/api/cron/update-tracking
```

2. Verifica la respuesta:

```json
{
  "success": true,
  "message": "Tracking actualizado para X pedidos",
  "delivered": Y,
  "results": [...]
}
```

3. Revisa que los pedidos se hayan actualizado correctamente en el panel de admin

## Notas Importantes

- El cron job solo actualiza pedidos que ya tienen un envío creado en GLS
- Los pedidos en estado `DELIVERED` no se vuelven a procesar
- Si GLS no responde o hay un error, el pedido se omite y se continúa con los demás
- Los correos de entrega se envían automáticamente cuando GLS confirma la entrega
- El horario de 19:00 está pensado para cuando cierra la agencia de transporte
