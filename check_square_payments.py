import asyncio
import json
import os
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings
import httpx

async def main():
    settings = get_settings()
    token = settings.square_access_token
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            "https://connect.squareup.com/v2/payments",
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2026-01-22",
                "Content-Type": "application/json"
            }
        )
        data = res.json()
        payments = data.get("payments", [])
        print(f"Found {len(payments)} payments")
        if payments:
            latest = payments[0]
            print(json.dumps(latest, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
