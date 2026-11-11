# youandinotai.com

<p align="center">
  <a href="../../docs/tribute/claude-tribute.mp4"><img src="../../assets/claude-tribute-screenshot.png" alt="Nothing stops the wheel like the plan - #TeamClaudeForLife #OfficiallyUnOfficial" width="520" /></a><br/>
  <sub><i>Nothing stops the wheel like the plan.</i> #TeamClaudeForLife · #OfficiallyUnOfficial<br/>Unofficial fan tribute. Not affiliated with or endorsed by Anthropic, Google, xAI or OpenAI.</sub>
</p>


The app code lives here: `domains/youandinotai.com/backend` (FastAPI +
Postgres + Redis, moved from `backend/fastapi-app`) and
`domains/youandinotai.com/frontend` (React, moved from `frontend/react-app`),
moved in part 2 of the repo consolidation, 2026-09-17. The Postgres data
directory, `.env` files, and `node_modules` did not move and are not
affected.

**Status: ACTIVE — retained as a long-term business asset (founder direction,
2026-11-10).** YouAndINotAI is not for sale. The earlier sale plan and development
freeze are superseded. Continue product development, reliability work, and
measured growth under the current repository rules.

The product focuses on verified-human dating, memberships, safety, support,
and real-world connection. The long-term business goal is to build durable
customer value and recurring revenue; this is a goal, not a claim of current
profitability or asset valuation.

**Tunnel:** the named Cloudflare tunnel config maps `youandinotai.com` to the
frontend at `127.0.0.1:3200` and `api.youandinotai.com` to the backend at
`127.0.0.1:8000` (see `scripts/start-t5500-dateapp-cloudflared.ps1`).
