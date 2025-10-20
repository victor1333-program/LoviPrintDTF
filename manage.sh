#!/bin/bash
# Script de gestión para LoviPrint DTF

case "$1" in
  start)
    echo "Iniciando LoviPrint DTF..."
    systemctl start loviprint-dtf
    systemctl status loviprint-dtf --no-pager
    ;;
  stop)
    echo "Deteniendo LoviPrint DTF..."
    systemctl stop loviprint-dtf
    ;;
  restart)
    echo "Reiniciando LoviPrint DTF..."
    systemctl restart loviprint-dtf
    systemctl status loviprint-dtf --no-pager
    ;;
  status)
    systemctl status loviprint-dtf --no-pager
    ;;
  logs)
    journalctl -u loviprint-dtf -f
    ;;
  logs-error)
    journalctl -u loviprint-dtf -p err -f
    ;;
  build)
    echo "Construyendo aplicación..."
    cd /root/loviprintDTF
    npm run build
    ;;
  db-push)
    echo "Sincronizando base de datos..."
    cd /root/loviprintDTF
    npm run db:push
    ;;
  db-studio)
    echo "Abriendo Prisma Studio..."
    cd /root/loviprintDTF
    npm run db:studio
    ;;
  *)
    echo "Uso: $0 {start|stop|restart|status|logs|logs-error|build|db-push|db-studio}"
    echo ""
    echo "Comandos:"
    echo "  start        - Iniciar el servicio"
    echo "  stop         - Detener el servicio"
    echo "  restart      - Reiniciar el servicio"
    echo "  status       - Ver estado del servicio"
    echo "  logs         - Ver logs en tiempo real"
    echo "  logs-error   - Ver solo errores en tiempo real"
    echo "  build        - Construir la aplicación"
    echo "  db-push      - Sincronizar base de datos"
    echo "  db-studio    - Abrir Prisma Studio"
    exit 1
    ;;
esac

exit 0
