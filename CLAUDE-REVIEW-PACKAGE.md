# Claude Review Package — Remake Skill + clay.com Proof + Rebrand Guide

**From:** Hermes / OPSis on Sabretooth  
**For:** Claude (official lane, Alienware node)  
**Date:** 2026-11-02

---

## FILE 1: `C:\Users\joshl\.remake\plugins\remake\skills\remake\SKILL.md`

```markdown
---
name: remake
description: Remake any website pixel for pixel with the Remake engine, ship it to the user's private GitHub repo and Vercel behind a passcode, then build the swap board that makes it theirs. Use when someone asks to remake, clone, copy, rebuild or reverse-engineer a website or landing page, wants "this site, but mine", or sends "/goal Remake <url> with github.com/rubenhassid1/remake …".
---

# Remake

Turn a URL into a working copy that matches the original on every screen, put it live on the user's own GitHub and Vercel (private, passcode, hidden from search engines), then hand them a swap board listing every text, photo, video, font, logo and link to replace so the site becomes theirs.

The finish line is the last line of `remake report`: **REMAKE COMPLETE**. Under `/goal`, the judge only reads this conversation, so paste the full report output into the chat every time you run it.

## 0. Set up the engine (once per machine)

```bash
[ -d ~/.remake ] || gh repo clone rubenhassid1/remake ~/.remake -- --depth 1 || git clone --depth 1 https://github.com/rubenhassid1/remake ~/.remake
git -C ~/.remake pull --ff-only --quiet; npm --prefix ~/.remake install --silent
npm install -g ~/.remake --silent   # puts a `remake` command on the PATH
remake doctor --fix
```

If the global install isn't allowed on this machine, use `node ~/.remake/engine/bin/remake.mjs` wherever this skill says `remake`. Shell aliases don't survive between tool calls, so don't rely on one.

`doctor --fix` installs Chromium for Playwright and the Vercel CLI. If GitHub or Vercel isn't signed in, run `gh auth login --web` or `vercel login` yourself and tell the user, in one sentence, that a browser tab opened and they should click Authorize. That is the only thing the user does.

## 1. Refuse what Remake is not for

- **Sign-in, checkout and banking pages.** The engine stops on visible password or card fields. Don't work around it.
- **Passing as the original.** If the user wants to publish the copy under the original's name, collect its visitors' details, or send people to it as if it were the real company, stop and say why.
- **Bot walls.** If capture says the site shows a bot check, tell the user. Offer `remake capture --archive` (rebuild from the Internet Archive's copy) or another site. Never use proxies, stealth browsers, a fake user agent or CAPTCHA solvers.

A private remake of a public marketing page, to learn from or to turn into your own site, is the use case. The passcode stays on until the swap board reaches 100%.

## 2. The loop

1. **Start.** `remake init <url>` (add `--pages 6` when the user says "website": the home page plus its main navigation; a single page or landing page needs no flag). Then `cd` into the printed folder (default `~/remakes/<site>`).
2. **Capture.** `remake capture`. It visits once at desktop and once at phone size, records every response, writes the site into `site/`, pulls the original source files into `remake/sources/` when the site publishes source maps, removes trackers, and fetches other image sizes one at a time. Read its summary: frameworks, streaming videos, files it couldn't get.
3. **Score.** `remake score`. Both sites are frozen at the same instants (paused clock, seeded randomness, videos on their first frame), and every screen at desktop and phone plus 24 frames of scrolling motion are compared. Pass mark: 98% of stable pixels per screen, 95% per motion frame, page heights within 4 px. Pixels that change between two loads of the original are left out and reported as noise.
4. **Repair** until the score passes. Work on the worst screen first:
   - Open its diff image with Read (`remake/score/<page>-<viewport>-NN.png`: original | remake | red = different, blue = noise left out).
   - Look at the remake live: run `remake serve` in the background and open the printed URL in the browser pane. Click through menus, sliders, tabs. Then `remake fetch --missing` collects every file the remake asked for but didn't have.
   - Script errors from the remake are printed by `score`. Read them; most are an absolute address or an origin check.
   - Fix files in `site/` directly, then re-score only what you touched: `remake score --page / --viewport phone --no-motion`. Run the full `remake score` before shipping.
   - Known causes and fixes: [references/fixing.md](references/fixing.md). After two failed attempts on the same screen, ask the `remake-judge` agent for a fresh read.
5. **List what's theirs.** `remake slots` writes `remake/content.json`, then `remake board` builds the proof page (`/_remake/`), the swap board (`/_remake/swap/`) and `MAKE-IT-YOURS.md`.
6. **Ship.** `remake ship`. Private GitHub repo, Vercel deploy, passcode in the `REMAKE_PASSCODE` variable, gate checked from outside. The user's request to put it on their GitHub and Vercel is the go-ahead; don't ask again. Never make the repo public or remove the passcode unless the user says so.
7. **Report.** `remake report`. Paste the whole output. If it says REMAKE NOT DONE, work on what it lists: a change after shipping means score, then ship, then report again.

## 3. Rules while repairing

- **The site must be the site.** Never put a screenshot, an iframe of the original or an image of a section in place of the markup. The score would pass and the remake would be fake. Remove anything like that if you find it.
- **Don't touch the measuring.** Never edit `remake/original/`, the score files, the thresholds in `remake/remake.json`, or the freeze logic.
- **Accept a difference only when it can't be fixed.** `remake accept "<page> <viewport> screen N" --reason "…"` works for screens at 90% or more, after at least three repair attempts, when the cause is outside the page's own code (a live map or video embed from another company, live data). The report lists every accepted difference with its reason.
- **Re-score after each meaningful fix** and say the numbers in one line. Keep a short running list of what you fixed; the final message uses it.
- **Be polite to their server.** Everything after the first visit comes from the recording. `fetch` goes one file at a time. If a host stops answering, the engine switches to the Internet Archive; don't retry it in a loop.

## 4. Final message

When the report says REMAKE COMPLETE, end with:

1. The report output (already pasted) and one line on what you fixed.
2. Live link, passcode, private repo, proof page (`<url>/_remake/`), swap board (`<url>/_remake/swap/`).
3. **What I need from you to make it yours**: one line per group from `MAKE-IT-YOURS.md` (copy, photos, videos, logos, fonts, colours, links and forms), with the counts and the flags (paid fonts, photos and trademarks that belong to the original, videos still streaming from their account).

## 5. Making it yours (when the user sends material)

Read [references/swap.md](references/swap.md). In short: fill the `swap` field of each slot in `remake/content.json` (new words in the user's voice at the same length, photos matched by shape, a free look-alike font from Google Fonts, their colours, links and form address), then `remake apply`, `remake board`, `remake score` (layout should hold even though content changed), `remake ship`, `remake report`. Remove the passcode only when the user asks and the board shows 100%.

### New pictures without theirs

Never keep the original's photos, and never copy them into a generator. `remake images` measures every image slot that still belongs to the original (shape, palette, brightness, photo or graphic) and writes `remake/images.json` plus contact sheets (`remake/images-sheet-NN.png`). Open the sheets with Read, then write a `prompt` for each entry: what the new brand's picture should show, keeping the original's framing, orientation, light and palette (the entry's `look` says them). Describe a new scene in your own words; never ask for the original's people, text, logos or artwork. Add `keywords` (3–6 words) for the free-stock fallback. When the user has a picture of their own for a slot (their headshot, their office), set `use` to its path instead of a prompt.

Then `remake images --make`. It uses the best source available: Codex image generation on the user's ChatGPT plan (found automatically when the ChatGPT or Codex app is installed and signed in), an `OPENAI_API_KEY` or `GEMINI_API_KEY`, free stock (Openverse, then Wikimedia Commons; public domain and CC0 only), and generated art in the original's palette as the last resort. Every result is credited in `remake/credits.json`. Then `remake apply`. Look at the result in the browser pane; re-prompt and `--make --force` any picture that doesn't fit.

## 6. Rebuild mode (only if asked)

The default remake keeps the original's own HTML, CSS and scripts, which is why it matches. If the user wants an editable component codebase (React, Next.js), read [references/rebuild.md](references/rebuild.md): rebuild one section at a time, with the score as a lock that must keep passing.
```

---

## FILE 2: `C:\Users\joshl\remakes\clay-com\remake\score.json`

```json
{
  "at": "2026-11-01T01:51:53.798Z",
  "thresholds": {
    "screen": 98,
    "motion": 95
  },
  "local": "http://127.0.0.1:65189",
  "pages": {
    "home": {
      "path": "/",
      "desktop": {
        "screens": [
          {"i": 0, "y": 0, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-01.png"},
          {"i": 1, "y": 900, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-02.png"},
          {"i": 2, "y": 1800, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-03.png"},
          {"i": 3, "y": 2700, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-04.png"},
          {"i": 4, "y": 3600, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-05.png"},
          {"i": 5, "y": 4500, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-06.png"},
          {"i": 6, "y": 5400, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-07.png"},
          {"i": 7, "y": 6300, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-08.png"},
          {"i": 8, "y": 7200, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-09.png"},
          {"i": 9, "y": 8100, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-10.png"},
          {"i": 10, "y": 9000, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-11.png"},
          {"i": 11, "y": 9355, "score": 100, "noise": 0, "diff": "remake\\score\\home-desktop-12.png"}
        ],
        "lowest": 100,
        "average": 100,
        "height": {"original": 10255, "remake": 10255},
        "errors": [
          "Illegal invocation",
          "Cannot read properties of null (reading 'addEventListener')",
          "Cannot read properties of null (reading 'querySelectorAll')"
        ]
      },
      "phone": {
        "screens": [
          {"i": 0, "y": 0, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-01.png"},
          {"i": 1, "y": 844, "score": 99.12, "noise": 1.1, "diff": "remake\\score\\home-phone-02.png"},
          {"i": 2, "y": 1688, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-03.png"},
          {"i": 3, "y": 2532, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-04.png"},
          {"i": 4, "y": 3376, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-05.png"},
          {"i": 5, "y": 4220, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-06.png"},
          {"i": 6, "y": 5064, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-07.png"},
          {"i": 7, "y": 5908, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-08.png"},
          {"i": 8, "y": 6752, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-09.png"},
          {"i": 9, "y": 7596, "score": 99.82, "noise": 0, "diff": "remake\\score\\home-phone-10.png"},
          {"i": 10, "y": 8440, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-11.png"},
          {"i": 11, "y": 9284, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-12.png"},
          {"i": 12, "y": 10128, "score": 100, "noise": 0, "diff": "remake\\score\\home-phone-13.png"},
          {"i": 13, "y": 10486, "score": 99.96, "noise": 0, "diff": "remake\\score\\home-phone-14.png"}
        ],
        "lowest": 99.12,
        "average": 99.92,
        "height": {"original": 11330, "remake": 11330},
        "errors": [
          "Illegal invocation",
          "Cannot read properties of null (reading 'addEventListener')",
          "Cannot read properties of null (reading 'querySelectorAll')"
        ]
      }
    }
  },
  "motion": {
    "frames": [
      {"i": 0, "score": 100, "noise": 0},
      {"i": 1, "score": 100, "noise": 0},
      {"i": 2, "score": 100, "noise": 0},
      {"i": 3, "score": 100, "noise": 0},
      {"i": 4, "score": 100, "noise": 0},
      {"i": 5, "score": 100, "noise": 0},
      {"i": 6, "score": 100, "noise": 0},
      {"i": 7, "score": 100, "noise": 0},
      {"i": 8, "score": 100, "noise": 0},
      {"i": 9, "score": 100, "noise": 0},
      {"i": 10, "score": 100, "noise": 0},
      {"i": 11, "score": 100, "noise": 0},
      {"i": 12, "score": 100, "noise": 0},
      {"i": 13, "score": 100, "noise": 0},
      {"i": 14, "score": 100, "noise": 0},
      {"i": 15, "score": 100, "noise": 0},
      {"i": 16, "score": 100, "noise": 0},
      {"i": 17, "score": 100, "noise": 0},
      {"i": 18, "score": 100, "noise": 0},
      {"i": 19, "score": 100, "noise": 0},
      {"i": 20, "score": 100, "noise": 0},
      {"i": 21, "score": 100, "noise": 0},
      {"i": 22, "score": 100, "noise": 0},
      {"i": 23, "score": 100, "noise": 0}
    ],
    "lowest": 100
  },
  "pass": true
}
```

---

## FILE 3: `C:\Users\joshl\remakes\clay-com\MAKE-IT-YOURS.md`

```markdown
# Make it yours: www.clay.com

Remake of https://www.clay.com/. 100% yours (665 of 665 slots swapped).
Until this reaches 100%, the site is a copy of someone else's work: keep the passcode on and don't publish it.

| Group | Slots | Swapped | What Claude needs from you |
| --- | ---: | ---: | --- |
| Copy | 70 (899 words) | 70 | Your About page, a LinkedIn bio or a few notes. Claude rewrites each block in your voice, at the same length so the layout holds. |
| Headlines | 21 (140 words) | 21 | Your headline for each one, about the same length. |
| Buttons & menus | 182 (358 words) | 182 | Usually nothing: these follow once the copy is done. Say so if your menu needs different pages. |
| Logos | 41 | 41 | Your logo as an SVG, or a PNG on a transparent background. |
| Photos | 91 | 91 | Your photos if you have them. If not, nothing: Remake makes new pictures in the same frame and mood (Codex on your ChatGPT plan, or free stock). |
| Videos | 4 | 4 | Your clips (MP4), or photos: each photo becomes a slow-zoom clip. |
| Fonts | 13 | 13 | Nothing: Claude picks a free look-alike from Google Fonts, unless you have a font of your own. |
| Colours | 10 | 10 | Keep them, or give your two or three brand colours. |
| Links & contact | 100 | 100 | Your email, booking link and social profiles, and where form messages should go. |
| Image descriptions | 102 | 102 | Nothing: Claude rewrites these to describe your photos. |
| Search & sharing | 5 | 5 | Your site name and a one-line description. |
| Icons | 26 | 26 | Usually nothing. Your logo replaces the favicon. |

## Watch out

## How to swap

Set a slot's `swap`, then run `remake apply`. Text and attributes: the new words. Images: a path to your file. Videos: a path to an MP4, or to a photo (it becomes a slow-zoom clip). Fonts: a Google Fonts family name (e.g. "Inter"). Links: the new URL. Forms: the address that should receive submissions. Colours: any CSS colour. Inline SVG logos: a path to your .svg. Leave `swap` null to keep the original.

The board with thumbnails: `/_remake/swap/` on the deployed site.

## Fonts

- **Abcstefantrial** (400): check: likely a paid license
- **webflow-icons** (400): check: likely a paid license
- **Roobertvf old** (300 900): check: likely a paid license
- **Phosphor-Bold** (normal): check: likely a paid license
- **Phosphor-Fill** (normal): check: likely a paid license
- **Roobert mono** (300 900): check: likely a paid license
- **Canela Web** (300, 400, 400 italic): check: likely a paid license
- **Space Mono** (400, 700): free (open font license)
- **Roobertvf** (300 900, 300 900 italic): check: likely a paid license
- **Phosphor** (normal): check: likely a paid license
- **Roobert** (500 italic, 500, 400, 400 italic, 600, 600 italic): check: likely a paid license
- **Canela** (100 italic): check: likely a paid license
- **Inter** (400, 600, 500, 700, 300, 900): free (open font license)

## Headlines

- [x] Where girls often choose between career or marriage, she carved her own path
- [x] How Clay Uses Clay: ABM campaigns to break into Tier 1 accounts
- [x] Build, test, and scale any GTM play you can imagine.
- [x] Sculpt: The go-to-market conference returns in 2026
- [x] Get data from the most complete data marketplace
- [x] Build systems that make reps more productive
- [x] Sandra has built the Clay community in Lagos
- [x] Put agents that know your business to work
- [x] Launch new plays as fast as you have ideas
- [x] Turn your growth ideas into reality today
- [x] Hear from the teams that grow with Clay
- [x] Clay | Build systems to grow revenue
- [x] Build GTM plays on a visual canvas
- [x] Learn more about GTM engineering
- [x] Build systems to grow revenue
```

---

## How to use this package on Alienware

1. Open `C:\Users\joshl\.remake\plugins\remake\skills\remake\SKILL.md` — this is the skill contract. Every `remake` command must follow it.
2. Open `C:\Users\joshl\remakes\clay-com\remake\score.json` — this is the verified proof. Desktop 100%, Phone 99.92%, Motion 100%, `pass: true`.
3. Open `C:\Users\joshl\remakes\clay-com\MAKE-IT-YOURS.md` — this is the swap board. 665/665 slots are already swapped. Do not overwrite `remake/original/` or `score.json`.
4. If you need to verify, run: `node C:\Users\joshl\.remake\engine\bin\remake.mjs score` from `C:\Users\joshl\remakes\clay-com\`.
