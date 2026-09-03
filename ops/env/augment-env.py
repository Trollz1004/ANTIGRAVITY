#!/usr/bin/env python3
"""Add the non-secret configuration every agent keeps asking for to .env, pull the
one local secret that lives in a plugin file (Obsidian Local REST API key) in by
copy, and mirror the result to the DREAM Online repo.

Never prints a value. Only key names and CREATED/EXISTS/COPIED.

  python ops/env/augment-env.py                      # augment C:/ANTIGRAVITY/.env in place
  python ops/env/augment-env.py --mirror "D:/CLAUDE's-N-Joshua's-Dream-Online-MMORPG/.env"

Rules: existing keys are never overwritten; the file is appended, in labelled
blocks, so Joshua's own lines stay exactly where he wrote them. Stray non-KEY
lines (a pasted URL) are left alone and reported. Secrets we cannot mint
(Cloudflare, IONOS) are added as EMPTY placeholders so the name exists and the
NOT CONFIGURED state is visible instead of silent.
"""
import argparse
import json
import os
import re
import shutil
import sys
from datetime import date

KEY_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=")

# (key, value-or-None, comment). None => placeholder, left empty.
CONFIG = [
    ("# --- house (non-secret, added by ops/env/augment-env.py %s) ---" % date.today(), None, None),
    ("ANTIGRAVITY_ROOT", "C:/ANTIGRAVITY", "sole canonical working tree"),
    ("ANTIGRAVITY_ENV", "C:/ANTIGRAVITY/.env", "where ops/buzz/buzz-env.sh looks"),
    ("NODE_NAME", "SABRETOOTH", "hostname; 192.168.0.8 on the LAN — there is no T5500 node"),
    ("NODE_LAN_IP", "192.168.0.8", ""),
    ("PAPERCLIP_URL", "http://127.0.0.1:3100", "Mission Control; identity = GET /api/openapi.json info.title == 'Paperclip API'"),
    ("PAPERCLIP_COMPANY_ANT", "92223de0-b36b-4d63-93ca-50ebe5007e68", "ANTIGRAVITY Marketing Co"),
    ("PAPERCLIP_COMPANY_AIS", "74bbc177-bc32-4457-806e-fa6bbe6314fd", "Ai-Solutions.Store"),
    ("PAPERCLIP_COMPANY_YOU", "ffb4f83d-77ed-4446-a05a-d503c2714e9f", "YouAndiNotAi.com"),
    ("PAPERCLIP_COMPANY_DRE", "5782b1da-9c5d-49b9-8405-e40d7889f28d", "DREAM Online"),
    ("OPENAI_COMPAT_BASE_URL", "http://127.0.0.1:20128/api/v1", "OmniRoute; LAN 192.168.0.8:20128 needs the firewall rule first"),
    ("OMNIROUTE_LAN_BASE_URL", "http://192.168.0.8:20128/api/v1", ""),
    ("OMNIROUTE_DASHBOARD_URL", "http://127.0.0.1:20128/dashboard", ""),
    ("FABLES_SENTRY_URL", "http://192.168.0.8:9140", "identity = /health service 'fables-sentry'"),
    ("OBSIDIAN_REST_URL", "http://127.0.0.1:27123", "Local REST API plugin, vault C:/ANTIGRAVITY/Antigravity; HTTPS on 27124"),
    ("OBSIDIAN_VAULT_ANTIGRAVITY", "C:/ANTIGRAVITY/Antigravity", "Obsidian Sync vault, id 53f857bcd2883cf0"),
    ("OBSIDIAN_VAULT_DREAM", "D:/DREAM ONLINE", "id 7b53874578408f88"),
    ("BUZZ_RELAY_URL", "https://trollz1004-antigravity-repo.communities.buzz.xyz", "buzz.exe reads this; BUZZ_PRIVATE_KEY is set from BUZZ_IDENTITY_KEY by buzz-env.sh"),
    ("BUZZ_LEDGER_CHANNEL", "node-ledger", ""),
    ("BUZZ_AGENT_NAME", "claude-judge", "override per lane: hermes | openclaw | opencode | paperclip-ceo"),
    ("GITHUB_USER", "Trollz1004", ""),
    ("GITHUB_ORG", "Ai-Solutions-Store", ""),
    ("GITHUB_ORG_REPO", "Ai-Solutions-Store/ai-solutions", "consolidation target, private"),
    ("DREAM_REPO", "Trollz1004/dream-online", ""),
    ("DREAM_REPO_DIR", "D:/CLAUDE's-N-Joshua's-Dream-Online-MMORPG", ""),
    ("OPEN_COLLECTIVE_API_URL", "https://api.opencollective.com/graphql/v2", "send a User-Agent header or it 403s; auth header is Personal-Token"),
    ("OPEN_COLLECTIVE_ORG_SLUG", "until-no-kid-in-need", "Trash or Treasure Online Recycler LLC — fiscal host"),
    ("OPEN_COLLECTIVE_COLLECTIVE_SLUG", "dream-online", "https://opencollective.com/dream-online"),
    ("OPEN_COLLECTIVE_USER_SLUG", "untilnokidinneed", "the account the token authenticates as"),
    ("DOMAINS_DREAM", "dream-online.net,dream-online.info,dream-online.org,dream-online.store", "net is primary"),
    ("DOMAINS_MISSION", "untilnokidinneed.com,untilnokidinneed.online,untilnokidinneed.org,untilnokidinneed.store", "com is primary"),
    ("DOMAINS_AI", "ai-solutions.store,aidoesitall.info,aidoesitall.online,aidoesitall.store,aidoesitall.website", ""),
    ("DOMAINS_RECYCLE", "onlinerecycle.net", ""),
    ("# --- secrets we cannot mint here: fill in, then ops/paperclip/import-env-secrets.py ---", None, None),
    ("CLOUDFLARE_API_TOKEN", "", "Zone:Edit + DNS:Edit; needed by .github/workflows/cloudflare-add-zones.yml"),
    ("CLOUDFLARE_ACCOUNT_ID", "", "non-secret but unknown; dashboard → right sidebar"),
    ("IONOS_API_KEY", "", "prefix.secret from IONOS developer console; optional, nameservers can be set by hand"),
    ("OBSIDIAN_REST_API_KEY", None, "copied from the plugin's data.json by this script"),
]


def parse_keys(path):
    keys, stray = set(), []
    if not os.path.exists(path):
        return keys, stray
    with open(path, encoding="utf-8-sig") as fh:
        for line in fh:
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            m = KEY_RE.match(s)
            if m:
                keys.add(m.group(1))
            else:
                stray.append(s[:60])
    return keys, stray


def obsidian_key(vault):
    p = os.path.join(vault, ".obsidian", "plugins", "obsidian-local-rest-api", "data.json")
    try:
        return json.load(open(p, encoding="utf-8")).get("apiKey") or ""
    except Exception:
        return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", default="C:/ANTIGRAVITY/.env")
    ap.add_argument("--mirror", action="append", default=[], help="path to also write the full .env to")
    args = ap.parse_args()

    keys, stray = parse_keys(args.env)
    # Stray lines are NEVER printed: a paste accident can contain a key.
    print(f"{len(keys)} keys present; {len(stray)} stray non-KEY line(s)")
    if stray:
        print("  (stray lines left untouched here — run ops/env/clean-env.py to salvage and strip them)")

    lines = []
    for key, val, comment in CONFIG:
        if key.startswith("#"):
            lines.append(key)
            continue
        if key in keys:
            print(f"  EXISTS {key}")
            continue
        if key == "OBSIDIAN_REST_API_KEY":
            val = obsidian_key("C:/ANTIGRAVITY/Antigravity")
            print(f"  {'COPIED' if val else 'NOT FOUND'} {key} (from plugin data.json)")
        else:
            print(f"  {'CREATE' if val else 'PLACEHOLDER'} {key}")
        if comment:
            lines.append(f"# {comment}")
        lines.append(f"{key}={val or ''}")

    if lines:
        with open(args.env, "a", encoding="utf-8") as fh:
            fh.write("\n" + "\n".join(lines) + "\n")

    for m in args.mirror:
        os.makedirs(os.path.dirname(m), exist_ok=True)
        shutil.copyfile(args.env, m)
        print(f"MIRRORED -> {m}")


if __name__ == "__main__":
    main()
