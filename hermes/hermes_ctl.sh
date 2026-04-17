#!/bin/bash

HERMES_DIR="/mnt/c/ANTIGRAVITY/hermes"
LOG_FILE="$HERMES_DIR/logs/hermes_daemon.log"

start_hermes() {
    echo "Starting HERMES..."
    cd $HERMES_DIR
    nohup python3 hermes_loop.py > $LOG_FILE 2>&1 &
    echo "HERMES started in background"
}

stop_hermes() {
    echo "Stopping HERMES..."
    pkill -f "hermes_loop.py"
    echo "HERMES stopped"
}

status_hermes() {
    echo "Checking HERMES status..."
    if pgrep -f "hermes_loop.py" > /dev/null; then
        echo "HERMES is RUNNING"
    else
        echo "HERMES is STOPPED"
    fi
    python3 $HERMES_DIR/hermes_status.py
}

logs_hermes() {
    echo "Recent HERMES logs:"
    tail -20 $LOG_FILE
}

restart_hermes() {
    stop_hermes
    sleep 2
    start_hermes
}

case "$1" in
    start)
        start_hermes
        ;;
    stop)
        stop_hermes
        ;;
    status)
        status_hermes
        ;;
    logs)
        logs_hermes
        ;;
    restart)
        restart_hermes
        ;;
    *)
        echo "Usage: $0 {start|stop|status|logs|restart}"
        echo "  start   - Start HERMES in background"
        echo "  stop    - Stop HERMES"
        echo "  status  - Check HERMES status"
        echo "  logs    - Show recent logs"
        echo "  restart - Restart HERMES"
        ;;
esac