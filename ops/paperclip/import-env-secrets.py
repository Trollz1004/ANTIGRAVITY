#!/usr/bin/env python3
"""Import KEY=VALUE pairs from a .env file into Paperclip company secrets.

Values never touch stdout. Only key names and the HTTP outcome are printed.

Usage:
  python ops/paperclip/import-env-secrets.py --env C:/ANTIGRAVITY/.env --company <uuid> [--company <uuid> ...]
  python ops/paperclip/import-env-secrets.py --env .env --company <uuid> --dry-run

Idempotent: a key that already exists in the company (matched on `key`, then on
`name`) is skipped, never overwritten. Use --update to PATCH nothing — Paperclip
has no value-update route on PATCH /api/secrets/{id}; rotate via
POST /api/secrets/{id}/rotate instead, which this script does with --rotate.

Doctrine: secrets are never echoed, never written to repo files, never placed in
a Paperclip *config row* — they go into the encrypted secret store only.
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:3100"
KEY_RE = re.compile(r"^[a-zA-Z0-9_.-]+$")


def read_env(path):
    out = {}
    with open(path, encoding="utf-8-sig") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                v = v[1:-1]
            if k and v:
                out[k] = v
    return out


def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            txt = r.read().decode()
            return r.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, {"raw": txt[:200]}


def verify_identity():
    st, d = api("GET", "/api/openapi.json")
    title = (d or {}).get("info", {}).get("title") if isinstance(d, dict) else None
    if st != 200 or title != "Paperclip API":
        print(f"WRONG SERVICE or DOWN at {BASE}: status={st} title={title!r}")
        sys.exit(2)


def existing(company):
    st, d = api("GET", f"/api/companies/{company}/secrets")
    if st != 200:
        print(f"  cannot list secrets for {company}: HTTP {st} {d}")
        sys.exit(2)
    rows = d if isinstance(d, list) else d.get("secrets", [])
    by_key = {r.get("key"): r for r in rows if r.get("key")}
    by_name = {r.get("name"): r for r in rows if r.get("name")}
    return by_key, by_name


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", required=True)
    ap.add_argument("--company", action="append", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--rotate", action="store_true", help="rotate value for keys that already exist")
    ap.add_argument("--description", default="Imported from .env by ops/paperclip/import-env-secrets.py")
    args = ap.parse_args()

    verify_identity()
    env = read_env(args.env)
    print(f"{len(env)} keys in {args.env}: {' '.join(sorted(env))}")

    for company in args.company:
        print(f"\ncompany {company}")
        by_key, by_name = existing(company)
        for k in sorted(env):
            if not KEY_RE.match(k):
                print(f"  SKIP  {k}: not a valid Paperclip key")
                continue
            row = by_key.get(k) or by_name.get(k)
            if row and not args.rotate:
                print(f"  EXISTS {k} (id {row.get('id')})")
                continue
            if args.dry_run:
                print(f"  WOULD {'ROTATE' if row else 'CREATE'} {k}")
                continue
            if row:
                st, d = api("POST", f"/api/secrets/{row['id']}/rotate", {"value": env[k]})
                print(f"  ROTATE {k}: HTTP {st}" + ("" if st < 300 else f" {json.dumps(d)[:160]}"))
            else:
                body = {
                    "name": k,
                    "key": k,
                    "provider": "local_encrypted",
                    "managedMode": "paperclip_managed",
                    "value": env[k],
                    "description": args.description,
                }
                st, d = api("POST", f"/api/companies/{company}/secrets", body)
                sid = d.get("id") if isinstance(d, dict) else None
                print(f"  CREATE {k}: HTTP {st}" + (f" id {sid}" if sid else f" {json.dumps(d)[:160]}"))


if __name__ == "__main__":
    main()
