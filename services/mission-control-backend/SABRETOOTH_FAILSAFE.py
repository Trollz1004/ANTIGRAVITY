#!/usr/bin/env python3
"""
Sabretooth Failsafe Service
Receives MANUS_CREDIT_DEPLETED events from T5500
Switches to local Ollama (port 11434) when Manus credits depleted
Broadcasts task events to Mission Control dashboard
"""

import os
import json
import asyncio
import sqlite3
from datetime import datetime
from typing import Dict, Any
import websockets

# Configuration
SABRETOOTH_HOST = '192.168.0.8'
SABRETOOTH_WS_PORT = 3300
OLLAMA_LOCAL = 'http://127.0.0.1:11434'
DB_PATH = 'E:/ANTIGRAVITY\\data\\mission_control.db'

# Global state
fallback_state = {
    'active': False,
    'activated_at': None,
    'reason': None,
    'provider': 'manus'
}

connected_clients = set()


async def handle_client(websocket, path):
    """Handle WebSocket client connections"""
    connected_clients.add(websocket)
    print(f'[WS] Client connected. Total: {len(connected_clients)}')
    
    try:
        async for message in websocket:
            await process_incoming_event(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        print(f'[WS] Client disconnected. Total: {len(connected_clients)}')


async def process_incoming_event(message: str):
    """Process incoming event from T5500"""
    try:
        event = json.loads(message)
        event_type = event.get('type')
        payload = event.get('payload', {})
        
        if event_type == 'MANUS_CREDIT_DEPLETED':
            await handle_credit_depleted(payload)
        elif event_type == 'MANUS_CREDIT_RESTORED':
            await handle_credit_restored(payload)
        
    except Exception as e:
        print(f'[ERROR] Failed to process event: {e}')


async def handle_credit_depleted(payload: Dict[str, Any]):
    """Handle MANUS_CREDIT_DEPLETED event"""
    global fallback_state
    
    fallback_state['active'] = True
    fallback_state['activated_at'] = datetime.utcnow().isoformat()
    fallback_state['reason'] = f"Manus credits < 10% ({payload.get('percentage', 0):.1f}%)"
    fallback_state['provider'] = 'local_ollama'
    
    print(f'[FAILSAFE] ACTIVATED: {fallback_state["reason"]}')
    print(f'[FAILSAFE] Switching to local Ollama at {OLLAMA_LOCAL}')
    
    # Log to SQLite
    log_failsafe_event('ACTIVATED', fallback_state['reason'])
    
    # Broadcast to all connected clients
    broadcast_message = {
        'type': 'failsafe_activated',
        'timestamp': datetime.utcnow().isoformat(),
        'reason': fallback_state['reason'],
        'provider': 'local_ollama',
        'ollama_endpoint': OLLAMA_LOCAL
    }
    
    await broadcast_to_clients(broadcast_message)


async def handle_credit_restored(payload: Dict[str, Any]):
    """Handle MANUS_CREDIT_RESTORED event"""
    global fallback_state
    
    fallback_state['active'] = False
    fallback_state['provider'] = 'manus'
    
    print(f'[FAILSAFE] DEACTIVATED: Manus credits restored ({payload.get("percentage", 0):.1f}%)')
    
    # Log to SQLite
    log_failsafe_event('DEACTIVATED', 'Manus credits restored')
    
    # Broadcast to all connected clients
    broadcast_message = {
        'type': 'failsafe_deactivated',
        'timestamp': datetime.utcnow().isoformat(),
        'provider': 'manus'
    }
    
    await broadcast_to_clients(broadcast_message)


async def broadcast_task_event(agent: str, task: str, status: str, detail: str = ''):
    """Broadcast task event to Mission Control dashboard"""
    message = {
        'type': status.lower(),
        'timestamp': datetime.utcnow().isoformat(),
        'agent': agent,
        'task': task,
        'status': status,
        'detail': detail
    }
    
    await broadcast_to_clients(message)
    log_task_event(agent, task, status, detail)


async def broadcast_to_clients(message: Dict[str, Any]):
    """Broadcast message to all connected WebSocket clients"""
    if not connected_clients:
        return
    
    message_str = json.dumps(message)
    
    # Send to all connected clients
    disconnected = set()
    for client in connected_clients:
        try:
            await client.send(message_str)
        except websockets.exceptions.ConnectionClosed:
            disconnected.add(client)
    
    # Clean up disconnected clients
    for client in disconnected:
        connected_clients.discard(client)


def log_failsafe_event(event_type: str, reason: str):
    """Log failsafe event to SQLite"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO failsafe_events (timestamp, event_type, reason, active)
            VALUES (?, ?, ?, ?)
        ''', (datetime.utcnow().isoformat(), event_type, reason, event_type == 'ACTIVATED'))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f'[ERROR] Failed to log failsafe event: {e}')


def log_task_event(agent: str, task: str, status: str, detail: str):
    """Log task event to SQLite"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO task_events (timestamp, agent, task, status, detail)
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime.utcnow().isoformat(), agent, task, status, detail))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f'[ERROR] Failed to log task event: {e}')


def init_database():
    """Initialize SQLite database with required tables"""
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Credit events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS credit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                balance REAL,
                limit REAL,
                percentage REAL
            )
        ''')
        
        # Failsafe events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS failsafe_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                reason TEXT,
                active BOOLEAN
            )
        ''')
        
        # Task events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                agent TEXT NOT NULL,
                task TEXT NOT NULL,
                status TEXT NOT NULL,
                detail TEXT
            )
        ''')
        
        # Kanban lanes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kanban_lanes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                lane_name TEXT NOT NULL,
                lane_status TEXT NOT NULL,
                lane_metric TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print('[DB] Database initialized')
    except Exception as e:
        print(f'[ERROR] Failed to initialize database: {e}')


async def main():
    """Main entry point"""
    print('[STARTUP] Sabretooth Failsafe Service')
    print(f'[CONFIG] WebSocket: ws://{SABRETOOTH_HOST}:{SABRETOOTH_WS_PORT}')
    print(f'[CONFIG] Ollama Local: {OLLAMA_LOCAL}')
    print(f'[CONFIG] Database: {DB_PATH}')
    
    # Initialize database
    init_database()
    
    # Start WebSocket server
    async with websockets.serve(handle_client, SABRETOOTH_HOST, SABRETOOTH_WS_PORT):
        print(f'[WS] Failsafe WebSocket server listening on ws://{SABRETOOTH_HOST}:{SABRETOOTH_WS_PORT}')
        await asyncio.Future()  # Run forever


if __name__ == '__main__':
    asyncio.run(main())
