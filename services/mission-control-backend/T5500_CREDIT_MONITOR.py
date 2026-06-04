#!/usr/bin/env python3
"""
T5500 Credit Monitor Service
Exposes Manus API credit balance at http://192.168.0.15:3200/api/manus/credits
Broadcasts MANUS_CREDIT_DEPLETED event to Sabretooth when balance < 10%
"""

import os
import json
import time
import asyncio
import websockets
from datetime import datetime
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
import sqlite3

# Configuration
MANUS_API_KEY = os.getenv('MANUS_API_KEY', '')
MANUS_API_URL = os.getenv('MANUS_API_URL', 'https://api.manus.im')
T5500_HOST = '192.168.0.15'
T5500_PORT = 3200
SABRETOOTH_WS = 'ws://192.168.0.8:3300'
DB_PATH = 'c:\\antigravity\\data\\mission_control.db'

# Global state
credit_state = {
    'balance': 0.0,
    'limit': 50.0,
    'last_updated': None,
    'fallback_active': False,
    'provider': 'manus'
}

class CreditMonitorHandler(BaseHTTPRequestHandler):
    """HTTP handler for credit balance API"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/api/manus/credits':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            payload = {
                'balance': credit_state['balance'],
                'limit': credit_state['limit'],
                'percentage': (credit_state['balance'] / credit_state['limit']) * 100,
                'fallback_active': credit_state['fallback_active'],
                'provider': credit_state['provider'],
                'last_updated': credit_state['last_updated'],
                'timestamp': datetime.utcnow().isoformat()
            }
            
            self.wfile.write(json.dumps(payload).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass


async def fetch_manus_credits():
    """Fetch current credit balance from Manus API"""
    try:
        import requests
        headers = {'Authorization': f'Bearer {MANUS_API_KEY}'}
        response = requests.get(f'{MANUS_API_URL}/v1/credits/balance', headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('balance', 0.0), data.get('limit', 50.0)
        else:
            print(f'[ERROR] Manus API returned {response.status_code}')
            return credit_state['balance'], credit_state['limit']
    except Exception as e:
        print(f'[ERROR] Failed to fetch Manus credits: {e}')
        return credit_state['balance'], credit_state['limit']


async def broadcast_event(event_type: str, payload: Dict[str, Any]):
    """Broadcast event to Sabretooth via WebSocket"""
    try:
        async with websockets.connect(SABRETOOTH_WS) as ws:
            message = {
                'type': event_type,
                'timestamp': datetime.utcnow().isoformat(),
                'payload': payload
            }
            await ws.send(json.dumps(message))
            print(f'[BROADCAST] {event_type} sent to Sabretooth')
    except Exception as e:
        print(f'[ERROR] Failed to broadcast to Sabretooth: {e}')


async def monitor_credits():
    """Main credit monitoring loop"""
    global credit_state
    last_fallback_state = False
    
    while True:
        try:
            # Fetch current balance
            balance, limit = await fetch_manus_credits()
            credit_state['balance'] = balance
            credit_state['limit'] = limit
            credit_state['last_updated'] = datetime.utcnow().isoformat()
            
            # Calculate percentage
            percentage = (balance / limit) * 100
            
            # Check fallback threshold (10%)
            if percentage < 10 and not last_fallback_state:
                # Transition to fallback
                credit_state['fallback_active'] = True
                credit_state['provider'] = 'local_ollama'
                
                await broadcast_event('MANUS_CREDIT_DEPLETED', {
                    'balance': balance,
                    'limit': limit,
                    'percentage': percentage,
                    'action': 'SWITCH_TO_LOCAL_OLLAMA'
                })
                
                # Log to SQLite
                log_credit_event('FALLBACK_ACTIVATED', balance, limit, percentage)
                last_fallback_state = True
                print(f'[ALERT] Manus credits < 10% ({percentage:.1f}%). Fallback activated.')
            
            elif percentage >= 15 and last_fallback_state:
                # Transition back to Manus
                credit_state['fallback_active'] = False
                credit_state['provider'] = 'manus'
                
                await broadcast_event('MANUS_CREDIT_RESTORED', {
                    'balance': balance,
                    'limit': limit,
                    'percentage': percentage,
                    'action': 'SWITCH_TO_MANUS'
                })
                
                log_credit_event('FALLBACK_DEACTIVATED', balance, limit, percentage)
                last_fallback_state = False
                print(f'[INFO] Manus credits restored ({percentage:.1f}%). Using Manus again.')
            
            print(f'[MONITOR] Balance: ${balance:.2f} / ${limit:.2f} ({percentage:.1f}%) | Fallback: {credit_state["fallback_active"]}')
            
        except Exception as e:
            print(f'[ERROR] Monitor loop error: {e}')
        
        # Check every 30 seconds
        await asyncio.sleep(30)


def log_credit_event(event_type: str, balance: float, limit: float, percentage: float):
    """Log credit event to SQLite"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO credit_events (timestamp, event_type, balance, limit, percentage)
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime.utcnow().isoformat(), event_type, balance, limit, percentage))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f'[ERROR] Failed to log credit event: {e}')


def start_http_server():
    """Start HTTP server for credit API"""
    server = HTTPServer((T5500_HOST, T5500_PORT), CreditMonitorHandler)
    print(f'[HTTP] Credit Monitor API listening on http://{T5500_HOST}:{T5500_PORT}')
    server.serve_forever()


async def main():
    """Main entry point"""
    print('[STARTUP] T5500 Credit Monitor Service')
    print(f'[CONFIG] Manus API: {MANUS_API_URL}')
    print(f'[CONFIG] Sabretooth WebSocket: {SABRETOOTH_WS}')
    print(f'[CONFIG] Database: {DB_PATH}')
    
    # Start HTTP server in background thread
    http_thread = Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Run monitor loop
    await monitor_credits()


if __name__ == '__main__':
    asyncio.run(main())
