import asyncio
import httpx
import json
import os

async def main():
    token = os.environ.get("SQUARE_ACCESS_TOKEN", "")
    if not token:
        raise RuntimeError("SQUARE_ACCESS_TOKEN must be set in the environment.")
    
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://connect.squareup.com/v2/merchants/me",
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-02-22",
                "Content-Type": "application/json"
            }
        )
        print(f"Merchant Status: {res.status_code}")
        print(res.text)

if __name__ == '__main__':
    asyncio.run(main())
