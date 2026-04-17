#!/bin/bash
# HERMES Monitor Script

HERMES_DIR="/mnt/c/ANTIGRAVITY/hermes"
LOG_FILE="$HERMES_DIR/logs/hermes_daemon.log"

# Check if HERMES is running
if ! pgrep -f "hermes_loop.py" > /dev/null; then
    echo "$(date): HERMES not running, starting it..."
    cd $HERMES_DIR
    nohup python3 hermes_loop.py > $LOG_FILE 2>&1 &
    echo "$(date): HERMES started"
else
    echo "$(date): HERMES is running"
fi