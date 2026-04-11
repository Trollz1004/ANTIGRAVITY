import asyncio
import os
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings
import httpx

async def main():
    settings = get_settings()
    token = settings.square_access_token
    async with httpx.AsyncClient() as client:
        # Check an alternative endpoint like locations to verify the access token
        res = await client.get(
            "https://connect.squareup.com/v2/locations",
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2024-02-22",
                "Content-Type": "application/json"
            }
        )
        print(f"Locations Status: {res.status_code}")
        
        if res.status_code == 200:
            print("Token works perfectly for /v2/locations")
            
if __name__ == '__main__':
    asyncio.run(main())
