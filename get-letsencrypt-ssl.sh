#!/bin/bash
# Script para obtener certificado SSL real de Let's Encrypt
# IMPORTANTE: Ejecutar este script SOLO después de eliminar el registro IPv6 (AAAA) del dominio

echo "=== Verificación de DNS ==="
echo ""
echo "Verificando registros IPv4 (A):"
dig +short loviprintdtf.es A
dig +short www.loviprintdtf.es A
echo ""
echo "Verificando registros IPv6 (AAAA) - DEBEN ESTAR VACÍOS:"
IPv6_CHECK=$(dig +short loviprintdtf.es AAAA)
if [ -z "$IPv6_CHECK" ]; then
    echo "✅ No hay registros IPv6 - CORRECTO"
else
    echo "❌ TODAVÍA HAY REGISTROS IPv6:"
    echo "$IPv6_CHECK"
    echo ""
    echo "IMPORTANTE: Debes eliminar el registro AAAA (IPv6) del dominio primero."
    echo "El registro IPv6 apunta a Hostinger y Let's Encrypt no podrá verificar el dominio."
    echo ""
    echo "Ve al panel de tu proveedor de DNS y elimina el registro AAAA que apunta a:"
    echo "2a02:4780:8:959:0:ce0:4aa0:10"
    echo ""
    read -p "¿Has eliminado el registro IPv6 y quieres continuar de todos modos? (s/n): " force
    if [ "$force" != "s" ]; then
        exit 1
    fi
fi

echo ""
echo "=== Probando acceso HTTP desde Let's Encrypt ==="
echo "Haciendo petición de prueba..."
TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}|%{header_json}" http://loviprintdtf.es)
echo "Respuesta: $TEST_RESPONSE"

echo ""
read -p "¿Continuar con la obtención del certificado SSL real? (s/n): " confirmar

if [ "$confirmar" != "s" ]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo "=== Deteniendo Nginx temporalmente ==="
systemctl stop nginx

echo ""
echo "=== Obteniendo certificado de Let's Encrypt ==="
certbot certonly --standalone -d loviprintdtf.es -d www.loviprintdtf.es \
    --non-interactive --agree-tos --email admin@loviprintdtf.es \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificado obtenido exitosamente!"
    echo ""
    echo "=== Actualizando configuración de Nginx ==="

    # Actualizar la configuración de Nginx para usar el nuevo certificado
    sed -i 's|/etc/ssl/certs/loviprintdtf-selfsigned.crt|/etc/letsencrypt/live/loviprintdtf.es/fullchain.pem|g' /etc/nginx/sites-available/loviprintdtf.es
    sed -i 's|/etc/ssl/private/loviprintdtf-selfsigned.key|/etc/letsencrypt/live/loviprintdtf.es/privkey.pem|g' /etc/nginx/sites-available/loviprintdtf.es

    # Verificar configuración
    nginx -t

    if [ $? -eq 0 ]; then
        echo "✅ Configuración de Nginx actualizada correctamente"
        echo ""
        echo "=== Reiniciando servicios ==="
        systemctl start nginx
        systemctl restart loviprint-dtf

        echo ""
        echo "✅ ¡Todo listo!"
        echo ""
        echo "Tu sitio ahora tiene un certificado SSL válido de Let's Encrypt:"
        echo "https://www.loviprintdtf.es"
        echo ""
        echo "El certificado se renovará automáticamente cada 90 días."
        echo ""
        echo "Puedes verificar el estado del certificado en:"
        echo "https://www.ssllabs.com/ssltest/analyze.html?d=www.loviprintdtf.es"
    else
        echo "❌ Error en la configuración de Nginx"
        echo "Restaurando configuración anterior..."
        sed -i 's|/etc/letsencrypt/live/loviprintdtf.es/fullchain.pem|/etc/ssl/certs/loviprintdtf-selfsigned.crt|g' /etc/nginx/sites-available/loviprintdtf.es
        sed -i 's|/etc/letsencrypt/live/loviprintdtf.es/privkey.pem|/etc/ssl/private/loviprintdtf-selfsigned.key|g' /etc/nginx/sites-available/loviprintdtf.es
        systemctl start nginx
        exit 1
    fi
else
    echo ""
    echo "❌ Error al obtener el certificado SSL"
    echo ""
    echo "Iniciando Nginx con el certificado temporal..."
    systemctl start nginx
    echo ""
    echo "Posibles causas:"
    echo "1. El registro IPv6 (AAAA) todavía existe"
    echo "2. Los DNS no han propagado completamente"
    echo "3. El puerto 80 no es accesible desde internet"
    echo ""
    echo "Verifica los logs en: /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi
