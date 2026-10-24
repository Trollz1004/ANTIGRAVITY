#!/usr/bin/env python3
"""Check what's actually running on various ports and endpoints"""
import urllib.request
import urllib.error
import json
import socket

ports_to_check = [
    (3100, "/api/health"),
    (4747, "/api/health"),
    (20128, "/api/v1/models"),  # OmniRoute
    (8643, "/api/health"),  # Hermes gateway
    (3130, "/api/health"),  # Mission Control
]

print("=== PORT CHECK ===\n")

for port, endpoint in ports_to_check:
    # Check if port is open
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex(('127.0.0.1', port))
    if result == 0:
        print(f"Port {port}: OPEN")
        
        # Try HTTP request
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            req = urllib.request.Request(f"http://127.0.0.1:{port}{endpoint}", headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read(500).decode('utf-8')
                print(f"  {endpoint}: {resp.status}")
                print(f"  Response: {data[:200]}...")
        except Exception as e:
            print(f"  HTTP Error: {e}")
    else:
        print(f"Port {port}: CLOSED")
    sock.close()

# Check for any process listening on these ports using netstat-like approach
print("\n=== CHECKING SERVICE NAMES ===")

import subprocess
try:
    result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True, timeout=10)
    lines = result.stdout.split('\n')
    for line in lines:
        if '127.0.0.1:3' in line or '0.0.0.0:3' in line or ':::3' in line:
            print(f"  {line}")
except Exception as e:
    print(f"  Netstat error: {e}")