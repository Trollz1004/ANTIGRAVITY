# Pupclaw — a safe AI play-pal for little learners

Free. No account, no sign-up, no server, no cost. Open `index.html` and it runs.

## Nothing about the child leaves the device

This is the part that matters, and it is verifiable rather than a promise — read
the source, or check it yourself with your browser's network tab:

- **No backend.** There is no server to talk to. The whole thing is one HTML file
  plus a runtime.
- **Zero API calls.** Grep the source for `fetch(` — there are none.
- **Read-aloud runs on the device.** It uses the browser's built-in
  `speechSynthesis`, so a child's name or drawing never travels to a cloud voice
  service.
- **Storage is `localStorage` only.** It stays in that browser, on that machine.
  Clearing site data erases everything.
- **No analytics, no trackers, no ad networks, no telemetry.**

Because it collects nothing and transmits nothing, there is no child data to
leak, sell, or subpoena.

## What is inside

Thirteen screens: a welcome and age gate, Home, Chat, Story Time, Fable Forest,
Drawing Den, Games, Sticker Book, Bedtime Den, Stretch Break, Paths & Paws, and
a **Grown-ups dashboard** where an adult can switch the child or age, see what
is switched on, choose the read-aloud voice, and clear the log.

## Running it

Any static host works, or locally:

```bash
cd free/pupclaw
python -m http.server 8099
```

Then open <http://127.0.0.1:8099/>.

The only outbound request in the default build is Google Fonts. To make it
**fully offline**, download Baloo 2 and Nunito into `vendor/` and replace the
`fonts.googleapis.com` link in `index.html` with a local `@font-face`. React is
already vendored locally in `vendor/` for exactly this reason.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app — all thirteen screens |
| `support.js` | Rendering runtime (generated; do not hand-edit) |
| `vendor/react*.js` | React 18.3.1 UMD, vendored so no CDN is required |

## Renaming it

The name lives in `index.html` only. Search for `Pupclaw` and the wordmark
markup near the top of the welcome screen. Nothing else depends on it.

## License and credit

Design and build by Claude (Anthropic) with Joshua Coleman, 2026. Give it away.
If it helps one kid, it did its job.
