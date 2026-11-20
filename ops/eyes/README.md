# ops/eyes

Render a `domains/youandinotai.com/frontend` route with fixture replies in headless Edge and save desktop (1440px) and phone (412px) full-page pictures plus a JSON check report.

## Command

```powershell
node ops/eyes/shoot-page.mjs /app/admin/affiliates ops/eyes/fixtures/founder-affiliates.json "$env:USERPROFILE\antigravity\.fable-kitchen\for-josh"
```

## Where pictures land

- `<outDir>\eyes-founder-page-DESKTOP.png` (1440px wide)
- `<outDir>\eyes-founder-page-PHONE.png` (412px wide)
- `<outDir>\eyes-founder-page.json` (finalPath, visibleText, scrollsSideways, pageErrors)
