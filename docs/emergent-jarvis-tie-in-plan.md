# Emergent Dashboard → JARVIS Tie-In Scope & Architecture Plan

**Purpose:** Feed the CRACO React app (`C:\ANTIGRAVITY\frontend`) metrics into Joshua's JARVIS-style dashboard on the Alienware node.

---

## 1. Data Endpoints & JSON Shapes

### Endpoint 1: `/api/v1/health` (Backend Core)
- **URL:** `http://192.168.0.8:8000/api/v1/health`
- **Method:** `GET`
- **JSON Shape:**
```json
{
  "status": "ok",
  "db_connected": true,
  "redis_connected": true,
  "square_connected": true,
  "square_signature_configured": false,
  "wallet_rails_proven": false,
  "wallet_rails_status": "unproven",
  "payment_proof_labels": [],
  "user_count": 3
}
```

### Endpoint 2: `/api/v1/analytics/summary` (Funnel & Revenue Metrics)
- **URL:** `http://192.168.0.8:8000/api/v1/analytics/summary`
- **Method:** `GET` (Requires Admin Auth)
- **JSON Shape:**
```json
{
  "total_events": 142,
  "unique_users": 3,
  "events_by_type": {
    "page_view": 98,
    "signup": 3,
    "verify_complete": 1,
    "subscribe": 0
  },
  "signups_today": 1,
  "signups_total": 3,
  "verified_count": 1,
  "paying_count": 0
}
```

### Endpoint 3: Emergent Component Telemetry (`C:\ANTIGRAVITY\frontend\src`)
- Components exposed: `DataPrivacyDashboard`, `SolarFlareSOS`, `VolunteerHub`, `LoveBot`, `RoyaltyDeck`
- Data model: Local React state + API hooks
- JARVIS integration target: Extract component state via postMessage or REST bridge

---

## 2. LAN Reachability & Binding (Alienware Access)

To make the Emergent dashboard reachable from the Alienware node (`192.168.0.x` LAN):

### Step 1: Bind to `0.0.0.0`
Update `C:\ANTIGRAVITY\frontend\package.json` or start command to include `HOST=0.0.0.0`:
```bash
HOST=0.0.0.0 PORT=3210 npx craco start
```

### Step 2: Windows Firewall Rule for Port 3210
Run PowerShell (Admin) to allow inbound LAN traffic:
```powershell
New-NetFirewallRule -Name "EmergentDashboard-3210" -DisplayName "Emergent Dashboard (Port 3210)" -Direction Inbound -Protocol TCP -LocalPort 3210 -Action Allow
```

### Step 3: Access URL for Alienware JARVIS
- **URL:** `http://192.168.0.8:3210/`
- **CORS Config:** Ensure `ALLOWED_ORIGINS` includes Alienware IP / host

---

## 3. Implementation Steps (Short Plan)

1. Add `HOST=0.0.0.0` to `C:\ANTIGRAVITY\frontend\launch-emergent-dashboard.cmd`
2. Run firewall rule command for port 3210
3. Create lightweight JSON telemetry endpoint `/api/telemetry` for JARVIS polling
4. Connect Alienware JARVIS dashboard iframe/fetch to `http://192.168.0.8:3210/`

*Plan ready for implementation upon request.*
