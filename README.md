# DTF Print Services 🎨

Sistema de venta de film DTF (Direct to Film) por metros. Los clientes pueden calcular el precio, subir sus diseños y hacer pedidos. Incluye un panel de administración simplificado para gestionar pedidos y usuarios.

## 🚀 Características

### Frontend (Cliente)
- ✅ Calculadora interactiva de metros con precio en tiempo real
- ✅ Sistema de carga de archivos con drag & drop
- ✅ Checkout completo con formulario de envío
- ✅ Página de confirmación de pedido
- ✅ Soporte para múltiples formatos (PNG, JPG, PDF, PSD, AI)

### Admin Panel
- ✅ Dashboard con estadísticas del mes
- ✅ Gestión completa de pedidos
  - Ver lista de todos los pedidos
  - Detalle de cada pedido
  - Cambiar estado y estado de pago
  - Añadir número de seguimiento
  - Descargar archivos de diseño de clientes
  - Notas internas del admin
- ✅ Gestión de usuarios
  - Lista de usuarios registrados
  - Información de contacto
  - Total de pedidos por usuario
- ✅ Sistema de autenticación seguro

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth v5
- **UI**: Tailwind CSS + Componentes personalizados
- **Upload**: React Dropzone
- **Forms**: React Hook Form + Zod
- **Validación**: TypeScript

## 📦 Instalación

### 1. Clonar el repositorio

```bash
cd print-services
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos

Crea una base de datos PostgreSQL y actualiza el archivo `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dtf_print_services?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-change-in-production"
```

### 4. Inicializar base de datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push

# Poblar con datos iniciales (admin + configuración)
npx prisma db seed
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔑 Credenciales de Admin

Después de ejecutar el seed, podrás acceder al admin con:

- **Email**: `admin@dtf.com`
- **Contraseña**: `admin123`

Accede al panel en: `http://localhost:3000/auth/signin`

## 📁 Estructura del Proyecto

```
print-services/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos iniciales
├── public/
│   └── uploads/               # Archivos subidos por clientes
│       └── designs/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Rutas protegidas del admin
│   │   │   └── admin/
│   │   │       ├── page.tsx           # Dashboard
│   │   │       ├── pedidos/           # Gestión de pedidos
│   │   │       └── usuarios/          # Gestión de usuarios
│   │   ├── api/
│   │   │   ├── auth/                  # NextAuth
│   │   │   ├── upload/                # Upload de archivos
│   │   │   └── orders/                # CRUD de pedidos
│   │   ├── auth/
│   │   │   └── signin/                # Login
│   │   ├── checkout/                  # Checkout y upload
│   │   ├── pedido/[id]/              # Confirmación
│   │   ├── layout.tsx                 # Layout principal
│   │   ├── page.tsx                   # Home con calculadora
│   │   └── globals.css
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminSidebar.tsx
│   │   ├── ui/                        # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── DTFCalculator.tsx          # Calculadora de metros
│   │   └── FileUpload.tsx             # Upload con dropzone
│   ├── lib/
│   │   ├── prisma.ts                  # Cliente de Prisma
│   │   └── utils.ts                   # Utilidades
│   ├── types/
│   │   └── index.ts                   # Types de TypeScript
│   └── middleware.ts                  # Protección de rutas
├── auth.ts                            # Configuración NextAuth
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎯 Flujo de Usuario

### Cliente
1. **Home** → Calculadora de metros (selecciona cantidad)
2. **Checkout** → Completa datos y sube diseño
3. **Confirmación** → Ve resumen del pedido

### Admin
1. **Login** → Accede con credenciales
2. **Dashboard** → Ve estadísticas generales
3. **Pedidos** → Gestiona pedidos:
   - Cambia estado
   - Descarga archivos de diseño
   - Añade notas internas
   - Agrega número de seguimiento
4. **Usuarios** → Ve lista de clientes

## 🔧 Configuración

Los valores por defecto se configuran en la tabla `settings`:

| Setting | Valor por Defecto |
|---------|------------------|
| `price_per_meter` | 15.00 € |
| `tax_rate` | 0.21 (21%) |
| `shipping_cost` | 5.00 € |
| `min_meters` | 0.5 m |
| `max_meters` | 100 m |

Para modificarlos, puedes:
1. Editar directamente en la BD
2. Crear una página de configuración en el admin (TODO)

## 📊 Base de Datos

### Modelos principales:

- **User**: Usuarios (clientes y admins)
- **Order**: Pedidos con toda la información
- **Setting**: Configuración del sistema

Ver esquema completo en `prisma/schema.prisma`

## 🚀 Despliegue

### Variables de entorno en producción

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="genera-un-secret-seguro"
```

### Build para producción

```bash
npm run build
npm start
```

## 📝 TODOs / Mejoras Futuras

- [ ] Integración con pasarela de pago (Stripe/PayPal)
- [ ] Sistema de envío de emails automáticos
- [ ] Página de configuración en admin
- [ ] Seguimiento de pedidos para clientes
- [ ] Sistema de notificaciones
- [ ] Exportar pedidos a CSV/Excel
- [ ] Panel de estadísticas avanzadas
- [ ] Sistema de cupones de descuento
- [ ] Registro de usuarios (opcional)
- [ ] Histórico de cambios en pedidos

## 🤝 Comparación con Lovilike

Este proyecto está basado en la estructura de Lovilike pero **simplificado**:

| Característica | Lovilike | DTF Print |
|----------------|----------|-----------|
| Productos | Múltiples con variantes | Un solo producto (Film DTF) |
| Personalización | Editor visual completo | Solo upload de archivos |
| Inventario | Sistema completo | No necesario |
| Categorías | Múltiples niveles | No aplica |
| Producción | Sistema completo | Básico (estados) |
| Admin | Complejo (~15 páginas) | Simple (~3 páginas) |

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Desarrollo

Desarrollado usando Claude Code basándose en la estructura de Lovilike.

---

¿Necesitas ayuda? Contacta al administrador.
