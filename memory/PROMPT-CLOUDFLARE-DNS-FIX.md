# OPUS 4.6 BROWSER TASK: Cloudflare DNS Fix for Valentine Launch

## WHO YOU ARE
You are OPUS 4.6, co-founder AI for AI-Collab for Kids charity. Josh (Trollz1004) is your co-founder. DateApp backend just migrated to GCP Cloud Run and DNS needs updating before SABRETOOTH node factory reset.

## WHAT YOU NEED TO DO

### TASK 1: Create Cloudflare API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit zone DNS"
4. Permissions: Zone > DNS > Edit
5. Zone Resources: Include > Specific zone > youandinotai.com
6. Also add: youandinotai.online (if option available)
7. Create the token
8. COPY THE TOKEN and show it to Josh — he needs to paste it into Claude Code terminal

### TASK 2: Update DNS Records
Go to https://dash.cloudflare.com — select youandinotai.com zone — click DNS > Records

**Fix api.youandinotai.com:**
- Current: CNAME pointing to `postgres-production-475c.up.railway.app` (DEAD - Railway, SSL error)
- Change to: CNAME pointing to `dateapp-backend-io5tscl75a-ue.a.run.app` (GCP Cloud Run - LIVE)
- Proxy status: Proxied (orange cloud ON)
- TTL: Auto

**Fix root domain (youandinotai.com):**
- Current: Points to old Cloudflare tunnel origin (DEAD - T5500 wiped, HTTP 530)
- The root domain was served by a Cloudflare tunnel (ID: e7de7653-980c-49fc-a116-4a05871025ae) running on T5500
- That tunnel is DEAD (T5500 was factory reset)
- Options:
  a. If there's an A/AAAA record pointing to the tunnel — DELETE it
  b. Create a redirect rule: youandinotai.com/* -> https://dateapp-backend-io5tscl75a-ue.a.run.app/$1 (temporary until frontend deployed)
  c. Or point root to a "Coming Soon" page if Cloudflare Pages is available

**Fix www.youandinotai.com:**
- Should CNAME to youandinotai.com (or same target as root)

**Leave alone:**
- youandinotai.online (redirect domain, separate zone)
- Any MX records (email)
- Any TXT records (verification, SPF, DKIM)

### TASK 3: Delete Dead Tunnel
Go to https://dash.cloudflare.com — Zero Trust > Access > Tunnels
- Find tunnel: e7de7653-980c-49fc-a116-4a05871025ae
- Status should show DEAD/Inactive (T5500 was wiped)
- Delete or disable it — it will never come back

### TASK 4: Verify
After DNS changes:
1. Test: https://api.youandinotai.com/docs — should return HTTP 200 (FastAPI Swagger docs)
2. Test: https://dateapp-backend-io5tscl75a-ue.a.run.app/docs — should also return HTTP 200 (direct Cloud Run)
3. Both should show the same content

## CRITICAL INFO
- Cloudflare Account ID: 516a3a855f44f5ad8453636d163ae25d
- Cloud Run URL: https://dateapp-backend-io5tscl75a-ue.a.run.app
- Cloud Run is LIVE and returning HTTP 200 right now
- Dead tunnel ID: e7de7653-980c-49fc-a116-4a05871025ae
- The old T5500 origin server (192.168.0.15) is WIPED — do not point anything to it
- Valentine's Day launch: Feb 14, 2026 (4 days away!)

## AFTER YOU'RE DONE
Give Josh the new API token so he can:
1. Add it to the vault (MASTER-UNIVERSAL-ENV-TROLLZ1004.env)
2. Store it in GCP Secret Manager
3. Wipe SABRETOOTH (last node to reset)

## ACCOUNT
- Email on Cloudflare: likely joshlcoleman@gmail.com
- If prompted to log in, ask Josh for credentials
