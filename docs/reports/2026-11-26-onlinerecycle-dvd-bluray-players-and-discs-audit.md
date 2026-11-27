# OnlineRecycle Equipment Audit: DVD and Blu-ray Players and Discs (2026-11-26)

Role: Lead: `engineering-technical-writer` (Technical Writer) · Companions: `design-brand-guardian` (Brand Guardian), `marketing-content-creator` (Content Creator)

## Objective

Evaluate the requested blog post topic ("DVD and Blu-ray players and discs") against the published inventory of accepted equipment on `onlinerecycle.net`, existing blog posts, and active pull requests per task instructions:

> "1. List the posts under domains/onlinerecycle.net/site/blog and the open pull requests that add one. Read the home page's own list of what is accepted. If DVD and Blu-ray players and discs is not on that list, or a post covers it, stop and say so in the pull request."

---

## 1. Inventory of Existing Blog Posts (`domains/onlinerecycle.net/site/blog/`)

There are currently 27 blog posts in `domains/onlinerecycle.net/site/blog/`:

1. `how-to-recycle-car-audio-head-units-in-central-florida.html`
2. `how-to-recycle-computer-monitors-in-central-florida.html`
3. `how-to-recycle-docking-stations-and-cables-in-central-florida.html`
4. `how-to-recycle-game-consoles-in-central-florida.html`
5. `how-to-recycle-home-office-routers-and-firewalls-in-central-florida.html`
6. `how-to-recycle-home-stereo-receivers-and-speakers-in-central-florida.html`
7. `how-to-recycle-laptops-and-macbooks-in-central-florida.html`
8. `how-to-recycle-nas-units-and-external-drives-in-central-florida.html`
9. `how-to-recycle-phones-and-tablets-in-central-florida.html`
10. `how-to-recycle-printers-in-central-florida.html`
11. `how-to-recycle-servers-and-network-gear-in-central-florida.html`
12. `how-to-recycle-ups-battery-backups-in-central-florida.html`
13. `how-to-wipe-a-hard-drive-before-recycling-a-pc.html`
14. `what-business-electronics-can-be-recycled.html`
15. `what-to-do-with-a-broken-laptop-in-orlando.html`
16. `what-to-do-with-old-office-computers.html`
17. `where-to-recycle-old-computers-in-altamonte-springs-florida.html`
18. `where-to-recycle-old-computers-in-clermont-florida.html`
19. `where-to-recycle-old-computers-in-lake-county-florida.html`
20. `where-to-recycle-old-computers-in-lake-mary-florida.html`
21. `where-to-recycle-old-computers-in-leesburg-florida.html`
22. `where-to-recycle-old-computers-in-mount-dora-florida.html`
23. `where-to-recycle-old-computers-in-oviedo-florida.html`
24. `where-to-recycle-old-computers-in-sanford-florida.html`
25. `where-to-recycle-old-computers-in-winter-garden-florida.html`
26. `where-to-recycle-old-computers-in-winter-park-florida.html`
27. `where-to-recycle-old-electronics-in-apopka-florida.html`

---

## 2. Open Pull Requests Adding Blog Posts

Review of open pull requests on `Trollz1004/ANTIGRAVITY`:

- **PR #569 (`ai/inbox/bv1-device`)**: Adds blog post for all-in-one PCs (`how-to-recycle-all-in-one-pcs-in-central-florida.html`).
- **PR #570 (`ai/inbox/bv2-device`)**: Adds blog post for workstations (`how-to-recycle-workstations-in-central-florida.html`).
- **PR #573 (`ai/inbox/bv3-device`)**: Adds blog post for handheld game systems (`how-to-recycle-handheld-game-systems-in-central-florida.html`).
- _(Reference: PR #571 (`ai/inbox/tw1-fold-towns`) consolidates town blog posts into a single service-area page)._

None of the existing posts or open pull requests cover DVD or Blu-ray players or discs.

---

## 3. Home Page Accepted Equipment Verification (`domains/onlinerecycle.net/site/index.html`)

The home page defines accepted equipment across three cards in Section 04 (`#accepted`) and the FAQ schema:

### 3.1 Card 05: Computing & Office Hardware (`id="card-gear-computing"`)

- **Computing & Servers:** Desktop towers, workstations, MacBooks, notebooks, rackmount servers, NAS units, motherboards, GPUs, RAM, and processors.
- **Mobile & Office:** Smartphones, tablets, enterprise switches, routers, firewalls, monitors, docking stations, printers, cables, and UPS battery backups.
- **Storage Security:** SSD / HDD wipe & destruction (NVMe M.2, SATA SSD, 2.5"/3.5" HDD, SAS enterprise drives).

### 3.2 Card 06: Entertainment, Media & Audio (`id="card-gear-media-audio"`)

- **Game Systems:** Consoles and handhelds, controllers, cables, and accessories (PlayStation, Xbox, Nintendo, Steam Deck, retro cartridge decks, docks).
- **Digital Media / Optical & Cartridge Media:** Game discs and cartridges, DVDs, Blu-rays, 4K UHD discs, and audio CDs.
- **Home Audio:** Receivers, amplifiers, speakers, soundbars, and home stereo systems.
- **Car Audio:** Head units, car stereos, amplifiers, and subwoofers.

### 3.3 FAQ (`line 1667`)

> "Do you take game consoles, games, DVDs and stereos? Yes. We accept game consoles, handhelds, video games, movie discs, DVDs, Blu-rays, CDs, and home and car stereo equipment."

---

## 4. Evaluation and Determination

1. **Standalone DVD and Blu-ray Players Are Not on the Accepted List:**
   The home page lists optical disc _media_ ("movie DVDs, Blu-rays, 4K UHD discs, and audio CDs", "Game discs and cartridges, DVDs, Blu-rays and CDs"). It does **not** list standalone DVD players, Blu-ray players, or video disc decks anywhere on `index.html` or `about.html`.
2. **Hard Content Boundary:**
   Ticket rule 3 mandates:
   > "Never name a kind of device, part or supply the home page does not list."
   > Additionally, test suite `tests/onlinerecycle-blog.test.mjs` enforces:
   > "must not state business claims, items, certificates, standards, or prices absent from index.html and about.html"
   > Publishing a post advertising recycling preparation for DVD and Blu-ray players would name unlisted devices and violate site truth.
3. **Execution Decision:**
   Per the explicit trigger in instruction 1:
   > "If DVD and Blu-ray players and discs is not on that list, or a post covers it, stop and say so in the pull request."
   > Work stops here. No blog post claiming acceptance of DVD and Blu-ray players has been authored or added to `domains/onlinerecycle.net/site/blog/`.
