# DREAM Online — Crowdfund Copy Pack
Product: DREAM Online, free-to-play browser MMORPG. Founder: Joshua Coleman. Ships from Florida. 13+ free to play. Pay for convenience, never power. Page: opencollective.com/dream-online

---

## (a) Open Collective Page Copy

### Headline
DREAM Online — one world, no load screens, and every NPC remembers you.

### About (120 words)
DREAM Online is a browser MMORPG built on one idea: every NPC remembers. There are no instanced zones and no load screens — one persistent world where blacksmiths, guards, and strangers you passed once carry what they saw. Word travels between NPCs as gossip, and gossip bends: a fact told twice becomes a rumor, then a fable, then a dream. Once a month the world itself changes shape under a villain named Dream, and every memory from the old world survives, one step less true. A world boss appears only when NPCs start talking about it — never on a map, never on a visible timer. DREAM Online is free to play. Backing this page funds development and keeps the servers running; it buys convenience and recognition, never an advantage in the game.

### Tiers

**Backer — $5+/mo**
- Name listed on the project's public backer roll
- A cosmetic-only in-world name tag color, no gameplay effect
- Early look at build notes before they go public
- Priority invite to the next open test window

**Founder — $25**
- Everything in Backer
- Permanent "Founder" mark on your Open Collective profile
- Your name inscribed on a cosmetic in-world monument, visible to all players, no gameplay effect
- Invite to the founder update channel
- Credited by name in the launch devlog

**Sponsor — $100+/mo**
- Everything in Founder
- A custom cosmetic title, name-only, no stat or power attached
- Named credit in the monthly devlog, every month you're active
- A quarterly build walkthrough before public release
- Priority placement in the support queue

**Guild — $2,000 (50 seats)**
- Covers cosmetic Backer-tier access for up to 50 members of one guild or group
- A guild name and banner design credited in-world, cosmetic only
- A dedicated update channel for the guild's organizers
- Early access to guild-facing features when they ship
- Full roster credited in the launch devlog

### Honesty Card — Recorded Numbers Only (60 words)
Everything on this page is the actual record, not a projection. Backer counts and funds raised are logged on Open Collective's public ledger and update as they happen — we don't post estimates or targets. We don't publish player counts or revenue forecasts because none exist yet. What you see here is what has actually come in and where it has actually gone, nothing more.

---

## (b) X Posts (8, each under 260 characters, only hashtag #DreamOnline)

1. In DREAM Online, NPCs don't broadcast what they know — they gossip. Tell one blacksmith a secret and by evening it's reached three towns, a little less true each time it's repeated. #DreamOnline

2. Every NPC message carries a hidden truth tag: fact, rumor, fable, dream. The world never tells you which one you're hearing. You have to figure out who to trust. #DreamOnline

3. Some NPCs only repeat what they saw. Some can't help embellishing. Some invent things outright. Same event, different NPC, different story by nightfall. #DreamOnline

4. Once a month the villain Dream swaps the entire world's genre. The NPCs stay. What they remember about you doesn't disappear — it just gets a little less certain. #DreamOnline

5. No load screens. No instances. One world, and every NPC in it is a standing memory of everywhere you've been in it. #DreamOnline

6. A world boss spawns roughly every 22 hours. Nobody posts the location. You find it because NPCs start talking. #DreamOnline

7. The rarest boss in DREAM Online doesn't just drop loot — he drops a story every NPC recognizes on sight. #DreamOnline

8. DREAM Online is free to play. Backing this page buys convenience and recognition. It never buys an advantage in the game. #DreamOnline

---

## (c) Reddit Posts (dev-log, value-first, 200-300 words each)

### r/MMORPG
I've been building an MMORPG where the NPCs are the actual game system, not scenery, for a while now. Wanted to share the strangest and most fun part to build.

Every NPC in DREAM Online remembers what happens near them, and they talk to each other about it. Not through a quest log — through an actual gossip network. Do something in front of one NPC and the ones nearby will know about it later, while ones further away might hear a distorted version, or not hear it at all. Every piece of information NPCs pass around carries a hidden tag: fact, rumor, fable, or dream. Some NPCs are honest, some can't help exaggerating, some make things up outright. You never see the tag. You just notice, over time, which NPCs to trust.

It's one persistent world — no instances, no load screens, no fast travel. The only load screen is character select.

Once a month, the whole world changes shape under a villain named Dream — the setting itself swaps genres. When that happens, nothing is deleted. Every old memory gets demoted one step: facts become rumors, rumors become fables, fables become dreams. NPCs carry all of it forward, half-remembering the world before.

There's also a world boss that spawns roughly every 22 hours in a location that's never posted anywhere. You find it because NPCs start talking about it.

Free to play, no pay-for-power. Development notes and the project page are at opencollective.com/dream-online if you want to follow along.

### r/gamedev
Sharing an architecture problem I've been chewing on: how do you make hundreds of NPCs feel alive without burning compute on NPCs nobody's near?

The approach I landed on for DREAM Online: NPC conversation is event-driven, never tick-driven. A proximity trigger fires exactly one inference when a player enters an NPC's radius — that single call reads the NPC's current state and the player's history with them and returns a greeting plus any memory update. Outside of that, an NPC in an empty region costs nothing. Every fifteen minutes, NPCs in active regions get a small batched state tick — mood decay, goal rollover, and a chance to pick up one piece of gossip from a shared message bus.

That bus is the interesting part. Every message on it — an observation, a rumor, a boss sighting — carries a truth tag: fact, rumor, fable, or dream. NPCs pass messages to neighbors, and each NPC's "tell" (honest, embellisher, inventor, repeater) can downgrade the tag as it spreads. The same event turns into different stories depending on who's retelling it.

Memory is sharded per NPC, not per player-NPC pair, which mattered a lot for how snapshotting and restarts work. On the monthly full-world event, every stored message gets demoted exactly one tier — nothing gets deleted, ever.

Every model call is tiered by NPC importance and logged with token counts, because a system like this is worthless if the cost model doesn't hold up at scale.

Still building. Notes and the project page: opencollective.com/dream-online.

### r/IndieGaming
Quick update from a solo-founder project I've been heads-down on: DREAM Online, a free-to-play browser MMORPG where every NPC has memory and the world itself has a plot.

The idea that got me building this: what if NPCs didn't just stand in place waiting for a quest trigger, but actually gossiped about what they'd seen — and the gossip could be wrong? So that's what it does. Tell a secret to one NPC and it can reach a town days later, warped a little each time it's repeated, tagged invisibly as fact, rumor, fable, or dream depending on who's telling it and how honest they are.

There's a villain, Dream, who swaps the entire world's setting once a month — desert one month, a dense city the next. Nothing gets wiped when that happens. NPCs carry the old world forward as half-remembered stories.

It's one shared world, no instances, no load screens except character select. There's a world boss that spawns roughly once a day, and the only way to find it is by listening to what NPCs are saying.

Building this alone has meant a lot of unglamorous plumbing to make NPC memory reliable and cheap to run, but the moment it clicked — watching a rumor mutate as it passed between NPCs — made it worth it.

Free to play, pay for convenience only, never power. If you want to watch it come together, the project page is at opencollective.com/dream-online.

---

## (d) TikTok / Shorts Script (45 seconds)

**Concept:** the bard added a dragon to your caravan robbery.

| Time | Shot | Voiceover |
|---|---|---|
| 0:00–0:03 | Hook: player crouched behind a caravan at night, torchlight, tense sting | "You robbed a caravan two nights ago. Nobody saw you. Or so you thought." |
| 0:03–0:08 | Cut to a tavern, a bard tuning a lute, NPCs gathered around | "There's a bard in this world who turns whatever he hears into a song." |
| 0:08–0:15 | Bard singing, lyric text overlay: "the rider fought off a dragon that night" | "Someone told him about your caravan job. He didn't have all the details. So he added a dragon." |
| 0:15–0:22 | Stylized gossip-map visual: lines connecting NPC icons, tag icons flipping fact to rumor to fable | "That's the truth tag system. What starts as a fact can end up a fable three towns over, and every NPC repeats it a little differently." |
| 0:22–0:30 | Side-by-side: one NPC says "he fought a dragon," another says "he just walked off with the wine" | "Same event. Different NPC. Different story. Nobody's lying — they just heard it differently." |
| 0:30–0:38 | Player walks into a new town, a guard nods and references the dragon story, player looks confused, then amused | "Now you're famous for something that never happened." |
| 0:38–0:42 | Quick cut to a wide world map, text overlay: "One world. No instances." | "One world. No instances. Every NPC remembers." |
| 0:42–0:45 | Logo card: DREAM Online, "Free to play" | "DREAM Online. Free to play. Link in bio." |

---

## (e) YouTube Devlog Outline (8 beats)

1. Cold open: a rumor mutating across three different NPCs in-game, no narration yet — pure hook.
2. Title card and one-line pitch: an MMORPG where every NPC remembers, one persistent world, no instances.
3. The problem: static NPCs feel dead. What changes when NPCs carry memory and pass it to each other.
4. Live demo: seed one fact into the world and follow it hop by hop as it becomes rumor, then fable.
5. Explain the truth tags and NPC "tells" (honest, embellisher, inventor, repeater) with side-by-side dialogue comparisons.
6. Show a genre-swap epoch event live: the same NPC asked the same question before and after, old memory now spoken as a rumor.
7. Show the 22-hour world boss hunt: NPCs start talking, the player follows gossip to the spawn, no map marker anywhere.
8. Close: what's shipping next, invite to back development on Open Collective, where to follow ongoing build notes.

---

## (f) Backer Email

### Subject Lines
1. The gossip system is live: NPCs are already telling each other different versions of you
2. What your backing built this month, in DREAM Online
3. A rumor just traveled three towns without you

### Body (120 words)
Since you backed DREAM Online, the gossip network went live in test builds: NPCs now pass along what they see to each other, and every message carries a hidden truth tag — fact, rumor, fable, or dream. Tell one NPC something and watch it warp as it spreads through the world. We also locked in the cadence for the monthly genre swap, when the villain Dream reshapes the whole world and every old memory drops one tier instead of disappearing. None of this would be running without backers keeping the servers up and the build moving. The Open Collective page still shows the real numbers, nothing projected. Thank you for staying with this one. More notes and the next build window are posted on the project page.
