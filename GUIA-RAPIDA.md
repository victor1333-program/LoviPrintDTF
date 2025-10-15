# 🚀 Guía Rápida - DTF Print Services

## ⚡ Instalación en 5 Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (edita con tus datos)
nano .env

# 3. Inicializar base de datos
npx prisma db push && npm run db:seed

# 4. Iniciar servidor
npm run dev

# 5. Abrir en navegador
# http://localhost:3000
```

## 🔑 Login Admin

```
URL: http://localhost:3000/auth/signin
Email: admin@dtf.com
Password: admin123
```

## 🎯 URLs Importantes

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000` | Home / Calculadora |
| `http://localhost:3000/checkout` | Checkout |
| `http://localhost:3000/auth/signin` | Login Admin |
| `http://localhost:3000/admin` | Dashboard Admin |
| `http://localhost:3000/admin/pedidos` | Gestión Pedidos |
| `http://localhost:3000/admin/usuarios` | Gestión Usuarios |

## 📱 Flujo de Usuario Cliente

```
1. HOME
   ↓ Selecciona metros en calculadora
   ↓ Click "Continuar y Subir Diseño"

2. CHECKOUT
   ↓ Completa formulario
   ↓ Sube archivo de diseño
   ↓ Click "Realizar Pedido"

3. CONFIRMACIÓN
   ✓ Ve resumen del pedido
   ✓ Recibe email (TODO)
```

## 🛠️ Flujo Admin

```
1. LOGIN
   ↓ Ingresa credenciales

2. DASHBOARD
   ↓ Ve estadísticas

3. PEDIDOS
   ↓ Click en un pedido
   ↓ Cambia estado
   ↓ Descarga diseño del cliente
   ↓ Añade notas
   ↓ Guarda cambios
```

## 📊 Estados de Pedido

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Recién creado |
| `CONFIRMED` | Confirmado por admin |
| `IN_PRODUCTION` | En proceso de impresión |
| `READY` | Listo para envío |
| `SHIPPED` | Enviado al cliente |
| `DELIVERED` | Entregado |
| `CANCELLED` | Cancelado |

## 🎨 Estructura de Carpetas Importante

```
src/
├── app/
│   ├── page.tsx                    ← Home con calculadora
│   ├── checkout/page.tsx           ← Checkout
│   ├── (admin)/admin/              ← Panel admin
│   └── api/                        ← APIs
│
├── components/
│   ├── DTFCalculator.tsx           ← Calculadora de metros
│   ├── FileUpload.tsx              ← Upload de archivos
│   └── admin/                      ← Componentes admin
│
└── lib/
    ├── prisma.ts                   ← Cliente DB
    └── utils.ts                    ← Utilidades
```

## 🔧 Comandos Esenciales

```bash
# Desarrollo
npm run dev              # Servidor desarrollo

# Base de Datos
npx prisma studio        # Interfaz visual BD
npx prisma db push       # Aplicar cambios schema
npm run db:seed          # Poblar datos iniciales

# Producción
npm run build            # Compilar
npm start                # Iniciar producción
```

## 💾 Archivos de Configuración

### `.env` (principal)
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="tu-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### `prisma/schema.prisma` (base de datos)
- Define tablas: User, Order, Setting
- Enums: OrderStatus, PaymentStatus, Role

### `tailwind.config.ts` (estilos)
- Colores de marca en `primary`

## 📝 Datos por Defecto

Después del seed:

**Settings (tabla)**
- Precio por metro: 15€
- IVA: 21%
- Envío: 5€
- Min metros: 0.5m
- Max metros: 100m

**Admin (usuario)**
- Email: admin@dtf.com
- Pass: admin123
- Rol: ADMIN

## 🎯 Próximos Pasos

1. ✅ **Probar flujo completo**
   - Crear pedido desde frontend
   - Gestionar desde admin
   - Descargar archivo

2. 🔧 **Personalizar**
   - Cambiar precios en seed
   - Modificar colores en tailwind
   - Añadir tu logo

3. 🚀 **Integrar**
   - Pasarela de pago
   - Sistema de emails
   - Notificaciones

## ⚠️ Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| Error de conexión BD | Verifica PostgreSQL corriendo |
| Prisma not generated | `npx prisma generate` |
| Puerto en uso | `PORT=3001 npm run dev` |
| Error al subir | `mkdir -p public/uploads/designs` |

## 📚 Documentación Completa

- `README.md` - Documentación completa del proyecto
- `INSTALACION.md` - Guía detallada de instalación
- `PROYECTO-DTF.md` - Planificación y arquitectura

## 🎉 ¡Listo para Empezar!

```bash
npm run dev
```

Visita `http://localhost:3000` y comienza a vender film DTF! 🚀
