# Proyecto: Venta de Film DTF (Direct to Film)

## Descripción General
Sistema de venta de film DTF por metros donde los clientes pueden subir sus diseños y comprar film personalizado. Admin simplificado para gestionar pedidos y usuarios.

## Referencia
- Sitio de referencia: https://www.dtfrapido.com/
- Base del proyecto: Lovilike (simplificado)

## Stack Tecnológico
- **Framework**: Next.js 15 (App Router)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth v5
- **UI**: Tailwind CSS + Radix UI
- **File Upload**: React Dropzone
- **Forms**: React Hook Form + Zod

## Estructura del Proyecto

```
print-services/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx (Dashboard)
│   │   │       ├── pedidos/
│   │   │       │   ├── page.tsx (Lista de pedidos)
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx (Detalle + descarga archivos)
│   │   │       └── usuarios/
│   │   │           └── page.tsx (Lista de usuarios)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── orders/
│   │   │   ├── upload/
│   │   │   └── users/
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── carrito/
│   │   ├── checkout/
│   │   ├── layout.tsx
│   │   └── page.tsx (Home - Selector de metros)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   └── OrdersTable.tsx
│   │   ├── ui/
│   │   └── DTFCalculator.tsx (Calculadora de metros)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── types/
└── public/
    └── uploads/
```

## Modelos de Base de Datos

### User
- id, name, email, password
- role (CUSTOMER | ADMIN)
- createdAt, updatedAt

### Order
- id, orderNumber
- userId, customerName, customerEmail, customerPhone
- metersOrdered (Decimal)
- designFileUrl (String)
- totalPrice (Decimal)
- status (PENDING | IN_PRODUCTION | READY | SHIPPED | DELIVERED)
- notes (String?)
- createdAt, updatedAt

### Settings
- Precio por metro
- IVA
- Gastos de envío

## Funcionalidades

### Frontend (Cliente)
1. **Página Principal**
   - Calculadora de metros
   - Precio por metro (configurable desde admin)
   - Selector de cantidad de metros
   - Vista previa del precio total

2. **Carga de Diseño**
   - Dropzone para subir archivos
   - Formatos aceptados: PNG, JPG, PDF, AI, PSD
   - Preview del archivo subido
   - Validación de tamaño y formato

3. **Checkout**
   - Formulario de datos del cliente
   - Resumen del pedido
   - Método de pago (Stripe/PayPal)
   - Confirmación por email

### Admin Panel (Simplificado)
1. **Dashboard**
   - Total de pedidos del mes
   - Ingresos del mes
   - Pedidos pendientes
   - Gráfica simple de ventas

2. **Gestión de Pedidos**
   - Tabla de pedidos con:
     - Número de orden
     - Cliente
     - Metros
     - Estado
     - Fecha
     - Acciones
   - Vista detalle:
     - Info completa del pedido
     - Descargar archivo del cliente
     - Cambiar estado
     - Añadir notas internas

3. **Gestión de Usuarios**
   - Tabla de usuarios registrados
   - Email, nombre, fecha de registro
   - Total de pedidos por usuario
   - Filtros básicos

4. **Configuración**
   - Precio por metro
   - IVA
   - Gastos de envío
   - Métodos de pago activos

## Características Clave

### Simplificaciones vs Lovilike
- ✅ Un solo tipo de producto (Film DTF)
- ✅ Sin variantes de producto
- ✅ Sin sistema de inventario complejo
- ✅ Sin categorías múltiples
- ✅ Sin personalización visual (solo upload)
- ✅ Sin sistema de producción complejo
- ✅ Admin más simple (3-4 páginas principales)

### Funcionalidades Específicas DTF
- ✅ Venta por metros (no por unidades)
- ✅ Carga de archivos de diseño
- ✅ Descarga de archivos desde admin
- ✅ Cálculo automático de precio por metros
- ✅ Email de confirmación con detalles

## Fases de Desarrollo

### Fase 1: Setup Base
- [x] Estructura del proyecto
- [ ] Configuración de Next.js
- [ ] Configuración de Prisma
- [ ] Schema de base de datos
- [ ] NextAuth configurado

### Fase 2: Frontend Cliente
- [ ] Página home con calculadora
- [ ] Sistema de upload de archivos
- [ ] Carrito simple
- [ ] Checkout y pago

### Fase 3: Admin Panel
- [ ] Layout del admin
- [ ] Dashboard
- [ ] Gestión de pedidos
- [ ] Gestión de usuarios
- [ ] Configuración

### Fase 4: Integraciones
- [ ] Pasarela de pago
- [ ] Sistema de emails
- [ ] Almacenamiento de archivos

## Notas Importantes
- Los archivos subidos se guardan en `/public/uploads/designs/`
- Implementar límite de tamaño de archivo (max 50MB)
- Los administradores pueden descargar los archivos originales
- Email automático al cliente cuando cambia el estado del pedido
- Mínimo de compra: 1 metro
- Los precios se muestran siempre con IVA incluido
