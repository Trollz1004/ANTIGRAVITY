# Antigravity Dashboard

Next.js app for the public ANTIGRAVITY status dashboard.

## Purpose

This app is intended to expose only:

- verified public links
- explicitly tracked public metrics
- general status notes that are safe for a public audience

It is not an internal admin panel.

## Local development

```powershell
Set-Location C:\ANTIGRAVITY\antigravity
npm install
npm run dev
```

## Public-surface rule

Internal node topology, task logs, credential entry, and private configuration changes do not belong in this app.
