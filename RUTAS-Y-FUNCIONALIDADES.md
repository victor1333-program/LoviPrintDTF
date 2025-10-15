# 🌐 Rutas y Funcionalidades - DTF Print Services

## 📱 URLs Públicas (Clientes)

### 1. Página Principal
**URL:** `http://147.93.53.104:3001/`
- Calculadora de precios en tiempo real
- Información sobre el servicio DTF
- Botones para iniciar pedido y acceder al carrito

### 2. Página de Checkout
**URL:** `http://147.93.53.104:3001/checkout`
- Formulario de datos del cliente
- Dirección de envío
- Subida de archivo de diseño
- Resumen del pedido con precios
- Botón para finalizar pedido

### 3. Página de Confirmación de Pedido
**URL:** `http://147.93.53.104:3001/pedido/[NUMERO_PEDIDO]`
- Detalles del pedido confirmado
- Número de pedido y estado
- Información de seguimiento

### 4. Página de Inicio de Sesión
**URL:** `http://147.93.53.104:3001/auth/signin`
- Formulario de login para administradores
- Acceso al panel de administración

---

## 🔐 Panel de Administración

### Credenciales de Acceso
```
Email: admin@dtf.com
Contraseña: admin123
```

### 5. Dashboard del Admin
**URL:** `http://147.93.53.104:3001/admin`
**Requiere:** Autenticación
**Funcionalidades:**
- Estadísticas generales:
  - Pedidos del mes
  - Ingresos del mes
  - Pedidos pendientes
  - Total de pedidos
- Lista de pedidos recientes
- Tarjetas con métricas visuales

### 6. Gestión de Pedidos
**URL:** `http://147.93.53.104:3001/admin/pedidos`
**Requiere:** Autenticación
**Funcionalidades:**
- Ver todos los pedidos
- Filtrar por estado (Pendiente, Confirmado, En Producción, etc.)
- Buscar por número, cliente o email
- Descargar archivos de diseño
- Ver detalles de cada pedido

### 7. Detalle de Pedido Individual
**URL:** `http://147.93.53.104:3001/admin/pedidos/[NUMERO_PEDIDO]`
**Requiere:** Autenticación
**Funcionalidades:**
- Ver todos los datos del pedido
- Cambiar estado del pedido
- Añadir número de seguimiento
- Ver archivo de diseño subido
- Notas del cliente y del admin

### 8. Gestión de Usuarios
**URL:** `http://147.93.53.104:3001/admin/usuarios`
**Requiere:** Autenticación
**Funcionalidades:**
- Ver lista de todos los usuarios
- Ver roles (Admin/Cliente)
- Gestionar permisos

---

## 🔌 API Endpoints

### 1. Crear Pedido
**Endpoint:** `POST /api/orders`
**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "phone": "+34 600 000 000",
  "address": "Calle Principal 123",
  "city": "Madrid",
  "postalCode": "28001",
  "metersOrdered": 5,
  "pricePerMeter": 15,
  "subtotal": 75,
  "taxAmount": 15.75,
  "shippingCost": 5,
  "totalPrice": 95.75,
  "designFileUrl": "/uploads/design.pdf",
  "designFileName": "design.pdf",
  "notes": "Instrucciones especiales"
}
```

### 2. Obtener Pedidos
**Endpoint:** `GET /api/orders`
**Respuesta:** Array de pedidos

### 3. Obtener Pedido Individual
**Endpoint:** `GET /api/orders/[ID]`
**Respuesta:** Detalles del pedido

### 4. Actualizar Pedido
**Endpoint:** `PATCH /api/orders/[ID]`
**Body:**
```json
{
  "status": "IN_PRODUCTION",
  "trackingNumber": "ABC123456789"
}
```

### 5. Subir Archivo de Diseño
**Endpoint:** `POST /api/upload`
**Content-Type:** `multipart/form-data`
**Field:** `file`
**Respuesta:**
```json
{
  "fileUrl": "/uploads/filename.pdf",
  "fileName": "filename.pdf"
}
```

### 6. Autenticación
**Endpoint:** `POST /api/auth/[...nextauth]`
**Provider:** NextAuth con credenciales

---

## 🎨 Estados de Pedido

### Estados Disponibles:
1. **PENDING** - Pendiente (amarillo)
2. **CONFIRMED** - Confirmado (azul)
3. **IN_PRODUCTION** - En Producción (morado)
4. **READY** - Listo (índigo)
5. **SHIPPED** - Enviado (naranja)
6. **DELIVERED** - Entregado (verde)
7. **CANCELLED** - Cancelado (rojo)

### Estados de Pago:
1. **PENDING** - Pendiente (amarillo)
2. **PAID** - Pagado (verde)
3. **FAILED** - Fallido (rojo)
4. **REFUNDED** - Reembolsado (gris)

---

## 💰 Configuración de Precios

### Precio por Metro
- **Precio base:** 15,00 €/metro
- **IVA:** 21%
- **Envío:** 5,00 €

### Cálculo Automático:
```
Subtotal = Metros × Precio por Metro
IVA = Subtotal × 0.21
Total = Subtotal + IVA + Envío
```

---

## 📋 Flujo de Usuario (Cliente)

1. **Inicio** → Cliente visita la página principal
2. **Calculadora** → Selecciona cantidad de metros
3. **Checkout** → Hace clic en "Continuar y Subir Diseño"
4. **Formulario** → Completa datos personales y de envío
5. **Diseño** → Sube archivo de diseño (PDF, AI, PNG, etc.)
6. **Confirmar** → Hace clic en "Realizar Pedido"
7. **Confirmación** → Recibe número de pedido y confirmación

---

## 🔧 Flujo de Administrador

1. **Login** → Accede con credenciales en `/auth/signin`
2. **Dashboard** → Ve resumen de estadísticas
3. **Pedidos** → Gestiona pedidos pendientes
4. **Detalle** → Cambia estado y añade tracking
5. **Archivo** → Descarga diseño del cliente
6. **Seguimiento** → Actualiza estado hasta entrega

---

## 📁 Archivos de Diseño

### Formatos Aceptados:
- PDF
- AI (Adobe Illustrator)
- PNG
- JPG
- SVG
- PSD

### Recomendaciones:
- Resolución mínima: 300 DPI
- Formato vectorial preferible
- Fondo transparente
- Colores en CMYK

---

## 🔒 Seguridad

- Autenticación con NextAuth
- Contraseñas hasheadas con bcrypt
- Rutas de admin protegidas
- Sesiones seguras

---

## 📊 Base de Datos

### Tablas Principales:
- **users** - Usuarios y administradores
- **orders** - Pedidos de clientes
- **sessions** - Sesiones de NextAuth
- **accounts** - Cuentas de NextAuth
- **settings** - Configuraciones del sistema

---

## 🚀 Cómo Acceder

### Para Clientes:
1. Visita: `http://147.93.53.104:3001`
2. Calcula tu pedido
3. Completa el checkout
4. Sube tu diseño

### Para Administradores:
1. Visita: `http://147.93.53.104:3001/auth/signin`
2. Login: `admin@dtf.com` / `admin123`
3. Accede al panel: `http://147.93.53.104:3001/admin`
4. Gestiona pedidos y usuarios

---

## 📞 Próximas Funcionalidades

- [ ] Integración de pagos (Stripe/PayPal)
- [ ] Sistema de notificaciones por email
- [ ] Panel de estadísticas avanzado
- [ ] Exportación de informes
- [ ] Sistema de tickets de soporte
- [ ] Multi-idioma
- [ ] Programa de descuentos y cupones

---

**Última actualización:** 2025-10-10
**Versión:** 1.0.0
