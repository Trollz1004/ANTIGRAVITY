"""Rewrite post queue — short, punchy, not bot-sounding. Hashtags in comments."""
import json

queue = {
    "twitter": [
        {"text": "$1 to prove you're not a bot. Real identity checks before you ever see a profile. youandinotai.com #YouAndINotAI #RealPeopleOnly"},
        {"text": "8 verification layers before you even see a profile. youandinotai.com #V8Cloud"},
        {"text": "100 founding spots. $14.99/mo locked forever. youandinotai.com #YouAndINotAI"},
        {"text": "Plaid verifies your bank. now it verifies your dating profile. youandinotai.com"},
        {"text": "Most apps optimize for more swipes. we're optimizing for real people. youandinotai.com #YouAndINotAI"},
        {"text": "april 4th. youandinotai.com"},
        {"text": "founding member rate locks forever. 100 spots. youandinotai.com"},
        {"text": "$5.6B industry and they still can't tell you if the person you're talking to is real. we can. youandinotai.com"},
        {"text": "ID check. liveness scan. plaid identity. device fingerprint. bank confirmation. address check. behavior analysis. human review. youandinotai.com #V8Cloud"},
        {"text": "not adding AI to dating. removing fake people from it. youandinotai.com #YouAndINotAI"},
        {"text": "real humans only. verified first. conversation second. youandinotai.com #YouAndINotAI"},
        {"text": "your bank trusts plaid. your dating app should too. youandinotai.com"},
        {"text": "real humans only. april 4. youandinotai.com"},
    ],
    "instagram": [
        {"text": "$1 to prove you're human.\n\n8 verification layers. zero bot farm energy.\n\n100 founding spots. $14.99/mo locked forever.\n\nyouandinotai.com"},
        {"text": "V8 Cloud:\nID check\nLiveness scan\nPlaid identity\nDevice fingerprint\nBank confirmation\nAddress check\nBehavior analysis\nHuman review\n\n8 layers. every profile.\n\nyouandinotai.com"},
        {"text": "april 4.\n100 spots.\n$14.99/mo forever.\nreal people only.\n\nyouandinotai.com"},
    ],
    "reddit": [
        {"text": "Dating app launching April 4 — every user verified through Plaid-style identity checks before they join. 100 founding spots at $14.99/mo locked forever.\n\nyouandinotai.com"},
        {"text": "Side project: dating app with Plaid identity verification and 8-layer trust checks.\n\nFastAPI + React + Square + Plaid. 100 founding spots. April 4.\n\nyouandinotai.com"},
    ],
    "facebook": [
        {"text": "YouAndINotAI launches April 4.\n\nEvery user is verified before they join. 8 layers.\n100 founding spots at $14.99/mo locked forever.\n\nyouandinotai.com"},
    ],
    "linkedin": [
        {"text": "YouAndINotAI launches April 4. Every user is verified through the same identity rails people already trust in finance.\n\n8 layers. Fewer fake profiles. 100 founding member spots at $14.99/mo.\n\nyouandinotai.com"},
    ],
    "threads": [
        {"text": "$1 proves you're human. then the app gets out of the way and lets real people talk. youandinotai.com"},
        {"text": "100 founding spots. $14.99/mo forever. april 4. youandinotai.com"},
        {"text": "plaid verifies your bank. now it verifies your dating profile. youandinotai.com"},
    ],
    "bluesky": [
        {"text": "every user plaid-verified. 8 layers. april 4. youandinotai.com"},
        {"text": "100 founding spots. $14.99/mo locked forever. youandinotai.com"},
        {"text": "real humans only. verified first. april 4. youandinotai.com"},
    ],
    "pinterest": [
        {"text": "V8 Cloud. 8 identity checks. Plaid-powered. YouAndINotAI. youandinotai.com"},
        {"text": "real people only. identity-first dating. youandinotai.com"},
    ],
    "general": [
        {"text": "$1 proves you're human. 8 verification layers. real people only. youandinotai.com"},
        {"text": "100 founding spots. $14.99/mo forever. april 4. youandinotai.com"},
    ]
}

# Hashtag comments — posted as first reply to hack the algorithm
hashtag_comments = {
    "twitter": "#DatingApp #RealDating #NoBots #VerifiedDating #PlaidVerified #V8Cloud #YouAndINotAI #TechForGood #DatingApps2026 #StartupLife #IndieHacker",
    "instagram": "#YouAndINotAI #DatingApp #RealDating #NoBots #VerifiedDating #PlaidVerified #V8Cloud #TechForGood #DatingApps #RealConnections #LaunchDay #StartupLife #IndieHacker #DatingSafety #IdentityVerification #DateSafe #RealHumansOnly #DatingWithPurpose",
    "threads": "#YouAndINotAI #DatingApp #RealDating #NoBots #V8Cloud",
}

with open("data/post-queue.json", "w", encoding="utf-8") as f:
    json.dump(queue, f, indent=2, ensure_ascii=False)

with open("data/hashtag-comments.json", "w", encoding="utf-8") as f:
    json.dump(hashtag_comments, f, indent=2, ensure_ascii=False)

total = sum(len(v) for v in queue.values())
print(f"Queue: {total} posts (short/punchy)")
print(f"Hashtag comments saved for algorithm hacking")
for p, posts in queue.items():
    print(f"  {p}: {len(posts)}")
