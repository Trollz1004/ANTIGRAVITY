@echo off
rem ── Mission Control — API + dashboard on :3151 ───────────────────────────
rem
rem SECURITY: this server has NO authentication. server/src/index.ts calls
rem app.use(cors()) with no auth middleware anywhere, and an unauthenticated
rem POST /api/tasks returns 201 and really queues a job. Verified 2026-08-01.
rem
rem Therefore it binds locally only and must NEVER be given a public hostname
rem until an API key check or Cloudflare Access sits in front of it. The 530 on
rem mission-control.youandinotai.com is currently the only thing preventing
rem anyone on the internet from spending your model budget.
title mission-control (:3151)
cd /d C:\ANTIGRAVITY\mission-control-v5
echo [mission-control] http://localhost:3151/  (LOCAL ONLY - no auth on this server)
npm start
