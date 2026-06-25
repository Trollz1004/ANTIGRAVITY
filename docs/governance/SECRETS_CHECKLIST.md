# GitHub Actions Secrets Checklist

Repo: `Trollz1004/ANTIGRAVITY`  
Add these in GitHub repo settings:
`https://github.com/Trollz1004/ANTIGRAVITY/settings/secrets/actions`

## Core App

- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `METRICS_API_KEY`

## Cloudflare / Deploy

- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CF_API_TOKEN`  
Same value as `CLOUDFLARE_API_TOKEN` for scripts that still read the shorter alias.
- [ ] `CLOUDFLARE_ADMIN_TOKEN`  
Optional workflow alias; `.github/workflows/deploy-cloudflare-pages.yml` accepts this or `CLOUDFLARE_API_TOKEN`.

## Square

- [ ] `SQUARE_ACCESS_TOKEN`
- [ ] `SQUARE_LOCATION_ID`
- [ ] `SQUARE_BOT_SHIELD_PAYMENT_LINK`
- [ ] `SQUARE_SUBSCRIPTION_PAYMENT_LINK`
- [ ] `SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY`
- [ ] `SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL`
- [ ] `SQUARE_BOOKING_WEBHOOK_SIGNATURE_KEY`
- [ ] `SQUARE_BOOKING_WEBHOOK_NOTIFICATION_URL`
- [ ] `SQUARE_WEBHOOK_SIGNATURE_KEY`
- [ ] `SQUARE_WEBHOOK_NOTIFICATION_URL`

## AI Providers

- [ ] `GEMINI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `DAILY_API_KEY`
- [ ] `KIMI_API_KEY`

## eBay

- [ ] `EBAY_APP_ID`
- [ ] `EBAY_CERT_ID`
- [ ] `EBAY_DEV_ID`
- [ ] `EBAY_OAUTH_TOKEN`

## Chain / Contracts

- [ ] `BASESCAN_API_KEY`

## Email

- [ ] `EMAIL_FROM_ADDRESS`
- [ ] `EMAIL_REPLY_TO`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USERNAME`
- [ ] `SMTP_PASSWORD`

## GitHub Automation

- [ ] `GITHUB_PAT`  
Not used by the app runtime. Keep only if repo scripts or local automation still depend on it.
- [ ] `GITHUB_ADMIN`  
Optional admin-scoped alias if you intentionally maintain a second GitHub token.
