# 📋 Guía de Instalación - DTF Print Services

Esta guía te ayudará a configurar el proyecto paso a paso.

## ✅ Requisitos Previos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- Git instalado
- Editor de código (VS Code recomendado)

## 🚀 Instalación Paso a Paso

### 1. Preparar la Base de Datos

#### En PostgreSQL:

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear la base de datos
CREATE DATABASE dtf_print_services;

-- Crear un usuario (opcional)
CREATE USER dtf_user WITH PASSWORD 'tu_password';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE dtf_print_services TO dtf_user;

-- Salir
\q
```

### 2. Configurar el Proyecto

```bash
# Navegar al directorio del proyecto
cd /home/developer/print-services

# Instalar dependencias
npm install
```

### 3. Configurar Variables de Entorno

El archivo `.env` ya está creado, pero debes actualizarlo con tus datos:

```env
# Actualiza esta línea con tus credenciales de PostgreSQL
DATABASE_URL="postgresql://dtf_user:tu_password@localhost:5432/dtf_print_services?schema=public"

# Genera un secret seguro para producción
NEXTAUTH_SECRET="dtf-print-secret-change-in-production-2024"

# URL de la aplicación
NEXTAUTH_URL="http://localhost:3000"
```

**Generar NEXTAUTH_SECRET seguro:**
```bash
openssl rand -base64 32
```

### 4. Inicializar Prisma y la Base de Datos

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear las tablas en la base de datos
npx prisma db push

# Poblar con datos iniciales (admin + configuración)
npm run db:seed
```

Si todo va bien, verás:
```
🌱 Seeding database...
✅ Admin user created: admin@dtf.com
✅ Settings created
🎉 Seeding completed!
```

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 🔐 Acceso Inicial

### Panel de Administración

1. Visita: `http://localhost:3000/auth/signin`
2. Usa estas credenciales:
   - **Email**: `admin@dtf.com`
   - **Contraseña**: `admin123`

### Cambiar la Contraseña del Admin

```bash
# Ejecuta Prisma Studio
npx prisma studio
```

Esto abrirá una interfaz web donde puedes editar el usuario admin.

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev                 # Iniciar servidor de desarrollo

# Base de Datos
npx prisma studio          # Abrir interfaz visual de la BD
npx prisma db push         # Aplicar cambios del schema
npx prisma migrate dev     # Crear una migración
npm run db:seed            # Ejecutar seed nuevamente

# Producción
npm run build              # Compilar para producción
npm start                  # Iniciar en modo producción

# Utilidades
npm run lint               # Verificar código
npm run type-check         # Verificar TypeScript
```

## 📁 Verificar la Instalación

### 1. Frontend (Cliente)
- [ ] ✅ Home page se carga correctamente
- [ ] ✅ Calculadora funciona (puedes cambiar metros)
- [ ] ✅ Botón "Continuar y Subir Diseño" te lleva a checkout

### 2. Checkout
- [ ] ✅ Formulario de checkout se muestra
- [ ] ✅ Puedes arrastrar y soltar archivos
- [ ] ✅ Calculadora mantiene los valores

### 3. Admin
- [ ] ✅ Puedes hacer login en `/auth/signin`
- [ ] ✅ Dashboard muestra estadísticas (0 al inicio)
- [ ] ✅ Página de pedidos accesible
- [ ] ✅ Página de usuarios muestra al admin

## 🔍 Solución de Problemas

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# O en macOS:
brew services list

# Verificar la URL en .env
# Asegúrate de que el usuario, password y nombre de BD son correctos
```

### Error: "Prisma Client is not generated"

```bash
npx prisma generate
```

### Error al subir archivos

```bash
# Verificar que existe el directorio
mkdir -p public/uploads/designs

# Verificar permisos
chmod -R 755 public/uploads
```

### Puerto 3000 ya en uso

```bash
# Cambiar el puerto
PORT=3001 npm run dev

# O matar el proceso que usa el puerto 3000
lsof -ti:3000 | xargs kill
```

### Errores de TypeScript

```bash
# Limpiar y reinstalar
rm -rf node_modules .next
npm install
npx prisma generate
```

## 🎨 Personalización Inicial

### 1. Cambiar Precios por Defecto

Edita `prisma/seed.ts` y ejecuta:
```bash
npm run db:seed
```

### 2. Cambiar Colores de la Marca

Edita `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    // Cambia estos valores
  }
}
```

### 3. Añadir Logo

Coloca tu logo en `public/img/logo.png` y actualiza en:
- `src/app/page.tsx` (header)
- `src/components/admin/AdminSidebar.tsx`

## 📊 Verificar Base de Datos

```bash
npx prisma studio
```

Deberías ver:
- **users**: 1 usuario (admin@dtf.com)
- **settings**: 5 configuraciones
- **orders**: vacío inicialmente

## 🎉 ¡Listo!

Tu aplicación DTF Print Services está lista para usar. Ahora puedes:

1. **Probar el flujo completo**: Crear un pedido desde el frontend
2. **Gestionar pedidos**: Desde el admin
3. **Personalizar**: Adaptar a tus necesidades

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la terminal
2. Verifica las variables de entorno
3. Asegúrate de que PostgreSQL está corriendo
4. Revisa que todos los comandos se ejecutaron sin errores

---

**Próximo paso**: Lee el `README.md` para entender la estructura del proyecto.
