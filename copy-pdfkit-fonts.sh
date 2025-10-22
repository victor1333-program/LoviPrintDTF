#!/bin/bash
# Script para copiar archivos de fuentes de pdfkit después del build

echo "Copiando archivos de fuentes de pdfkit..."

# Crear directorios si no existen
mkdir -p .next/server/vendor-chunks/data
mkdir -p .next/server/chunks/data

# Copiar archivos de fuentes
if [ -d "node_modules/pdfkit/js/data" ]; then
  cp -r node_modules/pdfkit/js/data/* .next/server/vendor-chunks/data/
  cp -r node_modules/pdfkit/js/data/* .next/server/chunks/data/
  echo "✓ Archivos de fuentes copiados correctamente a ambas ubicaciones"
else
  echo "✗ No se encontraron los archivos de fuentes de pdfkit"
  exit 1
fi
