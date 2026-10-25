#!/usr/bin/env python3
"""Check routes on port 3130"""
import urllib.request
import urllib.error

url = "http://127.0.0.1:3130/"
try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        print(f"Status: {resp.status}")
        print(f"Headers: {dict(resp.getheaders())}")
        print(f"Body: {resp.read(1000).decode('utf-8', errors='ignore')}")
except Exception as e:
    print(f"Error: {e}")
