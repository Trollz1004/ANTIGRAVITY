"""
Content Variations Generator — Task 5
Generates 15 variations (5 each) of the 3 strongest templates.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'assets'))
from generate_all_assets import (
    generate_instagram_post, generate_fingerprint_logo,
    SOCIAL_DIR, Image
)
from pathlib import Path

VARIATIONS_DIR = SOCIAL_DIR / "variations"
VARIATIONS_DIR.mkdir(parents=True, exist_ok=True)

logo = generate_fingerprint_logo(256)

# 5 variations of ig-feed-01-launch
launch_variations = [
    {"id": "launch-v1", "headline": "FOUNDING\nMEMBER", "subhead": "$14.99/MO FOREVER", "body": "Lock in the lowest price ever.\nOnly 100 spots. Act now.", "accent": "🚀"},
    {"id": "launch-v2", "headline": "GET IN\nEARLY", "subhead": "FOUNDING PRICE: $14.99", "body": "100 spots. Price goes up after.\nV8 Cloud verified humans only.", "accent": "🔥"},
    {"id": "launch-v3", "headline": "WE'RE\nLIVE", "subhead": "YOUANDINOTAI IS HERE", "body": "$14.99/mo for founding members.\nEvery profile verified. Zero bots.", "accent": "⚡"},
    {"id": "launch-v4", "headline": "DAY ONE\nACCESS", "subhead": "BE A FOUNDING MEMBER", "body": "Lock in $14.99/mo forever.\nThe future of dating starts now.", "accent": "🎯"},
    {"id": "launch-v5", "headline": "LAUNCH\nDAY", "subhead": "100 FOUNDING SPOTS", "body": "$14.99/mo — never goes up.\nPlaid-verified. Bot-free. Real.", "accent": "💥"},
]

# 5 variations of ig-feed-05-verification
verification_variations = [
    {"id": "verify-v1", "headline": "8 LAYERS\nOF PROOF", "subhead": "V8 CLOUD VERIFICATION", "body": "ID check • Liveness scan\nPlaid identity • Device verify\nBank confirm • Address check\nBehavior analysis • Human confirm", "accent": "🔐"},
    {"id": "verify-v2", "headline": "PLAID\nVERIFIED", "subhead": "BANK-GRADE TRUST", "body": "The same system your bank uses\nto verify your identity.\nNow for dating.", "accent": "🏦"},
    {"id": "verify-v3", "headline": "NOT JUST\nVERIFIED", "subhead": "IDENTITY CONFIRMED", "body": "Email verification is a joke.\nWe verify your actual identity.\n8 layers. Plaid-powered.", "accent": "✅"},
    {"id": "verify-v4", "headline": "ZERO\nBOTS", "subhead": "V8 CLOUD GUARANTEE", "body": "Every profile passes 8 checks.\nEvery human confirmed via Plaid.\nNo exceptions. Ever.", "accent": "🛡️"},
    {"id": "verify-v5", "headline": "REAL-TIME\nSCANNING", "subhead": "ALWAYS WATCHING", "body": "V8 Cloud monitors continuously.\nIf a bot tries to sneak in,\nwe catch it. Instantly.", "accent": "👁️"},
]

# 5 variations of ig-feed-06-urgency
urgency_variations = [
    {"id": "urgency-v1", "headline": "SPOTS\nFILLING", "subhead": "FOUNDING MEMBERS", "body": "$14.99/mo locked FOREVER.\nWhen they're gone, price goes up.\nNo second chances.", "accent": "⏰"},
    {"id": "urgency-v2", "headline": "LAST\nCALL", "subhead": "FOUNDING MEMBER PRICE", "body": "100 total. That's it.\n$14.99/mo locked forever.\nDon't watch from the sidelines.", "accent": "📢"},
    {"id": "urgency-v3", "headline": "TICK\nTOCK", "subhead": "SPOTS DISAPPEARING", "body": "Founding members pay $14.99/mo.\nEveryone else pays more.\nForever.", "accent": "⏳"},
    {"id": "urgency-v4", "headline": "NOW OR\nNEVER", "subhead": "$14.99/MO FOREVER", "body": "This price won't come back.\n100 founding spots.\nLock yours in NOW.", "accent": "🔒"},
    {"id": "urgency-v5", "headline": "DON'T\nSLEEP\nON THIS", "subhead": "FOUNDING MEMBER", "body": "$14.99/mo. Forever pricing.\n100 spots total.\nyouandinotai.com", "accent": "💤"},
]

all_variations = launch_variations + verification_variations + urgency_variations
generated = []

print("🎨 Generating 15 content variations...")
for i, tmpl in enumerate(all_variations):
    path = generate_instagram_post(tmpl, i, logo)
    # Move to variations dir
    src = Path(path)
    dst = VARIATIONS_DIR / f"variation-{i+1:02d}-{tmpl['id']}.png"
    src.rename(dst)
    generated.append(str(dst))
    print(f"  ✅ {dst.name}")

print(f"\n✅ {len(generated)} variations generated in {VARIATIONS_DIR}")
