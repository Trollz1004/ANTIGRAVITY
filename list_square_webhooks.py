import asyncio
from square.client import Client
import os
import sys

sys.path.insert(0, "C:/ANTIGRAVITY/youandinotai-api")
from app.config import get_settings

def main():
    settings = get_settings()
    token = settings.square_access_token
    client = Client(
        access_token=token,
        environment='production'
    )
    
    result = client.webhook_subscriptions.list_webhook_subscriptions()

    if result.is_success():
        print(result.body)
    elif result.is_error():
        print(f"Error: {result.errors}")

if __name__ == '__main__':
    main()
