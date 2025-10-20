# 📧 Plantillas de Email Creadas

Se han creado exitosamente **9 plantillas de email** profesionales y completas en la base de datos.

## ✅ Plantillas Creadas

### 1. **Confirmación de Pedido** (ORDER_CREATED)
- **Asunto:** Pedido confirmado #{{orderNumber}} - LoviPrintDTF
- **Incluye:**
  - Detalles completos del pedido
  - Lista de productos con cantidades y precios
  - Totales (Subtotal, IVA, Envío)
  - Información de contacto del cliente
  - Próximos pasos del proceso
  - Notas del pedido

### 2. **Actualización de Estado del Pedido** (ORDER_STATUS_CHANGE)
- **Asunto:** Tu pedido #{{orderNumber}} ha cambiado a: {{statusLabel}}
- **Incluye:**
  - Estado actual con emoji y color
  - Número de pedido
  - Explicación del estado
  - Botón para ver detalles

### 3. **Pedido Enviado** (ORDER_SHIPPED)
- **Asunto:** 📦 Tu pedido #{{orderNumber}} ha sido enviado
- **Incluye:**
  - Número de seguimiento
  - Empresa de transporte
  - Fecha estimada de entrega
  - Enlace para rastrear el pedido
  - Consejos útiles para la recepción

### 4. **Pedido Entregado** (ORDER_DELIVERED)
- **Asunto:** ✅ Tu pedido #{{orderNumber}} ha sido entregado
- **Incluye:**
  - Confirmación de entrega
  - Fecha y hora de entrega
  - Mensaje de agradecimiento
  - Instrucciones post-entrega
  - Botón para nuevo pedido

### 5. **Bono Próximo a Caducar** (VOUCHER_EXPIRING)
- **Asunto:** ⚠️ Tu bono {{voucherCode}} caduca en {{daysRemaining}} días
- **Incluye:**
  - Alerta de caducidad destacada
  - Días restantes
  - Metros y envíos disponibles
  - Código del bono
  - Llamada a la acción urgente

### 6. **Bono Activado** (VOUCHER_ACTIVATED)
- **Asunto:** 🎁 Tu bono {{voucherCode}} ha sido activado
- **Incluye:**
  - Código del bono destacado
  - Metros iniciales
  - Envíos incluidos
  - Fecha de caducidad
  - Instrucciones de uso
  - Ventajas del bono

### 7. **Bienvenida de Usuario** (USER_WELCOME)
- **Asunto:** 👋 ¡Bienvenido a LoviPrintDTF!
- **Incluye:**
  - Mensaje de bienvenida personalizado
  - Características principales del servicio
  - Primeros pasos
  - Datos de la cuenta
  - Botón de acceso

### 8. **Recuperación de Contraseña** (USER_PASSWORD_RESET)
- **Asunto:** 🔐 Solicitud de restablecimiento de contraseña
- **Incluye:**
  - Enlace seguro para resetear contraseña
  - Tiempo de expiración del enlace
  - Alertas de seguridad
  - Consejos de seguridad
  - Enlace alternativo (texto)

### 9. **Notificación Admin - Nuevo Pedido** (ADMIN_NEW_ORDER)
- **Asunto:** 🔔 Nuevo pedido recibido: #{{orderNumber}}
- **Incluye:**
  - Información completa del cliente
  - Lista detallada de productos
  - Archivos adjuntos
  - Notas del pedido
  - Botones de acción rápida
  - Enlace al panel admin

## 🎨 Características de las Plantillas

### Diseño Profesional
- ✅ Diseño responsive compatible con todos los clientes de email
- ✅ Degradados atractivos en headers
- ✅ Paleta de colores consistente (morado/azul)
- ✅ Tipografía clara y legible
- ✅ Uso de emojis para mejor comunicación visual

### Variables Dinámicas
- ✅ Todas usan el sistema de variables {{nombreVariable}}
- ✅ Variables específicas según el tipo de email
- ✅ Datos de ejemplo pre-configurados

### Compatibilidad
- ✅ Estilos inline para máxima compatibilidad
- ✅ Tablas para layout (compatible con Outlook)
- ✅ Sin JavaScript ni CSS moderno
- ✅ Imágenes opcionales (solo emojis unicode)

### Personalización
- ✅ Todas están activas por defecto
- ✅ Marcadas como plantillas predeterminadas
- ✅ Fácilmente editables desde el admin

## 🚀 Cómo Usar las Plantillas

### 1. Acceder al Panel de Plantillas
```
https://tu-dominio.com/admin/notificaciones/plantillas
```

### 2. Configurar SMTP
Antes de enviar emails, configura tu servidor SMTP en:
```
https://tu-dominio.com/admin/configuracion
```
- Ve a la pestaña "Email"
- Configura:
  - Servidor SMTP
  - Puerto (587 para TLS)
  - Usuario
  - Contraseña
  - Email del remitente
  - Nombre del remitente

### 3. Probar las Plantillas
Desde el panel de plantillas puedes:
- **Vista Previa:** Ver cómo se verá el email con datos de ejemplo
- **Enviar Prueba:** Enviar un email de prueba a tu correo
- **Editar:** Personalizar el contenido HTML
- **Duplicar:** Crear variantes de las plantillas

### 4. Sistema Automático
Una vez configuradas, las plantillas se utilizan automáticamente cuando:
- Se crea un pedido → ORDER_CREATED
- Cambia el estado → ORDER_STATUS_CHANGE
- Se envía un pedido → ORDER_SHIPPED
- Se entrega un pedido → ORDER_DELIVERED
- Un bono está por caducar → VOUCHER_EXPIRING
- Se activa un bono → VOUCHER_ACTIVATED
- Se registra un usuario → USER_WELCOME
- Se solicita reseteo → USER_PASSWORD_RESET
- Llega un pedido → ADMIN_NEW_ORDER (al admin)

## 📝 Variables Disponibles

### Pedidos
```
{{customerName}}      - Nombre del cliente
{{orderNumber}}       - Número de pedido
{{totalPrice}}        - Precio total
{{subtotal}}          - Subtotal
{{taxAmount}}         - IVA
{{shippingCost}}      - Coste de envío
{{items}}             - Lista de productos
{{customerEmail}}     - Email del cliente
{{customerPhone}}     - Teléfono del cliente
{{notes}}             - Notas del pedido
```

### Envíos
```
{{trackingNumber}}    - Número de seguimiento
{{trackingUrl}}       - URL de seguimiento
{{estimatedDelivery}} - Fecha estimada
{{carrier}}           - Empresa de transporte
{{deliveredAt}}       - Fecha de entrega
```

### Bonos
```
{{voucherCode}}        - Código del bono
{{voucherName}}        - Nombre del bono
{{initialMeters}}      - Metros iniciales
{{remainingMeters}}    - Metros restantes
{{initialShipments}}   - Envíos iniciales
{{remainingShipments}} - Envíos restantes
{{expiresAt}}          - Fecha de caducidad
{{daysRemaining}}      - Días restantes
```

### Usuarios
```
{{userName}}     - Nombre del usuario
{{userEmail}}    - Email del usuario
{{loginUrl}}     - URL de login
{{resetUrl}}     - URL para resetear contraseña
{{expiresIn}}    - Tiempo de expiración
```

### Estados
```
{{status}}        - Código del estado
{{statusLabel}}   - Texto del estado
{{statusColor}}   - Color del estado
{{statusEmoji}}   - Emoji del estado
```

## 🎯 Próximos Pasos

1. **Configurar SMTP**
   - Ve a `/admin/configuracion`
   - Configura tus credenciales SMTP
   - Prueba el envío de emails

2. **Personalizar Plantillas**
   - Añade tu logo (opcional)
   - Ajusta colores si lo deseas
   - Modifica textos según tu marca

3. **Probar el Sistema**
   - Crea un pedido de prueba
   - Verifica que lleguen los emails
   - Revisa la apariencia en diferentes clientes

4. **Monitorear**
   - Revisa el panel de notificaciones
   - Verifica que los emails se envíen correctamente
   - Ajusta según feedback de clientes

## 💡 Consejos

- **No modifiques las variables:** Mantén el formato {{variable}} exacto
- **Usa vista previa:** Siempre previsualiza antes de activar
- **Prueba en múltiples clientes:** Gmail, Outlook, Apple Mail, etc.
- **Mantén backups:** Duplica plantillas antes de hacer cambios grandes
- **Estilos inline:** Si añades estilos, usa siempre inline styles

## 🔧 Scripts Útiles

### Crear plantillas (ya ejecutado)
```bash
npx tsx scripts/create-email-templates.ts
```

### Verificar plantillas
```bash
npx tsx scripts/verify-email-templates.ts
```

## 📚 Documentación

Para más información sobre el sistema de plantillas, consulta:
- `/PLANTILLAS_EMAIL.md` - Documentación completa del sistema
- `/NOTIFICATIONS.md` - Sistema de notificaciones
- `/CONFIGURACION-SMTP.md` - Configuración de SMTP

---

✅ **Estado:** Todas las plantillas están activas y listas para usar
📅 **Fecha de creación:** 16 de octubre de 2025
🎨 **Total de plantillas:** 9
