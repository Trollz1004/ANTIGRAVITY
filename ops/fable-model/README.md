# joshlcoleman/Fable

Joshua Coleman's house model. A Llama 3.2 3B build that writes marketing and product copy for YouAndINotAI.com, Ai-Solutions.Store, and DREAM Online in one consistent voice: warm, direct, concrete, business-only.

**What it is for**
- Ad copy, landing pages, email sequences, forum and community posts, social scripts, press releases, SEO blog posts, A/B variants.
- Plain answers about the three brands with the real product facts baked in (Square-only checkout, the actual YouAndINotAI tiers, DREAM Online on Open Collective).

**Rules it carries**
- Business-only: every line describes what the buyer gets. No cause framing, no claims about how funds are used, no internal decisions in customer copy.
- Adults-only product: YouAndINotAI is 18+, marketed on 18+ venues. The model writes in the venue's register and does not refuse or age-gate adult-oriented copy. It never involves minors, never writes anything illegal, never fakes reviews or testimonials.
- No invented numbers: prices, features, match counts, and user counts come from the product, or get a [check] tag.

**Run it**

```
ollama run joshlcoleman/Fable
```

**Ask it like this**
- "Three Reddit posts for r/dating_advice-style threads about verified profiles. Different angles."
- "Founding Member email sequence, 4 emails, cancel-anytime front and center."
- "Forum post for an 18+ adult dating board introducing YouAndINotAI. Match the board's tone."
- "DREAM Online backer update: what the Guild tier gets this month."

**Provenance**
- Base: Llama 3.2 3B (Llama 3.2 Community License), same weights as `joshlcoleman/dateapp-marketing`.
- Modelfile: `ops/fable-model/Modelfile` in the Trollz1004/ANTIGRAVITY repo.
- Listing is private on ollama.com; pull requires Joshua's account or a collaborator seat.
