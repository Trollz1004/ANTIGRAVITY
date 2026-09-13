#!/usr/bin/env python3
"""
Referral Link Generator for YouAndINotAI.
Generates shareable referral links with LOVE-XXXXXXXX codes.
"""

import json
import sqlite3
import secrets
from datetime import datetime, timezone

DB_PATH = r"C:\ANTIGRAVITY\ops\growth-engine\growth.db"

def generate_referral_code():
    """Generate a unique referral code like LOVE-XXXXXXXX."""
    return f"LOVE-{secrets.token_hex(4).upper()}"

def create_referral_link(email, base_url="https://youandinotai.com"):
    """Create a shareable referral link for a user."""
    code = generate_referral_code()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Ensure tables exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS referral_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL,
            uses INTEGER DEFAULT 0,
            conversions INTEGER DEFAULT 0
        )
    """)
    
    cursor.execute("""
        INSERT INTO referral_codes (code, email, created_at)
        VALUES (?, ?, ?)
    """, (code, email, datetime.now(timezone.utc).isoformat()))
    
    conn.commit()
    conn.close()
    
    return {
        "email": email,
        "referral_code": code,
        "referral_link": f"{base_url}/?ref={code}",
        "share_text": f"Join me on YouAndINotAI — the dating app that wants you off it. Use my code {code} for a free Bot-Shield verification! {base_url}/?ref={code}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

def get_referral_stats(email):
    """Get referral statistics for a user."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT code, uses, conversions FROM referral_codes
        WHERE email = ?
    """, (email,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [{"code": r[0], "uses": r[1], "conversions": r[2]} for r in rows]

if __name__ == "__main__":
    # Generate a test referral link
    result = create_referral_link("referral.test@youandinotai.com")
    print(json.dumps(result, indent=2))
