#!/usr/bin/env python3
"""Check Mission Agent OS API endpoints"""
import urllib.request
import json

base = "http://127.0.0.1:3130"

def get_json(path):
    try:
        req = urllib.request.Request(f"{base}{path}", headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return None, {"error": str(e)}

print("=== MISSION AGENT OS STATE ===")
status, data = get_json("/api/mos-state.json")
print(f"Status: {status}")
if status == 200:
    print(json.dumps(data, indent=2)[:800])

print("\n=== LIVE AGENTS ===")
status, data = get_json("/api/live/agents")
print(f"Status: {status}")
if status == 200:
    print(json.dumps(data, indent=2)[:800])

print("\n=== LIVE BOARD ===")
status, data = get_json("/api/live/board")
print(f"Status: {status}")
if status == 200:
    print(json.dumps(data, indent=2)[:800])
