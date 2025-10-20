#!/bin/bash
# Script para copiar archivos de fuentes de pdfkit después del build

echo "Copiando archivos de fuentes de pdfkit..."

# Crear directorio si no existe
mkdir -p .next/server/vendor-chunks/data

# Copiar archivos de fuentes
if [ -d "node_modules/pdfkit/js/data" ]; then
  cp -r node_modules/pdfkit/js/data/* .next/server/vendor-chunks/data/
  echo "✓ Archivos de fuentes copiados correctamente"
else
  echo "✗ No se encontraron los archivos de fuentes de pdfkit"
  exit 1
fi
