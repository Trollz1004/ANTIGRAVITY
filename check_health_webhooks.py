import asyncio
import os
import sys
import httpx
import json

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.get("https://api.youandinotai.com/api/v1/health/webhooks")
        print(f"Status: {res.status_code}")
        try:
            print(json.dumps(res.json(), indent=2))
        except:
            print(res.text)

if __name__ == '__main__':
    asyncio.run(main())
