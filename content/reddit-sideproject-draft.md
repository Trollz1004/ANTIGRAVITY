# Reddit Post Draft — r/SideProject
# STATUS: DRAFT — DO NOT POST UNTIL JOSHUA APPROVES
# Flair: Show Off

## Title
Show & Tell: Built a dating app with bank-level identity verification (electrician turned dev, 100% self-taught)

## Body

I'm an electrician from Florida who taught himself to code over the past year. No CS degree. No bootcamp. Just frustration and stubbornness.

**The problem:** I kept matching with bots on dating apps. Not just the obvious ones — sophisticated fakes that pass photo verification, carry conversations for days, then hit you with a link. I started wondering how many profiles on these apps are even real people. Industry estimates put it disturbingly high.

**What I built:** YouAndINotAI — a dating platform where every user goes through V8 Cloud Verification before they can create a profile. It's 8 layers of identity checks powered by Plaid's Identity API (the same infrastructure banks use to verify customers). Not email verification. Not selfie matching. Actual identity verification.

**The technical journey (for fellow self-taught devs):**
- Started with zero programming knowledge
- Backend: FastAPI, PostgreSQL, SQLAlchemy
- Frontend: React, TypeScript, Vite, TailwindCSS
- Payments: Stripe and Square (both live)
- Identity: Plaid Identity API integration
- Hosting: GCP Cloud Run
- AI tools were massive force multipliers — Claude and Gemini helped me learn patterns I would have taken months to figure out alone

**Where I am now:**
- Site is live at youandinotai.com
- Onboarding first 100 founding members at $14.99/mo (locked at that price forever)
- Every profile verified through Plaid before it goes active
- Solo founder, bootstrapped, no VC

**What I'd love feedback on:**
- The verification flow — too aggressive? Not enough?
- Pricing model — founding member lock-in a good idea?
- What would make YOU trust a new dating platform enough to try it?

Happy to answer any technical questions about the Plaid integration, the verification architecture, or what it's like learning to code as an electrician. It's been a wild ride.
