import sys

with open('C:/ANTIGRAVITY/youandinotai-api/app/routers/webhooks.py', 'r') as f:
    code = f.read()

target = '''    # Process based on event type
    if event_type == "payment.completed":
        payment_status = str(payment_obj.get("status") or "").upper()
        if payment_status == "COMPLETED":'''

replacement = '''    # Process based on event type
    if event_type in ("payment.created", "payment.updated"):
        payment_status = str(payment_obj.get("status") or "").upper()
        if payment_status == "COMPLETED":'''

if target in code:
    code = code.replace(target, replacement, 1)
    with open('C:/ANTIGRAVITY/youandinotai-api/app/routers/webhooks.py', 'w') as f:
        f.write(code)
    print("Patched.")
else:
    print("Target not found.")

