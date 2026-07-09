# Cloudflare Domain Routing Status - 2026-07-09

Source: T5500 Wrangler/API read-only pass using vault env auth. No secrets printed.

## T5500 Wrangler

- Wrangler is installed on T5500.
- Auth works when run with:

```text
C:\Users\joshl\OneDrive\Personal Vault-DESKTOP-H4B53GL\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env
```

## Cloudflare account

- Account: `Joshlcoleman@gmail.com's Account`
- Account ID: `516a3a855f44f5ad8453636d163ae25d`

## Zones currently visible

- `aidoesitall.website` - active
- `ai-solutions.store` - active
- `trashortreasureonlinerecycler.com` - pending
- `u-and-i-not-a-i.online` - active
- `untilnokidinneed.com` - pending
- `youandinotai.com` - active
- `youandinotai.online` - active

`onlinerecycle.net` is not currently visible as a Cloudflare zone in this
account. Wrangler/API cannot route the apex `onlinerecycle.net` through Pages
until the domain is added to Cloudflare or its DNS is pointed appropriately.

## Pages custom domain state

`youandinotai`:

- `youandinotai.com` - error: domain information not found
- `www.youandinotai.com` - error: domain information not found

`ai-solutions-store`:

- `ai-solutions.store` - deactivated
- `www.ai-solutions.store` - active

`onlinerecycle`:

- `onlinerecycle.org` - active
- `www.onlinerecycle.org` - pending
- `onlinerecycle.net` - not attached

`antigravity-mission-control`:

- no custom domains attached

## Operational conclusions

- The old `onlinerecycle.org` Pages attachment still exists.
- The desired replacement `onlinerecycle.net` is not yet attachable via the
  current Cloudflare account state because the `.net` zone is missing.
- `ai-solutions.store` apex exists as a zone but its Pages custom domain is
  deactivated; `www.ai-solutions.store` is active.
- `youandinotai.com` exists as a zone, but Pages custom domain records are in
  an error state even though the public API health is currently reachable.

## Repeatable audit

Run from T5500:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\cloudflare\Invoke-CloudflareDomainRoutingAudit.ps1
```

This audit is read-only. It uses the T5500 vault env file, writes a JSON report
under `C:\antigravity\logs`, and does not mutate DNS or Pages domains.
