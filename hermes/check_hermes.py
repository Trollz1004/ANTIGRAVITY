#!/usr/bin/env python3
"""
Simple HERMES Status Checker
"""

import json
import os
import subprocess
from datetime import datetime

def is_hermes_running():
    """Check if HERMES process is running using pgrep"""
    try:
        result = subprocess.run(['pgrep', '-f', 'hermes_loop.py'], 
                              capture_output=True, text=True)
        return len(result.stdout.strip()) > 0
    except:
        return False

def get_task_status():
    """Get task queue status"""
    try:
        with open('/mnt/c/ANTIGRAVITY/hermes/tasks/queue.json', 'r') as f:
            queue_data = json.load(f)
            tasks = queue_data.get('tasks', [])
            pending = [task for task in tasks if task.get('status') == 'pending']
            return len(pending), len(tasks)
    except FileNotFoundError:
        return 0, 0

def main():
    print("=== HERMES STATUS ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check if HERMES is running
    if is_hermes_running():
        print(" ✓ HERMES is RUNNING")
    else:
        print(" ✗ HERMES is STOPPED")
    
    # Check task status
    pending, total = get_task_status()
    print(f" Tasks: {pending} pending out of {total} total")
    print()
    
    # Show recent logs
    log_file = '/mnt/c/ANTIGRAVITY/hermes/logs/activity.log'
    if os.path.exists(log_file):
        print("Recent activity:")
        with open(log_file, 'r') as f:
            lines = f.readlines()
            for line in lines[-5:]:
                print(f"  {line.strip()}")

if __name__ == "__main__":
    main()