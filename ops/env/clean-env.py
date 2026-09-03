#!/usr/bin/env python3
"""Strip paste accidents out of .env without losing anything.

Backs up the file to %USERPROFILE%/.env-backups/<name>.<timestamp> (never
inside the repo), then:
  * keeps every KEY=VALUE line and every comment exactly as-is;
  * salvages recognisable secrets from stray lines into named keys instead of
    leaving them as loose text — nsec1… → BUZZ_DEVICE_PRIVATE_KEY (or dropped
    if it equals BUZZ_IDENTITY_KEY), 64-hex → BUZZ_DEVICE_PUBKEY_HEX;
  * optionally merges another env file's keys under a prefix (--merge PATH
    --prefix AO_), never overwriting;
  * drops the remaining stray lines.
Prints key names and counts only. Never a value.
"""
import argparse
import os
import re
import shutil
import time

KEY_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")
NSEC_RE = re.compile(r"\b(nsec1[a-z0-9]{50,})\b")
HEX64_RE = re.compile(r"\b([0-9a-f]{64})\b")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", default="C:/ANTIGRAVITY/.env")
    ap.add_argument("--merge", action="append", default=[])
    ap.add_argument("--prefix", default="AO_")
    args = ap.parse_args()

    bdir = os.path.join(os.path.expanduser("~"), ".env-backups")
    os.makedirs(bdir, exist_ok=True)
    bk = os.path.join(bdir, f"{os.path.basename(os.path.dirname(args.env)) or 'root'}.env.{time.strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(args.env, bk)
    print("backup:", bk)

    raw = open(args.env, encoding="utf-8-sig").read().splitlines()
    kept, values, stray = [], {}, []
    for line in raw:
        s = line.rstrip("\r")
        m = KEY_RE.match(s.strip())
        if not s.strip() or s.lstrip().startswith("#") or m:
            kept.append(s)
            if m:
                values[m.group(1)] = m.group(2).strip().strip('"').strip("'")
        else:
            stray.append(s)

    salvaged = []
    for s in stray:
        n = NSEC_RE.search(s)
        if n:
            if n.group(1) == values.get("BUZZ_IDENTITY_KEY"):
                print("  stray nsec == BUZZ_IDENTITY_KEY — duplicate, dropped")
            elif "BUZZ_DEVICE_PRIVATE_KEY" not in values:
                salvaged.append(("BUZZ_DEVICE_PRIVATE_KEY", n.group(1), "salvaged from a pasted Buzz identity dialog"))
                values["BUZZ_DEVICE_PRIVATE_KEY"] = n.group(1)
            continue
        h = HEX64_RE.search(s)
        if h and "BUZZ_DEVICE_PUBKEY_HEX" not in values:
            salvaged.append(("BUZZ_DEVICE_PUBKEY_HEX", h.group(1), "public key, hex form"))
            values["BUZZ_DEVICE_PUBKEY_HEX"] = h.group(1)

    merged = []
    for path in args.merge:
        if not os.path.exists(path):
            print(f"  merge source missing: {path}")
            continue
        for line in open(path, encoding="utf-8-sig"):
            m = KEY_RE.match(line.strip())
            if not m:
                continue
            k = args.prefix + m.group(1) if not m.group(1).startswith(args.prefix) else m.group(1)
            if k in values or not m.group(2).strip():
                continue
            merged.append((k, m.group(2).strip(), f"merged from {os.path.basename(path)}"))
            values[k] = m.group(2).strip()

    out = kept[:]
    if salvaged or merged:
        out.append("")
        out.append(f"# --- salvaged/merged by ops/env/clean-env.py {time.strftime('%Y-%m-%d')} ---")
        for k, v, c in salvaged + merged:
            out.append(f"# {c}")
            out.append(f"{k}={v}")
    open(args.env, "w", encoding="utf-8").write("\n".join(out).rstrip("\n") + "\n")
    print(f"kept {len(kept)} lines; dropped {len(stray)} stray lines; salvaged {[k for k,_,_ in salvaged]}; merged {[k for k,_,_ in merged]}")


if __name__ == "__main__":
    main()
