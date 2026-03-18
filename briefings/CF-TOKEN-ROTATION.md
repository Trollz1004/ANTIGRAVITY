# CLOUDFLARE API TOKEN ROTATION GUIDE (2026)

> **FOR THE KIDS.** Platform credibility depends on secure, active deployments.

### ⚠️ STATUS: TOKEN EXPIRED
The current `CLOUDFLARE_API_TOKEN` is stale. GitHub Actions is flagged for overuse, so we are shifting to **DIRECT DEPLOY** and **NAMED TUNNELS** from Sabretooth.

---

### STEP 1: CREATE NEW TOKEN
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Go to **My Profile** (top right) → **API Tokens** → **Create Token**.
3. Select **"Edit Cloudflare Workers"** (or Custom Token).
4. **Permissions needed:**
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Zone** → **DNS** → **Edit** (for `youandinotai.com`)
   - **Zone** → **Cache Purge** → **Purge**
   - **Zone** → **Workers Scripts** → **Edit**
5. **Zone Resources:**
   - **Include** → **Specific Zone** → `youandinotai.com`
6. Click **Continue to summary** → **Create Token**.
7. **COPY THE TOKEN IMMEDIATELY.** (You only see it once).

---

### STEP 2: UPDATE THE VAULT
1. Open the Master Env Vault: `C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`
2. Update the following key with your new token:
   ```env
   CLOUDFLARE_API_TOKEN=your_new_token_here
   ```
3. Save the file.

---

### STEP 3: PING THE TEAM
Notify **Claude Code** or **Grok** that the token is rotated. They will then proceed with:
- `cloudflared` named tunnel routing for `openclaw.youandinotai.com`.
- Routing the MCP endpoint for remote social media orchestration.

---

*Status: ⏳ Waiting for Josh to rotate token.*
