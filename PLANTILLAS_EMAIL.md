# Sistema de Gestión de Plantillas de Email

Este sistema permite crear, editar y gestionar plantillas de correo electrónico personalizadas con un editor visual y sistema de variables.

## Características Principales

### 1. **Editor Visual de Emails**
- Editor HTML con resaltado de sintaxis
- Vista previa en tiempo real
- Panel lateral con variables disponibles
- Inserción de variables con un solo clic

### 2. **Sistema de Variables**
- Variables dinámicas por tipo de email
- Formato: `{{nombreVariable}}`
- Validación de variables requeridas
- Datos de ejemplo para previsualización

### 3. **Tipos de Email Soportados**
- **ORDER_CREATED**: Pedido creado
- **ORDER_STATUS_CHANGE**: Cambio de estado del pedido
- **ORDER_SHIPPED**: Pedido enviado
- **ORDER_DELIVERED**: Pedido entregado
- **VOUCHER_EXPIRING**: Bono próximo a caducar
- **VOUCHER_ACTIVATED**: Bono activado
- **USER_WELCOME**: Bienvenida de usuario
- **USER_PASSWORD_RESET**: Recuperar contraseña
- **ADMIN_NEW_ORDER**: Notificación admin - Nuevo pedido
- **CUSTOM**: Plantilla personalizada

## Acceso al Sistema

### Configuración SMTP

Antes de usar el sistema de emails, configura tu servidor SMTP:

1. Ve a `/admin/configuracion`
2. Selecciona la pestaña **"Email"**
3. Configura los parámetros SMTP (servidor, puerto, usuario, contraseña)
4. Prueba la conexión enviando un email de prueba
5. Desde aquí también puedes acceder a la gestión de plantillas

### Gestión de Plantillas

1. Ve a `/admin/notificaciones` (redirige automáticamente a plantillas)
2. O accede directamente a `/admin/notificaciones/plantillas`
3. Desde la configuración de Email también hay un botón **"Ir a Plantillas de Email"**

## Cómo Usar

### Crear una Nueva Plantilla

1. Haz clic en **"Nueva Plantilla"**
2. Completa la información básica:
   - **Nombre**: Nombre descriptivo de la plantilla
   - **Tipo de Email**: Selecciona el tipo de email
   - **Plantilla Activa**: Marca si quieres que esté activa
   - **Usar por Defecto**: Marca si será la plantilla predeterminada para este tipo

3. Edita el **Asunto**:
   - Puedes usar variables como `{{orderNumber}}`
   - Ejemplo: `Pedido confirmado - {{orderNumber}}`

4. Edita el **Contenido HTML**:
   - Usa el editor HTML para escribir tu plantilla
   - Haz clic en las variables del panel lateral para insertarlas
   - Usa estilos inline para mejor compatibilidad

5. Vista Previa:
   - Haz clic en **"Vista Previa"** para ver cómo se verá el email
   - Se usarán los datos de ejemplo para renderizar las variables

6. Enviar Prueba:
   - En la vista previa, introduce un email
   - Haz clic en **"Enviar"** para recibir un email de prueba

7. **Guardar Plantilla**

### Editar una Plantilla Existente

1. En la lista de plantillas, haz clic en el botón **"Editar"** (icono de lápiz)
2. Modifica los campos necesarios
3. Haz clic en **"Guardar Plantilla"**

### Otras Acciones

- **Activar/Desactivar**: Usa el botón de encendido/apagado
- **Duplicar**: Crea una copia de la plantilla para modificarla
- **Eliminar**: Elimina permanentemente la plantilla

## Variables Disponibles

### Pedido Creado (ORDER_CREATED)
```
{{customerName}}      - Nombre del cliente
{{orderNumber}}       - Número de pedido
{{totalPrice}}        - Precio total
{{subtotal}}          - Subtotal sin IVA
{{taxAmount}}         - IVA
{{shippingCost}}      - Coste de envío
{{discountAmount}}    - Descuento aplicado
{{items}}             - Lista de productos
{{customerEmail}}     - Email del cliente
{{customerPhone}}     - Teléfono del cliente
{{notes}}             - Notas del pedido
```

### Cambio de Estado (ORDER_STATUS_CHANGE)
```
{{customerName}}      - Nombre del cliente
{{orderNumber}}       - Número de pedido
{{status}}            - Estado del pedido (código)
{{statusLabel}}       - Estado del pedido (texto)
{{statusColor}}       - Color asociado al estado
{{statusEmoji}}       - Emoji del estado
```

### Pedido Enviado (ORDER_SHIPPED)
```
{{customerName}}      - Nombre del cliente
{{orderNumber}}       - Número de pedido
{{trackingNumber}}    - Número de seguimiento
{{trackingUrl}}       - URL de seguimiento
{{estimatedDelivery}} - Fecha estimada de entrega
{{carrier}}           - Empresa de transporte
```

### Pedido Entregado (ORDER_DELIVERED)
```
{{customerName}}      - Nombre del cliente
{{orderNumber}}       - Número de pedido
{{deliveredAt}}       - Fecha de entrega
```

### Bono Caducando (VOUCHER_EXPIRING)
```
{{customerName}}       - Nombre del cliente
{{voucherCode}}        - Código del bono
{{voucherName}}        - Nombre del bono
{{remainingMeters}}    - Metros restantes
{{remainingShipments}} - Envíos restantes
{{expiresAt}}          - Fecha de caducidad
{{daysRemaining}}      - Días restantes
```

## Consejos para el Editor

### HTML para Emails
1. **Usa estilos inline**: Los estilos en `<style>` pueden no funcionar en todos los clientes de email
2. **Evita JavaScript**: La mayoría de clientes de email bloquean JavaScript
3. **Usa tablas para layout**: Los divs con flexbox/grid no son compatibles con todos los clientes
4. **Imágenes**: Usa URLs absolutas para las imágenes
5. **Colores**: Usa códigos hexadecimales (#667eea) en lugar de nombres

### Ejemplo de Estructura HTML Básica
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Hola {{customerName}}</h1>
      <p>Tu pedido {{orderNumber}} ha sido confirmado.</p>
    </div>
  </body>
</html>
```

## API Endpoints

El sistema expone los siguientes endpoints para integración:

- `GET /api/email-templates` - Listar plantillas
- `GET /api/email-templates/:id` - Obtener una plantilla
- `POST /api/email-templates` - Crear plantilla
- `PUT /api/email-templates/:id` - Actualizar plantilla
- `DELETE /api/email-templates/:id` - Eliminar plantilla
- `POST /api/email-templates/preview` - Vista previa de plantilla
- `POST /api/email-templates/send-test` - Enviar email de prueba

## Funcionamiento Interno

### Prioridad de Plantillas

1. El sistema busca primero plantillas marcadas como **"Por Defecto"** y **"Activas"**
2. Si no encuentra, usa cualquier plantilla **"Activa"** del tipo solicitado
3. Si no hay plantillas en BD, usa el fallback hardcoded

### Renderizado de Variables

Cuando se envía un email, el sistema:
1. Obtiene la plantilla de la BD por tipo
2. Reemplaza las variables `{{variable}}` con los datos proporcionados
3. Envía el email usando el servicio SMTP configurado

## Migración de Plantillas Hardcoded

Se ha ejecutado automáticamente un script que migró las plantillas hardcoded existentes a la base de datos.

Para volver a ejecutarlo manualmente:
```bash
npx tsx scripts/migrate-email-templates.ts
```

## Troubleshooting

### Las plantillas no aparecen en el listado
- Verifica que la base de datos esté actualizada
- Ejecuta el script de migración si es necesario

### Los emails no se envían con la plantilla personalizada
- Verifica que la plantilla esté marcada como **"Activa"**
- Asegúrate de que el tipo de plantilla coincida con el tipo de email que estás enviando

### Las variables no se reemplazan
- Verifica que la sintaxis sea correcta: `{{variable}}` (con dobles llaves)
- Asegúrate de que el nombre de la variable coincida exactamente

### El email se ve mal en algunos clientes
- Usa estilos inline en lugar de clases CSS
- Evita CSS moderno (flexbox, grid, etc.)
- Prueba en diferentes clientes de email (Gmail, Outlook, etc.)

## Soporte

Para más información o problemas, consulta la documentación técnica en el código fuente o contacta con el equipo de desarrollo.
