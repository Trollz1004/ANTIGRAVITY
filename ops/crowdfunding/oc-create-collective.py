#!/usr/bin/env python3
"""Create the DREAM Online collective (and tiers) on Open Collective, GraphQL v2.

DRY-RUN BY DEFAULT. Pass --apply to send mutations.

Needs OPENCOLLECTIVE_TOKEN in the environment (a personal token from
Dashboard -> Settings -> For developers). Load it at runtime, never paste it:

  set -a; . <(grep '^OPENCOLLECTIVE_TOKEN=' C:/ANTIGRAVITY/.env); set +a
  python ops/crowdfunding/oc-create-collective.py            # plan only
  python ops/crowdfunding/oc-create-collective.py --apply    # create

The token is never printed. Responses are printed with any token-like field
stripped. See OPEN-COLLECTIVE-DREAM-ONLINE.md for why the LLC organization must
be a fiscal host first (shape A) — this script assumes that host exists and is
identified by --host-slug.
"""
import argparse
import json
import os
import sys
import urllib.request

API = "https://api.opencollective.com/graphql/v2"

TIERS = [
    {"name": "Backer", "description": "Name in the credits and dev-log access.", "amountType": "FLEXIBLE", "interval": "flexible", "minimumAmount": 500},
    {"name": "Founder", "description": "Backer, plus the founding-player badge at launch.", "amountType": "FIXED", "interval": "onetime", "amount": 2500},
    {"name": "Guild", "description": "Five Founder seats and a named guild hall at launch. Limited.", "amountType": "FIXED", "interval": "onetime", "amount": 10000, "maxQuantity": 50},
    {"name": "Sponsor", "description": "Logo on dream-online.net and an in-game billboard.", "amountType": "FIXED", "interval": "month", "amount": 10000},
]


def gql(query, variables, token=None):
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Content-Type": "application/json", **({"Personal-Token": token} if token else {})},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", default="dream-online")
    ap.add_argument("--name", default="DREAM Online")
    ap.add_argument("--host-slug", default="until-no-kid-in-need")
    ap.add_argument("--description", default="An open-world MMORPG built in the open. Backers fund development; a share of the family of platforms supports kids in need.")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    token = os.environ.get("OPENCOLLECTIVE_TOKEN")
    if not token:
        print("NOT CONFIGURED: OPENCOLLECTIVE_TOKEN is not in the environment. Mint one in the OC dashboard, add to .env, then import into Paperclip.")
        if args.apply:
            sys.exit(2)

    # Pre-flight (public): does the slug already exist? is the host a host?
    pre = gql(
        "query($s:String!,$h:String!){ taken: account(slug:$s){ id slug type } host: account(slug:$h){ id slug type isActive ... on Organization { isHost } } }",
        {"s": args.slug, "h": args.host_slug},
    )
    data = pre.get("data") or {}
    taken = data.get("taken")
    host = data.get("host")
    print("slug taken:", bool(taken), "| host:", json.dumps(host))
    if taken:
        print(f"'{args.slug}' already exists — nothing to create.")
        return
    if not host or not host.get("isHost"):
        print(f"BLOCKED: '{args.host_slug}' is not a fiscal host yet (isHost={host and host.get('isHost')}). Activate hosting in the OC dashboard first (shape A in the plan).")
        if args.apply:
            sys.exit(3)

    plan = {
        "createCollective": {"collective": {"name": args.name, "slug": args.slug, "description": args.description, "tags": ["gaming", "mmorpg", "open-source"]}, "host": {"slug": args.host_slug}},
        "tiers": TIERS,
    }
    print("PLAN:", json.dumps(plan, indent=1))
    if not args.apply:
        print("dry-run only. Re-run with --apply to create.")
        return

    res = gql(
        "mutation($c:CollectiveCreateInput!,$h:AccountReferenceInput){ createCollective(collective:$c, host:$h){ id slug name } }",
        {"c": plan["createCollective"]["collective"], "h": plan["createCollective"]["host"]},
        token,
    )
    print("createCollective:", json.dumps(res)[:600])
    slug = ((res.get("data") or {}).get("createCollective") or {}).get("slug")
    if not slug:
        sys.exit(4)
    for t in TIERS:
        tier = {"name": t["name"], "description": t["description"], "amountType": t["amountType"], "interval": t["interval"].upper() if t["interval"] != "flexible" else "FLEXIBLE", "type": "TIER"}
        if "amount" in t:
            tier["amount"] = {"valueInCents": t["amount"], "currency": "USD"}
        if "minimumAmount" in t:
            tier["minimumAmount"] = {"valueInCents": t["minimumAmount"], "currency": "USD"}
        if "maxQuantity" in t:
            tier["maxQuantity"] = t["maxQuantity"]
        r = gql("mutation($t:TierCreateInput!,$a:AccountReferenceInput!){ createTier(tier:$t, account:$a){ id name } }", {"t": tier, "a": {"slug": slug}}, token)
        print("createTier", t["name"], ":", json.dumps(r)[:300])
    print(f"done: https://opencollective.com/{slug}")


if __name__ == "__main__":
    main()
