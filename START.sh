#!/bin/bash

# Script de inicio rápido para DTF Print Services
# Este script configura y arranca el proyecto automáticamente

echo "🚀 DTF Print Services - Inicio Rápido"
echo "======================================"
echo ""

# Verificar si node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js 18+ primero."
    exit 1
fi

echo "✓ Node.js $(node -v) detectado"
echo ""

# Verificar si PostgreSQL está corriendo
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL no detectado. Asegúrate de tenerlo instalado y corriendo."
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo "✓ Dependencias instaladas"
    echo ""
fi

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado."
    echo "Por favor, configura tu base de datos en el archivo .env"
    echo ""
    echo "Ejemplo:"
    echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/dtf_print_services\""
    echo ""
    exit 1
fi

echo "✓ Archivo .env encontrado"
echo ""

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate > /dev/null 2>&1
echo "✓ Prisma Client generado"
echo ""

# Preguntar si quiere hacer push de la base de datos
read -p "¿Crear tablas en la base de datos? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "📊 Creando tablas en la base de datos..."
    npx prisma db push
    echo "✓ Tablas creadas"
    echo ""

    # Preguntar si quiere ejecutar el seed
    read -p "¿Poblar base de datos con datos iniciales? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🌱 Poblando base de datos..."
        npm run db:seed
        echo ""
        echo "✓ Datos iniciales creados"
        echo ""
        echo "📝 Credenciales de admin:"
        echo "   Email: admin@dtf.com"
        echo "   Password: admin123"
        echo ""
    fi
fi

echo "======================================"
echo "🎉 ¡Todo listo!"
echo ""
echo "Iniciando servidor de desarrollo..."
echo "Abrirá en: http://localhost:3000"
echo ""
echo "URLs importantes:"
echo "  • Home: http://localhost:3000"
echo "  • Admin: http://localhost:3000/admin"
echo "  • Login: http://localhost:3000/auth/signin"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo "======================================"
echo ""

# Iniciar servidor de desarrollo
npm run dev
