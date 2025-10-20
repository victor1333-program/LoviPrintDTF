#!/bin/bash
# Script para configurar SSL con Let's Encrypt
# Ejecutar cuando los DNS estén completamente propagados

echo "=== Verificando DNS ==="
echo "loviprintdtf.es:"
dig +short loviprintdtf.es
echo ""
echo "www.loviprintdtf.es:"
dig +short www.loviprintdtf.es
echo ""

echo "=== Probando acceso HTTP ==="
curl -I http://loviprintdtf.es 2>&1 | grep -E "HTTP|Server|Location" || echo "No se pudo conectar"
echo ""

read -p "¿Los DNS apuntan correctamente a 157.173.97.116 y el servidor responde con Nginx? (s/n): " respuesta

if [ "$respuesta" != "s" ]; then
    echo "Espera a que los DNS se propaguen completamente."
    echo "Puedes verificarlo en: https://dnschecker.org/#A/loviprintdtf.es"
    exit 1
fi

echo ""
echo "=== Obteniendo certificado SSL ==="
certbot --nginx -d loviprintdtf.es -d www.loviprintdtf.es --non-interactive --agree-tos --email admin@loviprintdtf.es --redirect

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificado SSL instalado correctamente!"
    echo ""
    echo "Actualizando variables de entorno..."
    cd /root/loviprintDTF

    # Actualizar .env
    sed -i 's|http://157.173.97.116:3000|https://www.loviprintdtf.es|g' .env
    sed -i 's|AUTH_URL="http://157.173.97.116:3000"|AUTH_URL="https://www.loviprintdtf.es"|g' .env
    sed -i 's|NEXTAUTH_URL="http://157.173.97.116:3000"|NEXTAUTH_URL="https://www.loviprintdtf.es"|g' .env
    sed -i 's|NEXT_PUBLIC_APP_URL=http://157.173.97.116:3000|NEXT_PUBLIC_APP_URL=https://www.loviprintdtf.es|g' .env

    echo "✅ Variables de entorno actualizadas"
    echo ""
    echo "Reiniciando servicio..."
    systemctl restart loviprint-dtf

    echo ""
    echo "✅ ¡Todo listo!"
    echo ""
    echo "Tu sitio está disponible en: https://www.loviprintdtf.es"
    echo "Certbot renovará automáticamente el certificado antes de que expire."
else
    echo ""
    echo "❌ Error al obtener el certificado SSL"
    echo "Verifica los logs en: /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi
