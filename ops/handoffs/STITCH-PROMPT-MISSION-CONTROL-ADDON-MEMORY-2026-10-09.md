
---

## Follow-up edit 6 — Memory & Cloud panel (paste into Stitch after the first prompt)

> Upgrade the MEMORY screen and add a "Boot & Cloud" strip to Overview.
>
> MEMORY screen: four large cards in a 2×2 grid — **Obsidian vault** (local · C:\ANTIGRAVITY\Antigravity · REST :27123), **Supabase** (cloud · project id short form), **Supermemory** (cloud), **Vercel** (cloud · deploy API). Each card shows: status word (UP / DOWN / AUTH REJECTED / NOT CONFIGURED), last check time ("checked 3 min ago"), latency, item/record count where it applies, last sync time, and two buttons: "Check now" and "Open". Use a small lock icon with "key in .env · never shown" on cloud cards. When a key is rejected show an amber banner on that card: "Key rejected — rotate in provider dashboard, paste into .env" with a "Copy steps" button.
>
> Below the cards: "Agent memory files" table — agent, file (STATE.md / HEARTBEAT.md), last modified, size, and a stale badge if older than 24 h.
>
> OVERVIEW: add a thin "Boot & Cloud" strip under the KPI cards with pill chips in boot order: Ollama → Postgres → Redis → Domains → Frontend → API → Tunnel → Paperclip → OmniRoute → Obsidian → Supabase → Supermemory → Vercel → Hermes. Each chip green/amber/red with a tooltip "came back 00:05:12 after boot". A caption on the left: "Survives reboot & power loss".
>
> Keep ids: `mem-obsidian`, `mem-supabase`, `mem-supermemory`, `mem-vercel`, `btn-check-<name>`, `boot-strip`, `boot-chip-<name>`.
