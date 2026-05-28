#!/usr/bin/env python3
"""
YouAndINotAI Support Bot - Quick Verification Test
Run this to verify the bot works before deploying to youandinotai.com
"""

import subprocess
import json
import time
import sys
from pathlib import Path

def run_cmd(cmd, shell=False):
    """Run command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=shell,
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def test_ollama_connection():
    """Test Ollama on Sabretooth"""
    print("\n📡 Testing Ollama on Sabretooth (192.168.0.8:11434)...")
    
    success, out, err = run_cmd(
        'curl -s http://192.168.0.8:11434/api/tags',
        shell=True
    )
    
    if success:
        try:
            data = json.loads(out)
            models = data.get("models", [])
            print(f"✅ Ollama reachable ({len(models)} models)")
            return True
        except:
            print("⚠️  Ollama reachable but response invalid")
            return False
    else:
        print("❌ Ollama not reachable (expected if not running)")
        print("   Make sure Ollama is running on Sabretooth: ollama serve")
        return False

def test_gemini_api_key():
    """Test Gemini API key"""
    print("\n🔑 Testing Gemini API Key...")
    
    # Read .env
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env not found")
        return False
    
    with open(env_path) as f:
        lines = f.readlines()
    
    gemini_key = None
    for line in lines:
        if line.startswith("GEMINI_API_KEY="):
            gemini_key = line.split("=")[1].strip()
            break
    
    if not gemini_key or gemini_key.startswith("AIza") == False:
        print("⚠️  GEMINI_API_KEY not set (fallback to Ollama)")
        return False
    else:
        print(f"✅ Gemini API key found ({gemini_key[:20]}...)")
        return True

def test_faq_data():
    """Test FAQ data file"""
    print("\n📚 Testing FAQ Data...")
    
    faq_path = Path("data/faq.json")
    if not faq_path.exists():
        print("❌ FAQ file not found at data/faq.json")
        return False
    
    try:
        with open(faq_path) as f:
            data = json.load(f)
        
        faqs = data.get("faqs", [])
        print(f"✅ FAQ loaded ({len(faqs)} Q&A pairs)")
        
        # Show sample
        if faqs:
            print(f"   Sample: {faqs[0]['question'][:60]}")
        
        return True
    except Exception as e:
        print(f"❌ FAQ load failed: {e}")
        return False

def test_database():
    """Test SQLite database"""
    print("\n💾 Testing Database...")
    
    db_path = Path("state/support.db")
    
    try:
        import sqlite3
        
        if not db_path.exists():
            print("⚠️  Database not created yet (will be created on first run)")
            return True
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM tickets")
        count = cursor.fetchone()[0]
        conn.close()
        
        print(f"✅ Database OK ({count} tickets)")
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def test_dependencies():
    """Test required Python packages"""
    print("\n📦 Testing Dependencies...")
    
    required = ["aiohttp", "httpx", "google.generativeai"]
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"❌ Missing: {', '.join(missing)}")
        print(f"   Run: pip install -r requirements.txt")
        return False
    else:
        print(f"✅ All dependencies installed")
        return True

def test_api_endpoint():
    """Test if API responds"""
    print("\n🌐 Testing API Endpoint (http://127.0.0.1:8765)...")
    
    # Note: This only works if bot is already running
    success, out, err = run_cmd(
        'curl -s http://127.0.0.1:8765/health',
        shell=True
    )
    
    if success:
        print("✅ API responding")
        return True
    else:
        print("⚠️  API not responding (bot may not be running yet)")
        print("   Start with: python bot.py")
        return False

def main():
    print("╔════════════════════════════════════════════════════════════╗")
    print("║  YouAndINotAI Support Bot - Verification Test             ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    results = {
        "Ollama": test_ollama_connection(),
        "Gemini API": test_gemini_api_key(),
        "FAQ Data": test_faq_data(),
        "Database": test_database(),
        "Dependencies": test_dependencies(),
        "API Endpoint": test_api_endpoint(),
    }
    
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print("=" * 60)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{name:.<40} {status}")
    
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    print("=" * 60)
    print(f"Result: {passed_count}/{total_count} tests passed\n")
    
    if passed_count == total_count:
        print("🎉 All checks passed! Bot is ready to deploy.")
        print("\nNext steps:")
        print("1. python bot.py          # Start the bot")
        print("2. Test: curl http://127.0.0.1:8765/health")
        print("3. Ask: curl -X POST http://127.0.0.1:8765/api/support/ask ...")
        print("4. Integrate with youandinotai.com")
        return 0
    elif passed_count >= total_count - 2:
        print("⚠️  Some tests failed but bot may still work.")
        print("Review failures above and fix before production.")
        return 1
    else:
        print("❌ Critical failures detected. Fix before running.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
