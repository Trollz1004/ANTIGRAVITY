#!/usr/bin/env python3
"""Replace ghost ***1761 OpenRouter key in ~/.hermes/auth.json with the valid key from ~/.hermes/.env."""
import json
import re
import os
from pathlib import Path

home = Path.home()
env_file = home / ".hermes" / ".env"
auth_file = home / ".hermes" / "auth.json"

good_key = None
for line in env_file.read_text().splitlines():
    m = re.match(r"^OPENROUTER_API_KEY=(.+)$", line.strip())
    if m:
        good_key = m.group(1).strip().strip('"').strip("'")
        break
assert good_key and good_key.startswith("sk-or-v1-"), f"bad key: {good_key!r}"
print(f"Loaded key tail: ***{good_key[-4:]}, len={len(good_key)}")

auth = json.loads(auth_file.read_text())
pool = auth["credential_pool"]["openrouter"]
print(f"Before: {len(pool)} openrouter slots")
for s in pool:
    tok = s.get("access_token", "") or ""
    tail = "***" + tok[-4:] if tok else ""
    print(f"  - id={s['id']} label={s['label']!r} tail={tail} len={len(tok)}")

new_pool = []
for slot in pool:
    tok = slot.get("access_token", "") or ""
    if slot["label"] == "api-key-3" and (len(tok) < 20 or tok.startswith("0[")):
        print(f"  DROP slot id={slot['id']} label={slot['label']!r} (corrupted)")
        continue
    if tok.endswith("1761"):
        print(f"  FIX  slot id={slot['id']} label={slot['label']!r} ***1761 -> ***{good_key[-4:]}")
        slot["access_token"] = good_key
        slot["last_status"] = "ok"
        slot["last_error_code"] = None
        slot["last_error_message"] = None
        slot["last_error_reset_at"] = None
    new_pool.append(slot)

auth["credential_pool"]["openrouter"] = new_pool
print(f"After:  {len(new_pool)} openrouter slots")

auth_file.write_text(json.dumps(auth, indent=2))
os.chmod(auth_file, 0o600)
print(f"WROTE {auth_file}")
