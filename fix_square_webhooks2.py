import asyncio
import httpx
import json

async def main():
    token = "EAAAl2YFWNK4FRsKmfPfQ1br-mJUNi7RvfUWqJHnnulDtIecKeQoQqTR4ISjyT5i"
    
    async with httpx.AsyncClient() as client:
        # Step 1: Get subscriptions
        print("Fetching subscriptions with 2025-07-16...")
        res = await client.get(
            "https://connect.squareup.com/v2/webhooks/subscriptions",
            params={"include_disabled": "true"},
            headers={
                "Authorization": f"Bearer {token}",
                "Square-Version": "2025-07-16",
                "Content-Type": "application/json"
            }
        )
        
        print(f"Fetch Status: {res.status_code}")
        if res.status_code != 200:
            print(res.text)
            
        data = res.json()
        print(data)

if __name__ == '__main__':
    asyncio.run(main())
