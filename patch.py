import sys

with open('C:/ANTIGRAVITY/youandinotai-api/app/routers/webhooks.py', 'r') as f:
    code = f.read()

target = '''    if should_verify:
        _verify_square_signature(
            payload,
            square_signature,
            signature_key=signature_key,
            notification_url=notification_url,
            request_url=str(request.url).split("?", 1)[0],
        )'''

replacement = '''    if should_verify:
        try:
            _verify_square_signature(
                payload,
                square_signature,
                signature_key=signature_key,
                notification_url=notification_url,
                request_url=str(request.url).split("?", 1)[0],
            )
        except HTTPException as exc:
            import json, hashlib
            try:
                payload_json = json.loads(payload.decode("utf-8"))
            except Exception:
                payload_json = {"raw_payload": payload.decode("utf-8", errors="replace")}
            event_id = f"sigfail-{hashlib.sha256(payload).hexdigest()[:15]}"
            
            await create_webhook_event(
                db,
                event_id=event_id,
                event_type="verification_failed",
                payload={"error": str(exc.detail), "url": str(request.url), "headers": dict(request.headers), "payload": payload_json},
                processed=True,
                event_source="square",
            )
            await db.commit()
            raise exc'''

if target in code:
    code = code.replace(target, replacement, 1) # Only replace the first occurrence
    with open('C:/ANTIGRAVITY/youandinotai-api/app/routers/webhooks.py', 'w') as f:
        f.write(code)
    print("Patched.")
else:
    print("Target not found.")

