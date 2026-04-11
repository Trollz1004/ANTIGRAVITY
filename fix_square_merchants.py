import asyncio
import httpx
import json

async def main():
    token = "EAAAl2YFWNK4FRsKmfPfQ1br-mJUNi7RvfUWqJHnnulDtIecKeQoQqTR4ISjyT5i"
    
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
