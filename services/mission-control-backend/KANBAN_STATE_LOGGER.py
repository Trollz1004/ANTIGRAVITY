#!/usr/bin/env python3
"""
Kanban State Logger + Live Activity
Tracks all 7 lanes and logs state changes + general activity to SQLite.
Exposes:
  - /api/kanban/state          → current lane statuses
  - /api/kanban/activity?limit=N → recent actions with "who" (actor) for the dashboard Live Activity feed

Call update_lane_status(..., actor="Grok via xAI user-auth through Hermes") 
or record_activity(actor=..., action=..., detail=...) from Hermes-routed agents
so the Mission Control dashboard always shows real-time who + status (never idle).
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

# Configuration
DB_PATH = 'E:/ANTIGRAVITY\\data\\mission_control.db'
T5500_HOST = '192.168.0.15'
T5500_PORT = 3200

# Kanban lane definitions
LANES = {
    'compliance': {
        'title': 'Compliance',
        'status': 'ACTIVE',
        'metric': 'IRS/State Tax Reserve | 27% Auto-Split'
    },
    'income_engine': {
        'title': 'Income-Engine',
        'status': 'ONLINE',
        'metric': 'AI Managed Arbitrage | 63% Yield'
    },
    'founder_safety': {
        'title': 'Founder Safety',
        'status': 'CRITICAL',
        'metric': 'Human Survival Baseline | $2500/mo Survival'
    },
    'kids_bucket': {
        'title': 'Kids Bucket',
        'status': 'VAULTED',
        'metric': 'Long-term UTMA Lock | 10% Fixed'
    },
    'governance': {
        'title': 'Governance',
        'status': 'PENDING',
        'metric': 'Multi-sig Audit | 3/5 Signers'
    },
    'manus_coordination': {
        'title': 'Manus Coordination',
        'status': 'RUNNING',
        'metric': 'GPU Local Fallback | Ollama Active'
    },
    'blocked': {
        'title': 'Blocked',
        'status': 'DEPRIORITIZED',
        'metric': 'Tier 0 Cloud Legacy | $0 Allocation'
    }
}

# Global state
kanban_state = {lane: LANES[lane].copy() for lane in LANES}


class KanbanHandler(BaseHTTPRequestHandler):
    """HTTP handler for Kanban state API"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/api/kanban/state':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            payload = {
                'timestamp': datetime.utcnow().isoformat(),
                'lanes': kanban_state,
                'total_lanes': len(kanban_state)
            }
            
            self.wfile.write(json.dumps(payload).encode())
        
        elif self.path.startswith('/api/kanban/lane/'):
            lane_name = self.path.split('/')[-1]
            
            if lane_name in kanban_state:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                payload = {
                    'lane': lane_name,
                    'data': kanban_state[lane_name],
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                self.wfile.write(json.dumps(payload).encode())
            else:
                self.send_response(404)
                self.end_headers()

        elif self.path.startswith('/api/kanban/activity'):
            # New endpoint for Live Activity feed — returns recent "who + action" entries
            limit = 30
            try:
                if '?' in self.path:
                    qs = self.path.split('?', 1)[1]
                    for part in qs.split('&'):
                        if part.startswith('limit='):
                            limit = max(1, min(100, int(part.split('=', 1)[1])))
            except:
                pass

            activities = []
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                # Try the rich activity_log table first
                cursor.execute('''
                    SELECT timestamp, actor, action, detail, lane 
                    FROM activity_log 
                    ORDER BY id DESC LIMIT ?
                ''', (limit,))
                rows = cursor.fetchall()
                
                for ts, actor, action, detail, lane in rows:
                    activities.append({
                        'timestamp': ts,
                        'actor': actor,
                        'action': action,
                        'detail': detail,
                        'lane': lane
                    })
                
                # Also pull recent lane changes if activity_log is empty
                if not activities:
                    cursor.execute('''
                        SELECT timestamp, lane_name, lane_status, lane_metric, COALESCE(actor, 'system')
                        FROM kanban_lanes 
                        ORDER BY id DESC LIMIT ?
                    ''', (limit,))
                    for ts, lane, status, metric, actor in cursor.fetchall():
                        activities.append({
                            'timestamp': ts,
                            'actor': actor,
                            'action': f"Lane '{lane}' status change",
                            'detail': status + (f" | {metric}" if metric else ""),
                            'lane': lane
                        })
                conn.close()
            except Exception as e:
                print(f'[ERROR] activity query failed: {e}')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'timestamp': datetime.utcnow().isoformat(),
                'count': len(activities),
                'activities': activities
            }).encode())

        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass


def update_lane_status(lane: str, status: str, metric: str = None, actor: str = "system"):
    """
    Update lane status and log to database with explicit 'who' (actor).
    Call this from Hermes-routed agents with proper actor string, e.g.:
      "Grok via xAI user-auth through Hermes"
      "CFO-Until-No-Kid-In-Need (local)"
    """
    global kanban_state
    
    if lane not in kanban_state:
        print(f'[ERROR] Lane "{lane}" not found')
        return
    
    old_status = kanban_state[lane]['status']
    kanban_state[lane]['status'] = status
    
    if metric:
        kanban_state[lane]['metric'] = metric
    
    # Log state change WITH actor for Live Activity visibility
    log_lane_change(lane, old_status, status, kanban_state[lane]['metric'], actor)
    
    # Also record as general activity so the feed is rich
    record_activity(
        actor=actor,
        action=f"Updated lane '{lane}'",
        detail=f"{old_status} → {status}" + (f" | {metric}" if metric else ""),
        lane=lane
    )
    
    print(f'[KANBAN] {actor} → {lane}: {old_status} → {status}')


def log_lane_change(lane: str, old_status: str, new_status: str, metric: str, actor: str = "system"):
    """Log lane status change to SQLite with actor (who) for Live Activity feed."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO kanban_lanes (timestamp, lane_name, lane_status, lane_metric, actor)
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime.utcnow().isoformat(), lane, f'{old_status} → {new_status}', metric, actor))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f'[ERROR] Failed to log lane change: {e}')


def record_activity(actor: str, action: str, detail: str = "", lane: str = None):
    """
    General purpose activity logger for the Live Activity feed.
    Use this for any task/routine/goal work so the dashboard shows real 'who + status'.
    """
    ts = datetime.utcnow().isoformat()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Use a broad activity table if it exists, otherwise fall back to kanban_lanes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                detail TEXT,
                lane TEXT
            )
        ''')
        
        cursor.execute('''
            INSERT INTO activity_log (timestamp, actor, action, detail, lane)
            VALUES (?, ?, ?, ?, ?)
        ''', (ts, actor, action, detail, lane))
        
        conn.commit()
        conn.close()
        print(f'[ACTIVITY] {actor}: {action} {detail[:60] if detail else ""}')
    except Exception as e:
        print(f'[ERROR] record_activity failed: {e}')


def init_database():
    """Initialize SQLite database with actor support for Live Activity feed."""
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Main lane history table (with actor/"who" column)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kanban_lanes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                lane_name TEXT NOT NULL,
                lane_status TEXT NOT NULL,
                lane_metric TEXT,
                actor TEXT DEFAULT 'system'
            )
        ''')
        
        # Add actor column if upgrading an old DB (safe)
        try:
            cursor.execute("ALTER TABLE kanban_lanes ADD COLUMN actor TEXT DEFAULT 'system'")
        except:
            pass  # column already exists
        
        # Rich activity log for general "who did what" events
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                detail TEXT,
                lane TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print('[DB] Kanban + Activity database initialized (with actor support)')
    except Exception as e:
        print(f'[ERROR] Failed to initialize database: {e}')


def start_http_server():
    """Start HTTP server for Kanban API"""
    server = HTTPServer((T5500_HOST, T5500_PORT), KanbanHandler)
    print(f'[HTTP] Kanban State API listening on http://{T5500_HOST}:{T5500_PORT}')
    server.serve_forever()


def main():
    """Main entry point"""
    print('[STARTUP] Kanban State Logger + Live Activity')
    print(f'[CONFIG] API: http://{T5500_HOST}:{T5500_PORT}')
    print(f'[CONFIG] Database: {DB_PATH}')
    print(f'[CONFIG] Lanes: {len(LANES)}')
    
    # Initialize database
    init_database()
    
    # Seed initial activity so the Live Activity feed is never completely empty on first run
    record_activity(
        actor="KANBAN_STATE_LOGGER (backend service)",
        action="Service started",
        detail="Live Activity feed now available at /api/kanban/activity"
    )
    
    # Start HTTP server
    http_thread = Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Keep running
    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        print('[SHUTDOWN] Kanban State Logger')


if __name__ == '__main__':
    main()
