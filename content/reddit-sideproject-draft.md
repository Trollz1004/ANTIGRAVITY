# Show & Tell: Built a dating app with bank-level identity verification (electrician turned dev, 100% self-taught)

**STATUS: DRAFT — DO NOT POST UNTIL JOSHUA APPROVES**

---

## Target

- **Subreddit:** r/SideProject
- **Flair:** Show Off
- **Tone:** Humble, authentic, educational — NOT promotional

---

## Title

> Show & Tell: Built a dating app with bank-level identity verification (electrician turned dev, 100% self-taught)

## Body

Hey r/SideProject,

I'm a licensed electrician from Kentucky who taught himself to code over the past year and a half. Wanted to share what I've been building and get some honest feedback.

**The problem that annoyed me into learning to code:**

I kept running into fake profiles and bots on dating apps. After one too many conversations that turned out to be automated, I started looking into _why_ dating apps don't verify identity. The answer was pretty simple — it's expensive, and inflated user counts help their metrics.

**What I built:**

YouAndINotAI — a dating platform where every user goes through identity verification before they can create a profile. Not just email/phone verification (bots bypass that trivially). Actual identity verification using Plaid's Identity API — the same infrastructure that Venmo, Cash App, and major banks use to confirm who someone is.

The verification system (I call it V8 Cloud) runs multiple checks:

- Government ID verification
- Liveness detection
- Bank identity cross-reference via Plaid
- Device fingerprinting
- Continuous monitoring

If any check fails, you don't get a profile. Period.

**The technical journey (for the devs here):**

Starting from zero was humbling. I went from not knowing what a variable was to building a full-stack app with payment processing and third-party API integrations. The learning curve was steep, but honestly — trade work teaches you how to troubleshoot and read documentation, which turns out to be 80% of programming.

Tools that saved me: AI assistants for debugging (seriously, game-changers for self-taught devs), Plaid's actually-good documentation, and a lot of YouTube.

**Where it stands:**

Launched the site last week. Currently onboarding the first 100 founding members at $14.99/mo (that price is locked forever for early supporters). Payment processing through Square. Site is live at youandinotai.com.

**What I'd love feedback on:**

- Is the value prop clear enough from the landing page?
- Any red flags in the tech approach?
- What would you do differently for user acquisition with zero budget?

Appreciate any feedback, even the brutal kind. That's why I'm posting here.

---

## Why This Works for r/SideProject:

1. **Authentic founder story** — electrician learning to code is genuinely interesting
2. **Technical substance** — discusses actual tech choices (Plaid, verification layers)
3. **Asks for feedback** — invites engagement, doesn't just promote
4. **Link is casual** — mentioned once at the end as context, not as a CTA
5. **No unverified stats** — removed the "47%" claim, focuses on personal experience instead
6. **Humble tone** — acknowledges being self-taught, asks for help

## What NOT to do:

- ❌ Do NOT cross-post to other subreddits
- ❌ Do NOT comment with additional links
- ❌ Do NOT create alt accounts to upvote
- ❌ Do NOT respond defensively to criticism
- ✅ DO respond thoughtfully to every comment
- ✅ DO answer technical questions in detail
- ✅ DO thank people for feedback, even negative
