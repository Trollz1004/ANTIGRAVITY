# AntiGravity · Autopilot Cockpit (local admin console)

`index.html` is a local-only operator console for the two-node LAN fleet
(Alienware `192.168.0.40` = DEV node, Sabretooth `192.168.0.8` = FINISHED-PRODUCT
node). It polls each node's real endpoints every 5 seconds and shows real or
zero — no fake greens, no invented counts.

## Local-only rule

This tool is never deployed publicly and is never copied into `domains/` or
any other public deploy path. A CI grep guard fails the build if the string
"Autopilot Cockpit" appears anywhere under `domains/`. Do not link this page
from any public page.

## How to open it

Nothing in this repo's server code serves this page — running
`node ops/domains-server/server.mjs` does **not** serve it. Open it either way:

- Open `tools/cockpit/index.html` directly in a browser (`file://`), or
- Serve `tools/cockpit/` with any static file server on the LAN (for example
  from JARVIS), so the watchdog's fetches share an origin with the services
  it's polling and can read real status codes instead of opaque responses.

## `cockpit.local.json`

The two Chrome Remote Desktop session URLs are never hardcoded in this page.
On load, the page does `fetch('./cockpit.local.json')` (same directory) and,
if it finds a file shaped like `cockpit.local.example.json`, uses its
`crd.alienware` and `crd.sabretooth` URLs for the CRD launcher buttons.
Without that file, the buttons fall back to the generic
`https://remotedesktop.google.com/access` console and read "Open CRD console
(no local session file)".

`cockpit.local.json` is gitignored — create it locally from
`cockpit.local.example.json` and fill in your own real session URLs. Never
commit it.
