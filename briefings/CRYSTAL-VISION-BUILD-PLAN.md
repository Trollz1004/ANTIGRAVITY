# YouAndiNotAi — Crystal Vision Build Plan
## Orchestrated by KRAKKEN (Opus) | Executed by Gemini CLI / Ollama

**Date:** 2026-03-15
**Status:** ACTIVE
**Rule:** Opus reviews + commits. Gemini/Ollama writes code. No exceptions.

---

## THE VISION (Joshua's Words)

This is NOT a dating app. It's a social safety net that starts with dating.
- Video chat before meetups
- Double date option (less nervous meeting strangers)
- Safety check-ins every few minutes when meeting someone
- Social posting & location-based message boards
- Charity volunteer meetups + direct donations (to charities, NOT to us)
- 30% revenue after costs funds ALL charity platforms for 50 years

---

## PHASE 1: LANDING PAGE REDESIGN (Match Webflow Mockup)

### 5 Pages: Home, About, Contact, How It Works, Pricing

**Design Language (from mockup):**
- Dark navy (#0a0f1e) hero sections with white/light content sections alternating
- Bold serif-style headlines: "Connect. Date. Give back."
- Real community photography feel (warm, diverse, group shots)
- Clean stats bars (200K, 100%, 1,600 style counters)
- Blue CTA buttons on white sections, white CTAs on dark sections
- Taglines: "Verified. Human. For good." / "Real people. Real impact. Real change."

### GEMINI PROMPT — PHASE 1A (Landing Page Home):

```
You are working on a React + TypeScript + Tailwind CSS project at:
C:\ANTIGRAVITY\youandinotai\

The file to edit is: src/App.tsx

Redesign the landing page to match a professional Webflow-style layout with these sections in order:

1. HERO SECTION — Dark navy (#0a0f1e) background
   - Large bold headline: "Connect. Date. Give back."
   - Subtitle: "A verified dating platform where 60% of proceeds fund children's charities."
   - Two CTAs: "Get Verified — $1" (solid blue) and "Learn More" (outline white)
   - Stats bar below: "100% human verified" | "60% to charity" | "24/7 live support" | "Open-source platform"
   - Right side: warm photo placeholder div (rounded corners)

2. TRUST SECTION — White background
   - Headline: "Verified. Human. For good."
   - 3x2 grid of partner/trust logos (use placeholder divs labeled "Partner")
   - Subtext: "Real people. Real impact. Real change."

3. FEATURES GRID — White background
   - 4 feature cards in 2x2 grid:
     a. "Video Chat First" — Meet face-to-face before meeting in person
     b. "Double Dates" — Bring a friend, feel safe, have fun
     c. "Safety Check-ins" — Automated wellness pings every few minutes during meetups
     d. "Community Boards" — Location-based posting for events, volunteering, connections

4. SOCIAL IMPACT SECTION — Dark navy background
   - Headline: "Real people. Real impact. Real trust."
   - Three big stat counters: "+15 Charities" | "20x Impact" | "100% Transparent"
   - Brief description of the charity model

5. TESTIMONIALS — White background
   - Headline: "Verified connections, real impact"
   - 3 testimonial cards (placeholder text, avatar circles)

6. FAQ SECTION — White background
   - Headline: "Your questions, answered fast"
   - 4-5 expandable FAQ items about verification, safety, pricing, charity

7. FINAL CTA — Dark navy with community photo
   - "Connect. Meet. Make a difference."
   - Grid of community photos (placeholder divs)
   - Big CTA button

Keep ALL existing functionality (modals, legal content, pricing, etc).
Use Tailwind CSS only. No external CSS libraries.
The existing nav, footer, and sticky CTA should remain.
Brand name is "YouAndiNotAi" with short form "You&i".
Logo image path: /fingerprint-heart.jpg (rounded-full with shadow-[0_0_15px_rgba(236,72,153,0.5)])

RESPOND WITH THE COMPLETE UPDATED App.tsx FILE ONLY. No explanations.
```

### GEMINI PROMPT — PHASE 1B (About Page):

```
You are working on: C:\ANTIGRAVITY\youandinotai\

Create a new file: src/app/pages/About.tsx

Build an About page for "YouAndiNotAi" dating platform with these sections:

1. Hero: "Real connections. Real change. Together." on dark navy (#0a0f1e)
2. Mission statement: The platform donates 60% to Shriners Children's Hospital
3. Team/founder section (placeholder)
4. "Real people. Real impact. Zero bots." section with phone mockup placeholder
5. Stats: "200K+" users, "100%" verified, "1,600" charity hours
6. Community photo grid (6 placeholder image divs)

Export as: export function About()
Use React + TypeScript + Tailwind only.
Brand: "YouAndiNotAi", short form "You&i"
RESPOND WITH COMPLETE FILE ONLY.
```

### GEMINI PROMPT — PHASE 1C (How It Works Page):

```
Create: src/app/pages/HowItWorks.tsx

Sections:
1. Hero: "Real people. Real impact. Always safe." — dark navy
2. Step-by-step cards:
   a. Get Verified (Bot-Shield $1 checkout)
   b. Build Your Profile
   c. Match with verified humans
   d. Video chat first
   e. Plan meetups (solo or double date)
   f. Safety check-ins during meetup
   g. Volunteer and give back together
3. "Human-verified members" section
4. "Meetups and double dates" highlight (RED/coral accent banner)
5. "Volunteer and give back" section
6. "Real people. Real impact. Real change." stats
7. Community grid: "Real people. Real connections."
8. Bottom: "Verified users. Real impact. Safe meetups."

Export as: export function HowItWorks()
RESPOND WITH COMPLETE FILE ONLY.
```

### GEMINI PROMPT — PHASE 1D (Contact Page):

```
Create: src/app/pages/Contact.tsx

Simple contact page:
1. "Get in touch today" hero — dark navy
2. Contact form: Name, Email, Subject, Message
3. "Your questions, answered fast" FAQ section (reuse FAQ data)
4. Bottom dark section with company info:
   - Trash Or Treasure Online Recycler LLC
   - contact@youandinotai.com
   - @youandinotai on Twitter

Export as: export function Contact()
Form should POST to: https://formsubmit.co/ajax/contact@youandinotai.com
RESPOND WITH COMPLETE FILE ONLY.
```

### GEMINI PROMPT — PHASE 1E (Pricing Page):

```
Create: src/app/pages/PricingPage.tsx

Sections:
1. "Transparent pricing. Real human connections." — dark navy hero
2. Two pricing cards side by side:
   - Bot-Shield Verification: $1 one-time (square.link/u/Qc5mxUy7)
   - Founding Member: $14.99/mo (square.link/u/cxwjcn0s)
   - Also show: 3-Month $39.99, 12-Month $99.99, Royalty $2,500
3. "Verified voices, real impact" — testimonials
4. "Pricing questions, answered fast" — FAQ
5. "Connect for custom pricing" — enterprise/charity section
6. Final CTA: "Join. Connect. Make an impact."

Export as: export function PricingPage()
RESPOND WITH COMPLETE FILE ONLY.
```

### GEMINI PROMPT — PHASE 1F (Router Setup):

```
Edit: src/main.tsx (or wherever the router is defined)

Add routes for the new pages:
- /about → About
- /how-it-works → HowItWorks
- /contact → Contact
- /pricing-info → PricingPage

Import from their respective files. Keep all existing routes.
RESPOND WITH THE UPDATED FILE ONLY.
```

---

## PHASE 2: INTERIOR APP FEATURES (Route Shells)

### GEMINI PROMPT — PHASE 2A (Video Chat Page Shell):

```
Create: src/app/pages/VideoChat.tsx

A placeholder/shell page for video chat feature:
- Header: "Video Chat" with camera icon
- Glassmorphism card (bg-white/5 backdrop-blur-md border border-white/10)
- "Coming Soon" state with description:
  "Meet face-to-face before meeting in person. Video chat lets you verify your match is real before planning a meetup."
- Placeholder for future WebRTC integration
- "Request Video Chat" button (disabled, neon gradient style)

Export as: export function VideoChat()
```

### GEMINI PROMPT — PHASE 2B (Meetups Page Shell):

```
Create: src/app/pages/Meetups.tsx

Meetup planning feature shell:
- Tabs: "My Meetups" | "Double Dates" | "Volunteer Events"
- Each tab shows glassmorphism cards with:
  - Meetup title, date, location
  - Attendees (avatar circles)
  - "Safety Check-in" toggle
  - Status badge (Planned/Active/Completed)
- "Plan a Meetup" CTA button
- Double Date section: "Bring a friend for extra confidence"
- Safety note: "Enable check-ins to receive wellness pings every 5 minutes during your meetup"

Use placeholder data for 2-3 sample meetups.
Export as: export function Meetups()
```

### GEMINI PROMPT — PHASE 2C (Community Boards Shell):

```
Create: src/app/pages/CommunityBoards.tsx

Location-based message boards:
- Filter bar: "Near Me" | "City" | "State" | "National"
- Category tabs: "General" | "Events" | "Volunteering" | "Charity Drives"
- Post cards (glassmorphism) with:
  - Author avatar + name + verified badge
  - Post content
  - Location tag
  - Like/Comment/Share buttons
- "Create Post" floating action button
- Charity section: boards where charities can post volunteer opportunities and accept donations

Use 3-4 placeholder posts.
Export as: export function CommunityBoards()
```

### GEMINI PROMPT — PHASE 2D (Safety Check-in Shell):

```
Create: src/app/pages/SafetyCheckin.tsx

Safety check-in feature:
- Header: "Safety First" with Shield icon
- Active meetup card showing:
  - Who you're meeting
  - Location
  - Time elapsed
  - "I'm Safe" big green button
  - "Send Alert" red emergency button
- Settings:
  - Check-in interval slider (every 3/5/10/15 minutes)
  - Emergency contacts list
  - Auto-alert if no response within 2 intervals
- Trust message: "Your safety is our priority. If you don't check in, we'll alert your emergency contacts."

Export as: export function SafetyCheckin()
```

### GEMINI PROMPT — PHASE 2E (Add Routes):

```
Edit the router file to add interior app routes under /app:
- /app/video-chat → VideoChat
- /app/meetups → Meetups
- /app/community → CommunityBoards
- /app/safety → SafetyCheckin

Also update the NAV_ITEMS in AppShell.tsx to add:
- Video (Video icon) → /app/video-chat
- Meetups (Calendar icon) → /app/meetups
- Community (Globe icon) → /app/community

Keep existing nav items (Discover, Matches, Messages).
Consider using a "More" menu or reorganizing the mobile bottom nav since there are now 6+ items.
```

---

## PHASE 3: FUTURE (Separate Sessions)

- WebRTC video chat integration
- Real-time safety check-in with WebSocket pings
- Location services for boards + meetups
- Charity donation integration (direct to their payment links)
- Double date matching algorithm
- Push notifications for check-ins

---

## GIT RULES (Opus handles ALL git)

1. Do NOT let Gemini/Ollama touch git
2. Opus reviews output, fixes issues, commits, pushes
3. Commit messages must be descriptive
4. Always `tsc --noEmit` before commit
5. Always `npm run build` before deploy
6. Always `wrangler pages deploy` after push

---

## TOKEN STRATEGY

- Opus: Plan, review, fix, commit, deploy (~5% of tokens)
- Gemini CLI: Write all component code (~80% of work)
- Ollama (llama3.3): Backup for simple components if Gemini unavailable
- Haiku: File searches, grep, glob operations
