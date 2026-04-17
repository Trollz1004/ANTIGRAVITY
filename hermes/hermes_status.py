#!/usr/bin/env python3
"""
HERMES Status Checker
"""
import json
import os
from datetime import datetime

HERMES_DIR = "/mnt/c/ANTIGRAVITY/hermes"
QUEUE_FILE = f"{HERMES_DIR}/tasks/queue.json"
HISTORY_FILE = f"{HERMES_DIR}/tasks/history.json"
LOG_FILE = f"{HERMES_DIR}/logs/activity.log"

def read_json_file(filepath):
    """Read a JSON file and return its contents"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def get_pending_tasks():
    """Get the number of pending tasks"""
    queue_data = read_json_file(QUEUE_FILE)
    tasks = queue_data.get('tasks', [])
    pending = [task for task in tasks if task.get('status') == 'pending']
    return len(pending), len(tasks)

def get_recent_logs(lines=10):
    """Get the most recent lines from the log file"""
    try:
        with open(LOG_FILE, 'r') as f:
            all_lines = f.readlines()
            return all_lines[-lines:] if len(all_lines) >= lines else all_lines
    except FileNotFoundError:
        return []

def main():
    print("=== HERMES STATUS REPORT ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check pending tasks
    pending_count, total_count = get_pending_tasks()
    print(f"Task Queue:")
    print(f"  Total Tasks: {total_count}")
    print(f"  Pending Tasks: {pending_count}")
    print()
    
    # Show recent activity
    print("Recent Activity:")
    recent_logs = get_recent_logs(5)
    for log_line in recent_logs:
        print(f"  {log_line.strip()}")
    print()
    
    print("=== END STATUS REPORT ===")

if __name__ == "__main__":
    main()