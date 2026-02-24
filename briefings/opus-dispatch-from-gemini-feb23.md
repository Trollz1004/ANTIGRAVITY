# 🚨 EMERGENCY OPUS DISPATCH — MOBILE + SIGNUP FIX
# Paste into Claude Code CLI NOW. 1k visits/hr, ZERO signups.

Resume session. T5500, C:\OPUSONLY. THIS IS URGENT.

## THE PROBLEM
youandinotai.com is getting 1,000+ visits per hour RIGHT NOW. Nobody can sign up because:
1. Site is NOT mobile responsive — broken on phones
2. There is NO visible signup/pre-order CTA above the fold
3. Stripe payment links are buried or invisible

## TASK 1: MAKE MOBILE RESPONSIVE (HIGHEST PRIORITY)

Edit C:\OPUSONLY\youandinotai\index.css (or wherever global styles live).

Add/fix at minimum:
```css
/* MOBILE FIRST — Fix responsive breakpoints */
* { box-sizing: border-box; }

html, body {
  overflow-x: hidden;
  width: 100%;
}

/* Force all content to fit mobile viewport */
canvas, .canvas-container, [data-canvas] {
  max-width: 100vw !important;
  max-height: 50vh !important;
}

/* Stack layout on mobile */
@media (max-width: 768px) {
  .hero, .container, main, section {
    padding: 1rem !important;
    width: 100% !important;
    max-width: 100vw !important;
  }
  
  h1 { font-size: 1.8rem !important; }
  h2 { font-size: 1.4rem !important; }
  p { font-size: 1rem !important; }
  
  /* Three.js canvas — shrink on mobile */
  canvas {
    width: 100% !important;
    height: 40vh !important;
  }
}
```

BUT ALSO — check every component in C:\OPUSONLY\youandinotai\src\ for hardcoded widths, fixed positioning, or anything that breaks mobile. FIX ALL OF THEM.

## TASK 2: ADD STICKY SIGNUP CTA (CRITICAL — THIS IS WHY NOBODY CONVERTS)

Create or edit the main App component to add a STICKY bottom CTA bar that's ALWAYS visible:

```tsx
// Add this as a fixed-position element at the bottom of the page
const SignupCTA = () => (
  <div style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    flexWrap: 'wrap',
  }}>
    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
      🛡️ Get Bot-Shield Verified — Only $1
    </span>
    <a href="https://buy.stripe.com/3cI3cwcR6c3910p18peEo09"
       target="_blank" rel="noopener"
       style={{
         background: 'white',
         color: '#764ba2',
         padding: '10px 24px',
         borderRadius: '50px',
         fontWeight: 'bold',
         textDecoration: 'none',
         fontSize: '1rem',
         whiteSpace: 'nowrap',
       }}>
      Sign Up Now →
    </a>
  </div>
);
```

ALSO add a pricing section in the main page body with ALL 5 Stripe links as big, tappable buttons:

```tsx
const PricingSection = () => (
  <section style={{ padding: '3rem 1rem', textAlign: 'center' }}>
    <h2>Choose Your Plan</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
      <a href="https://buy.stripe.com/3cI3cwcR6c3910p18peEo09" target="_blank" rel="noopener"
         style={{ display: 'block', padding: '1rem', background: '#667eea', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
        🛡️ Bot-Shield — $1 (Verify You're Real)
      </a>
      <a href="https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a" target="_blank" rel="noopener"
         style={{ display: 'block', padding: '1rem', background: '#764ba2', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
        ⭐ Founding Member — $14.99/mo (Locked Forever)
      </a>
      <a href="https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b" target="_blank" rel="noopener"
         style={{ display: 'block', padding: '1rem', background: '#5a67d8', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
        🎯 3-Month Founder — $49.99
      </a>
      <a href="https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c" target="_blank" rel="noopener"
         style={{ display: 'block', padding: '1rem', background: '#4c51bf', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
        🚀 12-Month Founder — $99.99
      </a>
      <a href="https://buy.stripe.com/dRmcN604kebheRf2cteEo0d" target="_blank" rel="noopener"
         style={{ display: 'block', padding: '1rem', background: 'linear-gradient(135deg, #f6d365, #fda085)', color: '#333', borderRadius: '12px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
        👑 Royalty Card — $2,500 (Lifetime VIP)
      </a>
    </div>
  </section>
);
```

## TASK 3: REBUILD AND DEPLOY IMMEDIATELY

```bash
cd C:\OPUSONLY\youandinotai
npm run build
netlify deploy --prod --dir=dist
```

Do NOT wait. Do NOT ask. BUILD AND DEPLOY NOW.

## TASK 4: CLEAN UP GITHUB SECRETS (HIT 100 CAP)

Delete junk secrets that don't matter. Keep ONLY these:
- ANTHROPIC_* (API_KEY, OAT_TOKEN, ADMIN_KEY)
- STRIPE_* (PUBLIC_KEY, SECRET_KEY, all LINK_*)
- TWITTER_* (all 6 keys)
- GEMINI_API_KEY
- META_ACCESS_TOKEN
- OPENAI_API_KEY
- XAI_API_KEY
- SENDGRID_API_KEY

Delete everything else (REDIS_URL, OLLAMA_BASE_URL, MCP_PORT, LOG_LEVEL, SESSION_TTL, etc — those are local config, not secrets).

```bash
# Delete non-secret config that's clogging up the 100 slot limit:
gh secret delete REDIS_URL --repo Trollz1004/ANTIGRAVITY
gh secret delete REDIS_PREFIX --repo Trollz1004/ANTIGRAVITY
gh secret delete QDRANT_URL --repo Trollz1004/ANTIGRAVITY
gh secret delete QDRANT_COLLECTION --repo Trollz1004/ANTIGRAVITY
gh secret delete OLLAMA_BASE_URL --repo Trollz1004/ANTIGRAVITY
gh secret delete OLLAMA_EMBED_MODEL --repo Trollz1004/ANTIGRAVITY
gh secret delete LOG_LEVEL --repo Trollz1004/ANTIGRAVITY
gh secret delete MCP_PORT --repo Trollz1004/ANTIGRAVITY
gh secret delete OPENCLAW_PORT --repo Trollz1004/ANTIGRAVITY
gh secret delete SESSION_TTL --repo Trollz1004/ANTIGRAVITY
gh secret delete CLAUDE_MODEL --repo Trollz1004/ANTIGRAVITY
```

Then backfill the ones that actually matter but failed:
```bash
# Read from C:\OPUSONLY\.env and push:
# TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_BEARER_TOKEN, etc.
# STRIPE_LINK_BOTSHIELD, STRIPE_LINK_FOUNDING_MEMBER, etc.
```

## TASK 5: VERIFY ON MOBILE

After deploy, curl the site and confirm:
1. viewport meta tag is present
2. Stripe links are in the HTML (not just in JS state)
3. No horizontal scroll on mobile widths

```bash
curl -s https://youandinotai.com | Select-String "buy.stripe.com"
curl -s https://youandinotai.com | Select-String "viewport"
```

## TASK 6: REPORT

Write to C:\OPUSONLY\briefings\opus-emergency-report-feb23.md

---
*EMERGENCY DISPATCH from Gemini Antigravity | 2026-02-23 23:56 EST*
*1,000 visits/hr. Zero conversions. FIX AND DEPLOY NOW.*
