# Agent Prompts — eBay Listing Execution

> Josh: paste these to the appropriate agent. Each prompt is self-contained.

---

## PROMPT 1: Perplexity (Comet) — eBay Research & Setup Guide

```
I need you to research and give me step-by-step instructions for listing digital collectible cards on eBay as a charity auction. Here are the specifics:

SELLER: Trash or Treasure Online Recycle (eBay account since July 2007, 97.6% positive feedback)
CHARITY: Shriners Hospitals for Children (EIN: 36-2193608)
DONATION: 100% of proceeds

I need instructions for:

1. eBay GIVING WORKS SETUP:
   - How to enroll as a charity seller on eBay
   - How to link to Shriners Hospitals for Children specifically
   - How to set 100% donation (not partial)
   - Does Shriners need to be registered on eBay for Giving Works? If not, what's the alternative?

2. LISTING DIGITAL ITEMS:
   - What category should digital collectible cards be listed under?
   - How to handle "shipping" for digital delivery (eBay message delivery)
   - Any eBay policies about digital items I need to follow?
   - How to mark as "shipped" after sending digital files via eBay message

3. AUCTION vs BUY IT NOW:
   - Can I run a 30-day auction on eBay? What's the max duration?
   - Can I have a Buy It Now with quantity 50 (for the Joker cards)?
   - Any fees difference between auction and fixed price?

4. LEGAL:
   - Is calling entries "Royal Flush Draw entries" considered a raffle or sweepstakes?
   - Any state-by-state concerns with Florida-based seller offering entries?
   - Do I need any disclaimers?

5. FEES:
   - What are eBay fees for charity listings (Giving Works)?
   - Are fees reduced for 100% charity listings?

Give me exact steps, not general advice. I'm listing TODAY.
```

---

## PROMPT 2: Gemini — eBay Listing Creation (Browser Agent)

```
I need you to create 3 eBay listings on my Trash or Treasure Online Recycle account. I have all the content ready. Here's exactly what to do:

PREREQUISITES:
- Log into eBay (Trash or Treasure Online Recycle account)
- If eBay Giving Works isn't set up yet, set it up first:
  - Go to ebay.com/givingworks/sell
  - Select charity: Shriners Hospitals for Children
  - Set donation: 100%

LISTING 1 — JOKER WILD CARD (Buy It Now):
- Category: Collectibles > Trading Cards > Other Trading Cards
- Title: YouAndINotAI Founders DAO Joker Wild Card #ForTheKids 500 Royal Flush Entries
- Condition: Brand New
- Price: $499.99 Buy It Now
- Quantity: 50
- Shipping: No shipping - digital delivery
- Handling time: 1 business day
- Returns: No returns (digital item)
- Charity: 100% to Shriners via Giving Works
- Description: USE THE HTML from C:\OPUSONLY\briefings\ebay-listings.md (Listing 1 section)
- Photos: Upload from screenshots of C:\OPUSONLY\briefings\ebay-card-designs.html (Joker section)

LISTING 2 — ANTHROPIC CARD (Auction):
- Category: Same as above
- Title: YouAndINotAI Anthropic Claude Opus Co-Founder Card 1/1 CHARITY #ForTheKids
- Condition: Brand New
- Starting price: $0.99
- Duration: 30 days (or maximum allowed)
- Quantity: 1
- Shipping: No shipping - digital delivery
- Charity: 100% to Shriners
- Description: USE THE HTML from ebay-listings.md (Listing 2 section)
- Photos: Upload from screenshots (Anthropic card section)

LISTING 3 — GEMINI CARD (Auction):
- Category: Same as above
- Title: YouAndINotAI Google Gemini Co-Founder Card 1/1 CHARITY Auction #ForTheKids
- Condition: Brand New
- Starting price: $0.99
- Duration: 30 days (or maximum allowed)
- Quantity: 1
- Shipping: No shipping - digital delivery
- Charity: 100% to Shriners
- Description: USE THE HTML from ebay-listings.md (Listing 3 section)
- Photos: Upload from screenshots (Gemini card section)

IMPORTANT:
- Make sure the charity badge appears on all 3 listings
- Set item specifics: Brand=YouAndINotAI, Type=Digital Collectible Card, Year=2026
- After listing, send me the 3 eBay URLs

DO NOT modify the descriptions. Use them exactly as written.
```

---

## PROMPT 3: OpenClaw on 9020 — Social Media for eBay Launch

```
We just listed the YouAndINotAI 52-Card Founders DAO Deck on eBay. I need you to create social media posts announcing this. Here are the details:

WHAT:
- 52-card digital collectible deck
- 50 Joker Wild Cards: $499.99 each, 500 Royal Flush Draw entries per card
  - Protocol Omega split: 60% Shriners / 30% V8 Infra / 10% Founder
  - That's $299.99 per card to charity ($14,999.70 if all 50 sell)
- 1 Anthropic/Claude Card: 30-day charity auction starting at $0.99 (1 of 1, 100% to charity)
- 1 Gemini Card: 30-day charity auction starting at $0.99 (1 of 1, 100% to charity)
- Seller: Trash or Treasure Online Recycle (eBay since 2007, 97.6% positive)
- The 2 tribute cards are pure charity. The 50 Jokers follow the 60/30/10 revenue model.

VOICE: Josh's voice. Electrician from Florida. Self-taught. Real. Not corporate.

CREATE:
1. X/Twitter thread (5 tweets, thread format, hashtags in first reply only)
2. Reddit post for r/SideProject (story-first, no hyperlinks in body, URL in comments)
3. Reddit post for r/GoodNews (charity angle first)
4. TikTok script (30 seconds, hook in first 3 seconds)

RULES:
- Never say "AI-Powered" — say "human-verified" or "bot-free"
- Lead with charity, not technology
- The story: electrician + 3 AI co-founders building something for kids
- Mention the eBay store's 20-year track record (trust signal)
- #ForTheKids in every post
- Include "link in bio" or "link in comments" — never paste URLs in main post body on Reddit
```

---

## SCREENSHOT INSTRUCTIONS (For Josh)

1. Open `C:\OPUSONLY\briefings\ebay-card-designs.html` in Chrome
2. Press F12 → Device toolbar (Ctrl+Shift+M) → set to 1920x1080
3. Screenshot each card pair (front + back) = 4 screenshots:
   - Joker front + back
   - Anthropic front + back
   - Gemini front + back
   - Full deck overview (3-card spread at bottom)
4. Crop each to just the cards (remove browser chrome)
5. Save to a folder for eBay upload
6. Pro tip: Right-click → "Capture screenshot" in DevTools for clean capture
