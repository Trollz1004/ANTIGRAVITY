"""Rewrite post queue — short, punchy, not bot-sounding. Hashtags in comments."""
import json

queue = {
    "twitter": [
        {"text": "$1 to prove you're not a bot. 60 cents of that goes to kids hospitals. youandinotai.com #ForTheKids #YouAndINotAI"},
        {"text": "8 verification layers before you even see a profile. youandinotai.com #V8Cloud"},
        {"text": "100 founding spots. $14.99/mo locked forever. youandinotai.com #YouAndINotAI"},
        {"text": "Plaid verifies your bank. now it verifies your dating profile. youandinotai.com"},
        {"text": "60% of every dollar to Shriners Children's. not eventually. from dollar one. youandinotai.com #ForTheKids"},
        {"text": "april 4th. youandinotai.com"},
        {"text": "founding member rate locks forever. 100 spots. youandinotai.com"},
        {"text": "$5.6B industry and they still can't tell you if the person you're talking to is real. we can. youandinotai.com"},
        {"text": "ID check. liveness scan. plaid identity. device fingerprint. bank confirmation. address check. behavior analysis. human review. youandinotai.com #V8Cloud"},
        {"text": "not adding AI to dating. removing fake people from it. youandinotai.com #YouAndINotAI"},
        {"text": "60/30/10. shriners / infrastructure / founder. every dollar. on chain. youandinotai.com #ForTheKids"},
        {"text": "your bank trusts plaid. your dating app should too. youandinotai.com"},
        {"text": "real humans only. april 4. youandinotai.com"},
    ],
    "instagram": [
        {"text": "$1 to prove you're human. 60% to Shriners Children's.\n\n8 verification layers. zero bots.\n\n100 founding spots. $14.99/mo locked forever.\n\nyouandinotai.com"},
        {"text": "V8 Cloud:\nID check\nLiveness scan\nPlaid identity\nDevice fingerprint\nBank confirmation\nAddress check\nBehavior analysis\nHuman review\n\n8 layers. every profile.\n\nyouandinotai.com"},
        {"text": "april 4.\n100 spots.\n$14.99/mo forever.\n60% to kids hospitals.\n\nyouandinotai.com"},
    ],
    "reddit": [
        {"text": "Dating app launching April 4 — every user verified through Plaid (8 checkpoints). 60% of revenue to Shriners Children's Hospitals, smart contract enforced.\n\n100 founding spots at $14.99/mo locked forever.\n\nyouandinotai.com"},
        {"text": "Side project: dating app with Plaid identity verification (8 layers). 60% of revenue goes to Shriners Children's from day one.\n\nFastAPI + React + Stripe + Plaid. 100 founding spots. April 4.\n\nyouandinotai.com"},
    ],
    "facebook": [
        {"text": "YouAndINotAI launches April 4.\n\nEvery user Plaid-verified. 8 layers.\n100 founding spots at $14.99/mo locked forever.\n60% of every dollar to Shriners Children's.\n\nyouandinotai.com"},
    ],
    "linkedin": [
        {"text": "YouAndINotAI launches April 4. Every user verified through Plaid — same system your bank uses. 8 layers.\n\n60% of revenue to Shriners Children's Hospitals. Smart contract enforced.\n\n100 founding member spots at $14.99/mo.\n\nyouandinotai.com"},
    ],
    "threads": [
        {"text": "$1 proves you're human. 60 cents goes to kids hospitals. youandinotai.com"},
        {"text": "100 founding spots. $14.99/mo forever. april 4. youandinotai.com"},
        {"text": "plaid verifies your bank. now it verifies your dating profile. youandinotai.com"},
    ],
    "bluesky": [
        {"text": "every user plaid-verified. 8 layers. 60% to shriners children's. april 4. youandinotai.com"},
        {"text": "100 founding spots. $14.99/mo locked forever. youandinotai.com"},
        {"text": "60/30/10. shriners / infrastructure / founder. on chain. youandinotai.com"},
    ],
    "pinterest": [
        {"text": "V8 Cloud. 8 identity checks. Plaid-powered. YouAndINotAI. youandinotai.com"},
        {"text": "60% of every dollar to Shriners Children's. youandinotai.com"},
    ],
    "general": [
        {"text": "$1 proves you're human. 60% to Shriners Children's. 8 verification layers. youandinotai.com"},
        {"text": "100 founding spots. $14.99/mo forever. april 4. youandinotai.com"},
    ]
}

# Hashtag comments — posted as first reply to hack the algorithm
hashtag_comments = {
    "twitter": "#DatingApp #RealDating #NoBots #VerifiedDating #PlaidVerified #ShrinersChildrens #ForTheKids #V8Cloud #YouAndINotAI #TechForGood #DatingApps2026 #StartupLife #IndieHacker",
    "instagram": "#YouAndINotAI #DatingApp #RealDating #NoBots #VerifiedDating #PlaidVerified #ShrinersChildrens #ForTheKids #V8Cloud #TechForGood #DatingApps #RealConnections #LaunchDay #StartupLife #IndieHacker #DatingSafety #IdentityVerification #DateSafe #RealHumansOnly #DatingWithPurpose",
    "threads": "#YouAndINotAI #DatingApp #RealDating #NoBots #ForTheKids #V8Cloud",
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
