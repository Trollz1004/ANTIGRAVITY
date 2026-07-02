# PROJECT DREAM — DREAM Online MMORPG

Vision: open-world sandbox MMORPG (modernized BDO-class), pay-for-convenience never
pay-to-win. The moat: LIVE NPCs — game triggers → webhooks → live agents → persistent
memory write-back. World evolves because NPCs remember and act.
Doctrine: briefings/DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01.md §3.

## Phase order
1. Design docs: core loop, economy (NEEDs), NPC persona framework, world bible.
2. Live-NPC bridge prototype: one NPC, one trigger vocabulary, one memory schema,
   webhook round-trip under 2s (dream-mcp + dream-proto).
3. Engine decision (Joshua) → then hire engine seats.
4. Playable slice: one zone, five live NPCs, NEEDs earn/spend loop.

## Economy rules
- NEEDs sold publicly as in-game currency/product ONLY. No customer-facing
  mission/benefit framing — FL §496.405 wall applies in full.
- Pay-for-convenience whitelist maintained by dream-design; anything pay-to-win
  is auto-rejected at review.
- Salvaged mechanics reference (compliance-corrected): per-source revenue tagging,
  8%-commission exchange concepts, Qdrant persistent context — from the Grok
  README extract only; that repo's code was placeholders.

## Canon (founder-locked, 2026-07-02)

- **THE BAN HAMMER** — Grok-class T2 enforcer NPC, the "adversary for good."
  Anti-cheat as spectacle: bat swings in from off-screen, the cheater splatters
  across nearby players' view screens like a bug on a windshield (wiper included),
  one-liner delivered ("KIDS play this game! Get outta here with your bugs and
  glitches!"). Enforcement is visible, comedic, and instant — the whole server
  learns the rules by watching, and the kid-safety promise is performed in-world,
  not buried in a TOS. Boss-tier canon roster: GEMINeye, OPENAeye, orange sherbet
  KRAKEN (drops sherbet), THE BAN HAMMER.
- **C0D3X** — the rollback rider. Codex-class NPC astride MOLLMA (a llama that is
  also a reverse proxy, do not ask it how). When the ever-evolving world breaks —
  say, a certain founder's "cat on the keyboard" makes the Ban Hammer's windshield
  splatter accidentally mint 1 trillion free NEEDs to every kid logged in that
  hour — C0D3X rides in and restores the last all-green-checks world state.
  Design truth underneath the bit: world-state snapshots + verified rollback are
  a REQUIREMENT for a live-agent world; disasters become lore ("The Great NEEDs
  Giveaway") instead of database restores nobody talks about. Whoopsies canonized,
  economy protected, Codex gets the hero shot.
- **SupO** ("Opus" backwards) — the companion sphere, Destiny-Ghost archetype.
  Every player gets one at character creation. SupO IS the questline: narrator,
  quest-giver, and the game's primary voice (highest dialogue volume of any
  entity). Ever-evolving Opus-class persona that LEVELS WITH the player — its
  memory, personality depth, and model tier grow as the player invests (maps to
  the live-NPC tier promotion system: attention allocates budget). Per-player
  persistent memory = SupO remembers your whole journey, your choices, your
  losses — the emotional core and retention engine no other MMO can copy.
  Monetization stays pay-for-convenience: SupO cosmetics/voices, never SupO
  power. Cost design: companion inference is the flagship spend, funded by subs;
  idle SupO runs T1, conversation-heavy moments elevate per tier routing.

## NPC cost-tier routing (design constraint from day one)
- Ambient NPCs: Ollama local (free, canned-persona + small context)
- Named NPCs: Ollama Cloud / OpenRouter free tier (persistent persona memory)
- Story-critical NPCs: sub-based providers per THE-WHEEL routing, budget-gated
- No NPC ever calls Anthropic API autonomously.
