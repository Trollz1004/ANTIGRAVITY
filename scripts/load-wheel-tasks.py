#!/usr/bin/env python3
"""Load THE-WHEEL tasks into Paperweight database."""
import json
import os
import re
import sqlite3
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "apps" / "paperweight" / "data" / "paperweight.db"

def now_ms() -> int:
    return int(time.time() * 1000)

def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DATA_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con

# Task categories mapped to companies
COMPANY_MAP = {
    "youandinotai": "youandinotai",
    "marketing": "marketing",
    "ai-solutions": "ai-solutions",
    "business-exchange": "business-exchange",
}

def parse_wheel_tasks():
    """Parse THE-WHEEL.md and extract tasks."""
    wheel_path = ROOT / "briefings" / "THE-WHEEL.md"
    content = wheel_path.read_text()
    
    tasks = []
    # Extract all numbered tasks with [ ] pattern
    pattern = r'^\d+\.\s+\[ \]\s+(.+)$'
    for line in content.split('\n'):
        match = re.match(pattern, line.strip())
        if match:
            tasks.append(match.group(1))
    return tasks

def load_tasks():
    """Load wheel tasks into Paperweight."""
    tasks = parse_wheel_tasks()
    print(f"Found {len(tasks)} tasks in THE-WHEEL.md")
    
    con = connect()
    
    # Ensure company exists
    for cid, name, desc, color in [
        ("youandinotai", "YouAndINotAI", "Date app + customer support", "love"),
        ("marketing", "Marketing", "Cross-platform — serves all surfaces", "amber"),
        ("ai-solutions", "AI-Solutions", "ai-solutions.store products", "ukid"),
        ("business-exchange", "Business Exchange", "9020-hosted business marketplace and operator workflow", "copper"),
    ]:
        con.execute("INSERT OR IGNORE INTO companies (id,name,description,color,created_at) VALUES (?,?,?,?,?)",
                    (cid, name, desc, color, now_ms()))
    
    # Map tasks to categories
    arch_end = 25
    comp_end = 45
    rev_end = 65
    content_end = 80
    support_end = 90
    deploy_end = 100
    
    for i, title in enumerate(tasks, 1):
        # Determine category and company
        if i <= arch_end:
            company = "youandinotai"
        elif i <= comp_end:
            company = "youandinotai"
        elif i <= rev_end:
            company = "youandinotai"
        elif i <= content_end:
            company = "youandinotai"
        elif i <= support_end:
            company = "youandinotai"
        else:
            company = "youandinotai"
        
        # Check if task already exists
        exists = con.execute("SELECT id FROM items WHERE title = ?", (title,)).fetchone()
        if not exists:
            iid = new_id("itm")
            con.execute(
                "INSERT INTO items (id,company,kind,title,body,status,priority,meta,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (iid, company, "task", title, f"Wheel task #{i}", "todo", 3, "{}", now_ms(), now_ms())
            )
            con.execute("INSERT INTO events (ts,company,entity,entity_id,action) VALUES (?,?,?,?,?)",
                        (now_ms(), company, "item", iid, "wheel_loaded"))
    
    con.commit()
    
    # Count loaded tasks
    count = con.execute("SELECT COUNT(*) FROM items WHERE kind='task' AND status='todo'").fetchone()[0]
    con.close()
    print(f"Loaded wheel tasks. Total todo tasks: {count}")

if __name__ == "__main__":
    load_tasks()