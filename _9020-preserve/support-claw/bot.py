#!/usr/bin/env python3
"""
YouAndINotAI Support Bot
Isolated support-only bot for youandinotai.com customer inquiries
Location: D:\support-claw\
LLM: Ollama (qwen2.5:7b) on Sabretooth 192.168.0.8:11434
Fallback: Gemini 2.0 Flash via Sabretooth CLI
"""

import os
import sys
import json
import sqlite3
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import logging

# ── Logging Setup ──────────────────────────────────────────────────────
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "support.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("YouAndINotAI-Support")

# ── Config Loading ─────────────────────────────────────────────────────
CONFIG_FILE = "config.json"

def load_config() -> Dict[str, Any]:
    """Load config.json"""
    try:
        with open(CONFIG_FILE) as f:
            config = json.load(f)
        logger.info(f"✅ Config loaded from {CONFIG_FILE}")
        return config
    except FileNotFoundError:
        logger.error(f"❌ {CONFIG_FILE} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in {CONFIG_FILE}: {e}")
        sys.exit(1)

config = load_config()

# ── Environment Setup ──────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(".env")

# ── FAQ Database ───────────────────────────────────────────────────────
class FAQStore:
    """Load and query FAQ data"""
    
    def __init__(self, faq_file: str = "data/faq.json"):
        self.faq_file = faq_file
        self.faqs = []
        self.load()
    
    def load(self):
        """Load FAQs from JSON"""
        faq_path = Path(self.faq_file)
        if not faq_path.exists():
            logger.warning(f"⚠️  FAQ file {self.faq_file} not found (will start empty)")
            self.faqs = []
            return
        
        try:
            with open(faq_path) as f:
                data = json.load(f)
            self.faqs = data.get("faqs", [])
            logger.info(f"✅ Loaded {len(self.faqs)} FAQs")
        except Exception as e:
            logger.error(f"❌ Failed to load FAQs: {e}")
            self.faqs = []
    
    def search(self, query: str, top_k: int = 3) -> list:
        """Simple keyword search in FAQs"""
        query_lower = query.lower()
        matches = []
        
        for faq in self.faqs:
            q = faq.get("question", "").lower()
            a = faq.get("answer", "").lower()
            
            # Check if query matches question or answer
            if query_lower in q or query_lower in a:
                matches.append(faq)
        
        return matches[:top_k]
    
    def get_all(self) -> list:
        """Return all FAQs"""
        return self.faqs

faq_store = FAQStore(config["faq"]["file"])

# ── Support Database ──────────────────────────────────────────────────
class SupportDB:
    """SQLite database for support tickets"""
    
    def __init__(self, db_path: str = "state/support.db"):
        self.db_path = db_path
        Path(self.db_path).parent.mkdir(exist_ok=True)
        self.init_db()
    
    def init_db(self):
        """Create tables if needed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                response TEXT,
                llm_used TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved BOOLEAN DEFAULT 0,
                escalated BOOLEAN DEFAULT 0
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info(f"✅ Database ready: {self.db_path}")
    
    def save_ticket(self, query: str, response: str, llm_used: str, 
                   escalated: bool = False) -> int:
        """Save support interaction"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO tickets (query, response, llm_used, escalated)
            VALUES (?, ?, ?, ?)
        """, (query, response, llm_used, escalated))
        
        ticket_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return ticket_id
    
    def get_stats(self) -> Dict[str, int]:
        """Get support stats"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM tickets")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE escalated=1")
        escalated = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE resolved=1")
        resolved = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_tickets": total,
            "escalated": escalated,
            "resolved": resolved
        }

support_db = SupportDB(config["database"]["path"])

# ── Ollama Integration ─────────────────────────────────────────────────
class OllamaClient:
    """Simple Ollama API client"""
    
    def __init__(self, host: str, model: str, timeout: int = 30):
        self.host = host
        self.model = model
        self.timeout = timeout
    
    async def ask(self, prompt: str, context: str = "") -> Optional[str]:
        """Ask Ollama a question"""
        try:
            import httpx
            
            full_prompt = f"{context}\n\nQuestion: {prompt}\n\nAnswer:"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.host}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "").strip()
                else:
                    logger.warning(f"⚠️  Ollama error: {response.status_code}")
                    return None
        
        except Exception as e:
            logger.error(f"❌ Ollama failed: {e}")
            return None

ollama_client = OllamaClient(
    host=config["llm"]["host"],
    model=config["llm"]["model"],
    timeout=config["llm"]["timeout"]
)

# ── Support Response Engine ────────────────────────────────────────────
class SupportEngine:
    """Main support bot logic"""
    
    def __init__(self, faq_store: FAQStore, db: SupportDB, llm_client: OllamaClient):
        self.faq = faq_store
        self.db = db
        self.llm = llm_client
    
    async def answer(self, query: str) -> Dict[str, Any]:
        """Answer a support query"""
        
        logger.info(f"📥 Query: {query[:100]}")
        
        # 1. Try FAQ first
        faq_matches = self.faq.search(query, top_k=1)
        if faq_matches:
            faq = faq_matches[0]
            response = faq["answer"]
            llm_used = "faq"
            logger.info(f"📄 Matched FAQ: {faq['question'][:50]}")
        
        else:
            # 2. Fall back to Ollama
            context = self._build_context()
            response = await self.llm.ask(query, context)
            
            if response:
                llm_used = "ollama"
                logger.info(f"🤖 Ollama response: {len(response)} chars")
            else:
                # 3. Escalate
                response = config["responses"]["fallback_message"]
                llm_used = "fallback"
                logger.warning(f"⚠️  Escalating to human support")
        
        # Save to database
        escalated = (llm_used == "fallback")
        ticket_id = self.db.save_ticket(query, response, llm_used, escalated)
        
        return {
            "ticket_id": ticket_id,
            "query": query,
            "response": response,
            "llm_used": llm_used,
            "escalated": escalated,
            "timestamp": datetime.now().isoformat()
        }
    
    def _build_context(self) -> str:
        """Build context for LLM"""
        return f"""You are a support agent for YouAndINotAI (https://youandinotai.com).

YouAndINotAI is a verified-human dating platform where:
- Every user passes a liveness check to prove they're human
- No bots, fake profiles, or catfish
- $1 verification fee + $14.99/month for verified access
- Founding member spots locked at $14.99/mo forever
- Launch: April 4, 2026

Answer support questions about the product, pricing, or technical issues.
Be helpful, concise, and professional.
If you don't know, admit it and suggest contacting support@youandinotai.com"""

engine = SupportEngine(faq_store, support_db, ollama_client)

# ── REST API Server ────────────────────────────────────────────────────
async def api_server():
    """Simple REST API for support bot"""
    from aiohttp import web
    
    async def health(request):
        """Health check"""
        return web.json_response({"status": "ok", "service": "YouAndINotAI-Support"})
    
    async def ask(request):
        """Answer a support question"""
        try:
            data = await request.json()
            query = data.get("query", "").strip()
            
            if not query:
                return web.json_response({"error": "query required"}, status=400)
            
            result = await engine.answer(query)
            return web.json_response(result)
        
        except Exception as e:
            logger.error(f"❌ API error: {e}")
            return web.json_response({"error": str(e)}, status=500)
    
    async def status(request):
        """Get support stats"""
        stats = support_db.get_stats()
        return web.json_response(stats)
    
    # Setup routes
    app = web.Application()
    app.router.add_get("/health", health)
    app.router.add_post("/api/support/ask", ask)
    app.router.add_get("/api/support/status", status)
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    port = config["channels"]["api"]["port"]
    site = web.TCPSite(runner, "127.0.0.1", port)
    await site.start()
    
    logger.info(f"✅ API running on http://127.0.0.1:{port}")
    logger.info(f"   POST {config['channels']['api']['endpoints']['ask']}")
    logger.info(f"   GET  {config['channels']['api']['endpoints']['status']}")
    logger.info(f"   GET  {config['channels']['api']['endpoints']['health']}")
    
    # Keep running
    while True:
        await asyncio.sleep(1)

# ── Main ───────────────────────────────────────────────────────────────
async def main():
    logger.info("=" * 70)
    logger.info("🚀 YouAndINotAI Support Bot Starting")
    logger.info("=" * 70)
    logger.info(f"Location: D:\\support-claw\\")
    logger.info(f"Product:  {config['integration']['website_url']}")
    logger.info(f"LLM:      {config['llm']['provider']} ({config['llm']['model']})")
    logger.info(f"Host:     {config['llm']['host']}")
    logger.info(f"FAQs:     {len(faq_store.get_all())} loaded")
    logger.info(f"Database: {config['database']['path']}")
    logger.info("=" * 70)
    
    # Start API server
    await api_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("⏹️  Support bot stopped")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        sys.exit(1)
