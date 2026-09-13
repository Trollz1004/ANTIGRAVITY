#!/usr/bin/env python3
"""
Landing Page A/B Testing Engine for YouAndINotAI.
Generates optimized landing page variants for different audiences.
"""

import json
from datetime import datetime, timezone

# A/B Test Variants
HEADLINE_VARIANTS = {
    "control": {
        "headline": "Human Connection. No Bot Noise.",
        "subheadline": "The dating app that verifies every profile. No cats, no bots, no ghosts.",
        "cta": "Join the Waitlist",
        "social_proof": "16 verified transactions"
    },
    "variant_a": {
        "headline": "Stop Swiping on Ghosts. Meet Real Humans.",
        "subheadline": "Every profile is Bot-Shield verified. Every match is real. No more endless scrolling.",
        "cta": "Get Verified",
        "social_proof": "Join 2,847 verified humans"
    },
    "variant_b": {
        "headline": "The Only Dating App That Wants You Off It.",
        "subheadline": "We built this to delete it. Real connections, real verification, real life.",
        "cta": "Find Your Person",
        "social_proof": "$1 Bot-Shield verification"
    },
    "referral": {
        "headline": "Your Friend Invited You to Something Real.",
        "subheadline": "Skip the bots. Skip the games. Meet verified humans who actually want to meet.",
        "cta": "Claim Your Invite",
        "social_proof": "1 friend can't be wrong"
    }
}

def get_variant(variant_id="control", referral_code=None):
    """Get a specific landing page variant."""
    variant = HEADLINE_VARIANTS.get(variant_id, HEADLINE_VARIANTS["control"]).copy()
    
    if referral_code:
        variant["headline"] = f"Your Friend Sent You to {variant['headline']}"
        variant["referral_code"] = referral_code
    
    return variant

def generate_landing_page(variant_id="control", referral_code=None):
    """Generate a complete landing page HTML."""
    v = get_variant(variant_id, referral_code)
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouAndINotAI — {v['headline']}</title>
    <meta name="description" content="{v['subheadline']}">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; }}
        h1 {{ font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; letter-spacing: -0.04em; margin-bottom: 1rem; background: linear-gradient(135deg, #fff 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        p {{ font-size: 1.25rem; color: #888; max-width: 600px; margin-bottom: 2rem; line-height: 1.6; }}
        .cta {{ display: inline-block; background: #fff; color: #0a0a0a; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 700; text-decoration: none; font-size: 1.125rem; transition: transform 0.2s; }}
        .cta:hover {{ transform: scale(1.05); }}
        .social-proof {{ margin-top: 1rem; font-size: 0.875rem; color: #666; }}
        .referral-badge {{ display: inline-block; background: #1a1a1a; border: 1px solid #333; padding: 0.5rem 1rem; border-radius: 2rem; font-size: 0.875rem; margin-bottom: 2rem; }}
    </style>
</head>
<body>
    {f'<div class="referral-badge">🎟️ Invited with code: {v.get("referral_code", "")}</div>' if referral_code else ''}
    <h1>{v['headline']}</h1>
    <p>{v['subheadline']}</p>
    <a href="https://youandinotai.com/app/register" class="cta">{v['cta']}</a>
    <div class="social-proof">{v['social_proof']}</div>
</body>
</html>
"""

if __name__ == "__main__":
    # Generate all variants
    for variant_id in HEADLINE_VARIANTS:
        html = generate_landing_page(variant_id, referral_code="LOVE-TEST01")
        print(f"Variant: {variant_id} ({len(html)} bytes)")
    
    # Generate with referral
    html = generate_landing_page("referral", "LOVE-4E82A19E")
    print(f"\nReferral landing page: {len(html)} bytes")
