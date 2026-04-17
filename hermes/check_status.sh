#!/bin/bash
echo "=== HERMES STATUS ==="
echo "Time: Thu Apr 16 14:12:49 EDT 2026"
echo

# Check if HERMES is running
HERMES_PID=
if [ ! -z "" ]; then
    echo " ✓ HERMES is RUNNING (PID: )"
else
    echo " ✗ HERMES is STOPPED"
fi

# Check task status
echo "Tasks: 4 pending"

# Show recent logs
echo
echo "Recent activity:"
tail -5 /mnt/c/ANTIGRAVITY/hermes/logs/activity.log 2>/dev/null || echo "No logs found"
