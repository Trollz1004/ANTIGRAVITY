import asyncio
import os
from square.environment import SquareEnvironment
from square import Square
import uuid

def main():
    token = os.environ.get("SQUARE_ACCESS_TOKEN", "")
    if not token:
        raise RuntimeError("SQUARE_ACCESS_TOKEN must be set in the environment.")
    
    client = Square(
        token=token,
        environment=SquareEnvironment.PRODUCTION
    )
    
    print("Calling list_webhook_subscriptions...")
    result = client.webhooks.subscriptions.list(include_disabled=True)
    
    if hasattr(result, 'is_success') and result.is_success():
        body = result.body
        subscriptions = body.get('subscriptions', [])
        print(f"Found {len(subscriptions)} subscriptions.")
        for sub in subscriptions:
            sub_id = sub['id']
            print(f"Deleting {sub_id}...")
            client.webhooks.subscriptions.delete(subscription_id=sub_id)
        
        # Create new one
        print("Creating new subscription...")
        body = {
            "idempotency_key": str(uuid.uuid4()),
            "subscription": {
                "name": "Bot-Shield Webhook Handler",
                "event_types": [
                    "payment.created",
                    "payment.updated",
                    "subscription.created",
                    "subscription.updated"
                ],
                "notification_url": "https://api.youandinotai.com/api/v1/webhooks/square-payment",
                "api_version": "2024-02-22"
            }
        }
        create_result = client.webhooks.subscriptions.create(body=body)
        if create_result.is_success():
            sub = create_result.body['subscription']
            print("\nSUCCESS! New Webhook created.")
            print(f"Signature Key: {sub['signature_key']}")
        else:
            print("Failed to create:")
            print(create_result.errors)
            
    elif hasattr(result, 'is_error') and result.is_error():
        print("Error:")
        print(result.errors)
    else:
        print(result)

if __name__ == '__main__':
    main()
