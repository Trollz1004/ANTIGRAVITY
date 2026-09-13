#!/usr/bin/env python3
"""
AI Services Store — YouAndINotAI
Adds AI-powered services as purchasable products via Square checkout.
These services generate revenue to cover AI inference costs.
"""

import json
import sqlite3
import secrets
from datetime import datetime, timezone

DB_PATH = r"C:\ANTIGRAVITY\ops\growth-engine\growth.db"

AI_SERVICES = [
    {
        "id": "ai_headshots",
        "name": "AI Professional Headshots",
        "description": "Generate 10 professional profile photos using AI. Optimized for dating apps.",
        "price_cents": 999,
        "delivery": "Instant — generated via OmniRoute image API",
        "margin_cents": 849,
        "square_checkout_url": "https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/HEADSHOTS001"
    },
    {
        "id": "profile_optimization",
        "name": "AI Profile Optimization",
        "description": "AI analyzes your profile and rewrites it for maximum matches. Includes bio, prompts, and photo order.",
        "price_cents": 1499,
        "delivery": "Instant — delivered via email",
        "margin_cents": 1299,
        "square_checkout_url": "https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/PROFILE001"
    },
    {
        "id": "date_icebreakers",
        "name": "AI Date Icebreakers",
        "description": "5 personalized conversation starters based on your match's profile. Never run out of things to say.",
        "price_cents": 799,
        "delivery": "Instant — generated via OmniRoute chat API",
        "margin_cents": 699,
        "square_checkout_url": "https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/ICEBREAK001"
    },
    {
        "id": "ai_date_coach",
        "name": "AI Date Coach",
        "description": "Pre-date coaching + post-date analysis. Upload your chat and get personalized advice.",
        "price_cents": 2499,
        "delivery": "Instant — chat-based via app",
        "margin_cents": 2199,
        "square_checkout_url": "https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/COACH001"
    },
    {
        "id": "conversation_review",
        "name": "AI Conversation Review",
        "description": "AI reviews your dating app chats and suggests improvements. Learn what works.",
        "price_cents": 1299,
        "delivery": "Instant — analysis via OmniRoute",
        "margin_cents": 1119,
        "square_checkout_url": "https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/REVIEW001"
    }
]

def create_services_table():
    """Create the AI services table in growth.db."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price_cents INTEGER NOT NULL,
            delivery TEXT,
            margin_cents INTEGER,
            square_checkout_url TEXT,
            purchases INTEGER DEFAULT 0,
            revenue_cents INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    
    for service in AI_SERVICES:
        cursor.execute("""
            INSERT OR REPLACE INTO ai_services
            (id, name, description, price_cents, delivery, margin_cents, square_checkout_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            service["id"],
            service["name"],
            service["description"],
            service["price_cents"],
            service["delivery"],
            service["margin_cents"],
            service["square_checkout_url"],
            datetime.now(timezone.utc).isoformat()
        ))
    
    conn.commit()
    conn.close()
    print(f"Created/updated {len(AI_SERVICES)} AI services in growth.db")

def get_store_listings():
    """Get all AI services for the store page."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, description, price_cents, delivery, margin_cents, square_checkout_url, purchases, revenue_cents
        FROM ai_services ORDER BY price_cents
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    listings = []
    for row in rows:
        listings.append({
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "price": row[3] / 100,
            "price_cents": row[3],
            "delivery": row[4],
            "margin": row[5] / 100 if row[5] else 0,
            "square_checkout_url": row[6],
            "purchases": row[7],
            "revenue": row[8] / 100 if row[8] else 0
        })
    
    return listings

def generate_store_html():
    """Generate the AI services store page."""
    listings = get_store_listings()
    
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Dating Tools — YouAndINotAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
        .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
        h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
        .subtitle { color: #666; font-size: 1rem; margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .card { background: #111; border: 1px solid #222; border-radius: 1rem; padding: 1.5rem; transition: border-color 0.2s; }
        .card:hover { border-color: #a78bfa; }
        .card h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }
        .card p { color: #888; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5; }
        .card .price { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .card .delivery { font-size: 0.75rem; color: #4ade80; margin-bottom: 1rem; }
        .card .buy { display: block; text-align: center; background: #fff; color: #0a0a0a; padding: 0.75rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
        .card .buy:hover { background: #a78bfa; }
        .header { text-align: center; margin-bottom: 2rem; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>AI Dating Tools</h1>
        <p class="subtitle">Powered by AI. Instant delivery. Real results.</p>
    </div>
    <div class="grid">
"""
    
    for svc in listings:
        html += f"""
        <div class="card">
            <h3>{svc['name']}</h3>
            <p>{svc['description']}</p>
            <div class="price">${svc['price']:.2f}</div>
            <div class="delivery">{svc['delivery']}</div>
            <a href="{svc['square_checkout_url']}" class="buy">Buy Now</a>
        </div>
"""
    
    html += """
    </div>
</div>
</body>
</html>
"""
    
    return html

if __name__ == "__main__":
    create_services_table()
    
    listings = get_store_listings()
    print(f"\nAI Services Store — {len(listings)} products")
    print("=" * 50)
    for svc in listings:
        print(f"  {svc['name']}: ${svc['price']:.2f} (margin: ${svc['margin']:.2f})")
    
    html = generate_store_html()
    print(f"\nGenerated store page: {len(html)} bytes")
