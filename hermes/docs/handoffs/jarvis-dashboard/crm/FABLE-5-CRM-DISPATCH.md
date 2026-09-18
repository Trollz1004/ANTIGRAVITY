
server.py below and requirements and htmml with claude fable prompts 

# FABLE 5 DISPATCH — Lead Generation CRM Integration into ANTIGRAVITY

## Context for Fable
Emergent-built Lead Generation CRM is running at:
- **Preview URL**: https://civic-marketplace-1.preview.emergentagent.com
- **API Base**: https://civic-marketplace-1.preview.emergentagent.com/api
- **Stack**: FastAPI + MongoDB + React + Shadcn UI
- **AI**: GPT-5.2 via Emergent LLM key (already configured)

This CRM needs to be absorbed into ANTIGRAVITY's Agent Hub (:3130) on Sabretooth C: drive, replacing the standalone deployment with in-house code that talks to your existing infrastructure.

## What the CRM Currently Does
1. **Lead Management** — CRUD, scoring (0-100), funnel tracking (new→contacted→engaged→qualified→converted)
2. **Email Campaigns** — Templates with {{name}} personalization, drip sequences, Resend API ready
3. **Automation Rules** — Triggers (new_lead, score_threshold, status_change) → Actions (send_email, add_tag, webhook)
4. **Landing Pages** — Builder with conversion tracking, public form endpoints
5. **Multi-Platform Hub** — API keys for each app to POST leads to central CRM
6. **AI Lead Qualification** — GPT-5.2 analyzes leads, suggests next actions
7. **Social Capture** — Forms for Facebook/Instagram/Twitter/LinkedIn webhook integration
8. **Reports** — Daily lead report, source quality, city performance

## Integration Points with ANTIGRAVITY

### 1. Agent Hub Absorption (Priority)
The CRM's backend should merge into `services/agent-hub/` as a **leads module**:
```
services/agent-hub/
├── src/
│   ├── index.js          # existing hub
│   ├── task.js           # existing AgentTask
│   ├── leads/            # NEW — absorb CRM
│   │   ├── model.js      # Lead schema (mirrors current)
│   │   ├── routes.js     # /api/leads/* endpoints
│   │   ├── scoring.js    # Auto-scoring algorithm
│   │   ├── automation.js # Rule engine
│   │   └── ai-qualify.js # GPT qualification
│   ├── campaigns/        # Email campaigns
│   ├── landing-pages/    # Page builder
│   └── platforms/        # Multi-app ingestion
```

### 2. Database Migration
Current: MongoDB on Emergent
Target: **Supabase** (`jmvgdqomvnkfgknmgwxp`) — same as Agent Hub

Tables to create:
- `leads` — mirrors current Lead model
- `email_templates`
- `email_campaigns`
- `email_logs`
- `drip_sequences`
- `automation_rules`
- `landing_pages`
- `social_captures`
- `platforms` (for multi-app API keys)

### 3. Platform Integration Map
These apps should POST leads to Agent Hub's `/api/platforms/ingest`:

| Platform | Current API Key Prefix | Agent Hub Platform ID |
|----------|----------------------|----------------------|
| Youandinotai.com | yai_ | youandinotai |
| Recycle.org | rec_ | recycle |
| AI-Solutions.store | ais_ | aisolutions |
| Aidiesitall.website | aid_ | aidiesitall |
| DREAM ONLINE | dream_ | dream-online |

### 4. Slack Integration
Post lead events to your 3 channels:
- `#antigravity-platform` (C0BF2C7BAES) — business leads (ANT-DATEAPP, ANT-EBAY, ANT-AISOLUTIONS)
- `#dream-online` (C0BF4CHG2HG) — DREAM player signups/community leads
- `#fcc-claude` — AI qualification results, automation executions

Events to post:
- New hot lead (score ≥70)
- Lead status → qualified
- Campaign sent
- Automation rule executed

### 5. Hermes Workspace Memory Integration
The CRM should write lead insights to Hermes Workspace (:9119) knowledge bank:
- Lead qualification summaries
- Campaign performance data
- Source quality rankings
- City-based volunteer trends

This becomes Hermes's market intelligence for content generation.

### 6. DREAM ONLINE NPC Integration (E:\ drive)
Leads who sign up via DREAM ONLINE platform:
- Tag with `platform:dream-online`
- Feed to Hermes World for NPC personality seeding
- Volunteer interests → NPC faction affiliations
- City data → NPC regional spawning

Endpoint for DREAM:
```
POST /api/platforms/ingest?api_key=dream_[key]
{
  "name": "PlayerName",
  "email": "player@email.com", 
  "city": "New York",
  "interests": ["Environmental", "Community Development"],
  "game_data": {
    "character_name": "...",
    "faction": "..."
  }
}
```

### 7. 1min.AI Integration
Replace Emergent LLM key with 1min.AI for:
- Lead qualification (`/api/leads/{id}/ai-qualify`)
- Content generation (existing `/api/content/generate`)
- Hashtag recommendations

Config:
```
ONEMIN_AI_API_KEY=[from vault]
ONEMIN_AI_ENDPOINT=https://api.1min.ai/v1  # verify OpenAI-compat
```

### 8. Automation Webhook → Zapier/Agent Hub Tasks
When automation rule fires with `action_type: webhook`:
- If URL is Agent Hub → create AgentTask
- If URL is Zapier → external dispatch
- If URL is OpenClaw → support ticket

Pre-configured rules to migrate:
1. "Send to Zapier on Qualified" — status→qualified → webhook
2. "Tag High Scorers as VIP" — score≥80 → add tag "vip"
3. "Welcome New Leads" — new_lead → send_email (template_id)

## Execution Steps for Subagents

### Phase 1 — Schema & Migration
1. Create Supabase tables matching CRM models
2. Export current MongoDB data from Emergent preview
3. Import to Supabase with ID preservation

### Phase 2 — Code Absorption
1. Port FastAPI routes to Express (Agent Hub pattern)
2. Adapt MongoDB queries to Supabase/Postgres
3. Merge into `services/agent-hub/src/leads/`
4. Single source of truth — no duplicate PLATFORMS arrays

### Phase 3 — Integration Wiring
1. Add SLACK_BOT_TOKEN posting for lead events
2. Add Hermes Workspace memory bridge (stub endpoint → :9119)
3. Add 1min.AI as LLM provider (fallback: OpenRouter)
4. Add DREAM ONLINE platform with game_data field support

### Phase 4 — Frontend
Options:
a) Keep React frontend separate, point to new Agent Hub API
b) Absorb into existing ANTIGRAVITY dashboard
c) Headless API only — Slack + Hermes surfaces

Recommend: **(a)** for now — fastest path. Frontend at `C:\antigravity\services\lead-crm-ui\`

### Phase 5 — Cleanup
1. Document in repo README
2. Update ROSTER.md with lead-crm service
3. PR → merge → delete branch
4. Kill Emergent preview deployment (optional — can keep as backup)

## API Reference for Agent Hub Integration

Base URL (after absorption): `http://127.0.0.1:3130/api`

### Core Endpoints to Preserve
```
# Leads
GET    /api/leads                    # list + filter
POST   /api/leads                    # create (triggers automations)
GET    /api/leads/:id                # get one
PATCH  /api/leads/:id                # update
POST   /api/leads/:id/ai-qualify     # GPT qualification
GET    /api/leads/stats/overview     # dashboard stats

# Email
GET    /api/templates                # list templates
POST   /api/templates                # create template
GET    /api/campaigns                # list campaigns
POST   /api/campaigns                # create campaign
POST   /api/campaigns/:id/send       # send to segment

# Automation
GET    /api/automation/rules         # list rules
POST   /api/automation/rules         # create rule
PATCH  /api/automation/rules/:id/toggle  # activate/pause

# Landing Pages
GET    /api/landing-pages            # list pages
POST   /api/landing-pages            # create page
GET    /api/landing-pages/:slug      # public page (increments visits)
POST   /api/landing-pages/:slug/submit  # form submission → lead

# Multi-Platform
GET    /api/platforms                # list connected apps
POST   /api/platforms                # register new app (returns API key)
POST   /api/platforms/ingest?api_key=X  # universal lead ingestion

# Reports
GET    /api/reports/daily            # daily summary
GET    /api/reports/lead-quality     # source rankings
GET    /api/notifications            # smart alerts
```

## What Josh Needs to Provide
1. **Resend API key** — full key from https://resend.com/api-keys (CSV was truncated)
2. **1min.AI API key** — for LLM replacement
3. **Slack Bot Token** — per `scripts/setup-slack-claude.ps1` flow
4. **Supabase connection string** — already have project ref, need direct Postgres URL

## Success Criteria
- [ ] `GET :3130/api/leads` returns data from Supabase
- [ ] `POST :3130/api/platforms/ingest` creates lead with platform tag
- [ ] Automation rule fires → Slack post appears in #antigravity-platform
- [ ] AI qualification calls 1min.AI (or fallback)
- [ ] Landing page form → lead created → drip sequence enrolls
- [ ] All code in `Trollz1004/ANTIGRAVITY` main branch
- [ ] No Paperclip, no Base44, no external CRM dependencies

## UNTIL NO KID IN NEED
Kids 13 and under = FREE on every platform. This CRM tracks volunteer leads for cause platforms. Revenue waterfall: ops → runway → treasury → #UntilNoKidInNeed.

---
*Generated from Emergent Lead Generation CRM build session — ready for Fable 5 orchestration*


# Claude CLI Integration Prompt for Your Apps

Copy and paste this prompt to Claude CLI (Opus) to integrate any of your apps with the Youandinotai Lead Generation CRM.

---

## PROMPT TO PASTE:

```
I need to integrate my app with the Youandinotai Lead Generation CRM. Here's the API details:

## CRM API Endpoint
POST https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest

## Authentication
Query parameter: api_key=YOUR_PLATFORM_API_KEY

## Request Body (JSON)
{
  "name": "Lead Name",
  "email": "lead@email.com",
  "city": "City Name",
  "phone": "+1234567890",  // optional
  "interests": ["Environmental", "Education", "Health"]  // optional array
}

## Available Interest Categories
Environmental, Education, Health, Animal Welfare, Homelessness, Food Security, Youth Programs, Senior Care, Disaster Relief, Community Development, Arts & Culture, Mental Health

## My Platform API Keys:
- Youandinotai.com: yai_[GET_FROM_PLATFORM_HUB]
- Recycle.org: rec_[GET_FROM_PLATFORM_HUB]
- AI-Solutions.store: ais_[GET_FROM_PLATFORM_HUB]
- Aidiesitall.website: aid_[GET_FROM_PLATFORM_HUB]

## What I Need:
1. Add lead capture to my [APP_NAME] app
2. When a user signs up/submits a form, send their data to the CRM
3. Handle success/error responses
4. Log the lead_id returned for tracking

## Example Response (Success):
{
  "message": "Lead ingested successfully",
  "lead_id": "uuid-here",
  "platform": "Youandinotai.com"
}

## My App's Tech Stack: [SPECIFY: Node.js / Python / React / etc.]

Please write the integration code for my app.
```

---

## CODE SNIPPETS FOR EACH PLATFORM

### Node.js / Express
```javascript
const axios = require('axios');

const CRM_API = 'https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest';
const API_KEY = 'YOUR_PLATFORM_API_KEY'; // Get from Platform Hub

async function sendLeadToCRM(leadData) {
  try {
    const response = await axios.post(`${CRM_API}?api_key=${API_KEY}`, {
      name: leadData.name,
      email: leadData.email,
      city: leadData.city || 'Unknown',
      phone: leadData.phone,
      interests: leadData.interests || []
    });
    
    console.log('Lead sent to CRM:', response.data.lead_id);
    return response.data;
  } catch (error) {
    console.error('CRM Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage in your signup/form handler:
app.post('/signup', async (req, res) => {
  // Your existing signup logic...
  
  // Send to CRM
  await sendLeadToCRM({
    name: req.body.name,
    email: req.body.email,
    city: req.body.city,
    interests: req.body.interests
  });
  
  res.json({ success: true });
});
```

### Python / FastAPI
```python
import httpx

CRM_API = "https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest"
API_KEY = "YOUR_PLATFORM_API_KEY"  # Get from Platform Hub

async def send_lead_to_crm(lead_data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CRM_API}?api_key={API_KEY}",
            json={
                "name": lead_data.get("name"),
                "email": lead_data.get("email"),
                "city": lead_data.get("city", "Unknown"),
                "phone": lead_data.get("phone"),
                "interests": lead_data.get("interests", [])
            }
        )
        response.raise_for_status()
        return response.json()

# Usage:
@app.post("/signup")
async def signup(data: SignupRequest):
    # Your existing signup logic...
    
    # Send to CRM
    result = await send_lead_to_crm({
        "name": data.name,
        "email": data.email,
        "city": data.city
    })
    
    return {"success": True, "crm_lead_id": result["lead_id"]}
```

### cURL (for testing)
```bash
curl -X POST "https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest?api_key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "city": "New York",
    "interests": ["Environmental", "Education"]
  }'
```

### React / Frontend
```javascript
const CRM_API = 'https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest';
const API_KEY = 'YOUR_PLATFORM_API_KEY';

async function submitToCRM(formData) {
  const response = await fetch(`${CRM_API}?api_key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      city: formData.city,
      interests: formData.interests
    })
  });
  
  if (!response.ok) throw new Error('CRM submission failed');
  return response.json();
}
```

---

## GET YOUR API KEYS

1. Go to: https://civic-marketplace-1.preview.emergentagent.com/platforms
2. Find your platform card
3. Click "Copy" next to the API key
4. Replace `YOUR_PLATFORM_API_KEY` in the code above

---

## WHAT HAPPENS AFTER A LEAD IS SENT

1. Lead is created in the CRM with automatic scoring
2. Automation rules trigger (welcome emails, tags, etc.)
3. AI qualification runs (if enabled)
4. Lead appears in the Lead CRM dashboard
5. Smart notifications alert you about hot leads

---

## ZAPIER INTEGRATION (When Ready)

1. Create a Zap with "Webhooks by Zapier" trigger (Catch Hook)
2. Copy the webhook URL
3. Go to Automation Center in the CRM
4. Create a rule:
   - Trigger: "Status Changes" → "qualified"
   - Action: "Send Webhook" → paste your Zapier URL
5. Now qualified leads automatically trigger your Zap!

// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => {
  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

// Wrap with visual edits (automatically adds babel plugin, dev server, and overlay in dev mode)
if (isDevServer) {
  try {
    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
    webpackConfig = withVisualEdits(webpackConfig);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
      console.warn(
        "[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled."
      );
    } else {
      throw err;
    }
  }
}

module.exports = webpackConfig;

<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="A product of emergent.sh" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
        <!--
        manifest.json provides metadata used when your web app is installed on a
        user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
        -->
        <!--
        Notice the use of %PUBLIC_URL% in the tags above.
        It will be replaced with the URL of the `public` folder during the build.
        Only files inside the `public` folder can be referenced from the HTML.

        Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
        work correctly both with client-side routing and a non-root public URL.
        Learn how to configure a non-root public URL by running `npm run build`.
        -->
        <title>Emergent | Fullstack App</title>
        <script>window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);</script>
        <script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
                <script>
            !(function (t, e) {
                var o, n, p, r;
                e.__SV ||
                    ((window.posthog = e),
                    (e._i = []),
                    (e.init = function (i, s, a) {
                        function g(t, e) {
                            var o = e.split(".");
                            2 == o.length && ((t = t[o[0]]), (e = o[1])),
                                (t[e] = function () {
                                    t.push(
                                        [e].concat(
                                            Array.prototype.slice.call(
                                                arguments,
                                                0,
                                            ),
                                        ),
                                    );
                                });
                        }
                        ((p = t.createElement("script")).type =
                            "text/javascript"),
                            (p.crossOrigin = "anonymous"),
                            (p.async = !0),
                            (p.src =
                                s.api_host.replace(
                                    ".i.posthog.com",
                                    "-assets.i.posthog.com",
                                ) + "/static/array.js"),
                            (r =
                                t.getElementsByTagName(
                                    "script",
                                )[0]).parentNode.insertBefore(p, r);
                        var u = e;
                        for (
                            void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
                                u.people = u.people || [],
                                u.toString = function (t) {
                                    var e = "posthog";
                                    return (
                                        "posthog" !== a && (e += "." + a),
                                        t || (e += " (stub)"),
                                        e
                                    );
                                },
                                u.people.toString = function () {
                                    return u.toString(1) + ".people (stub)";
                                },
                                o =
                                    "init me ws ys ps bs capture je Di ks register register_once register_for_session unregister unregister_for_session Ps getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Es $s createPersonProfile Is opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing Ss debug xs getPageViewId captureTraceFeedback captureTraceMetric".split(
                                        " ",
                                    ),
                                n = 0;
                            n < o.length;
                            n++
                        )
                            g(u, o[n]);
                        e._i.push([i, s, a]);
                    }),
                    (e.__SV = 1));
            })(document, window.posthog || []);
            posthog.init("phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs", {
                api_host: "https://us.i.posthog.com",
                person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well,
                session_recording: {
                    recordCrossOriginIframes: true,
                    capturePerformance: false,
                },
            });
        </script>
    </body>
</html>

aiohappyeyeballs==2.6.1
aiohttp==3.13.3
aiosignal==1.4.0
annotated-doc==0.0.4
annotated-types==0.7.0
anyio==4.13.0
attrs==26.1.0
bcrypt==4.1.3
black==26.3.1
boto3==1.42.75
botocore==1.42.75
certifi==2026.2.25
cffi==2.0.0
charset-normalizer==3.4.6
click==8.3.1
cryptography==46.0.5
distro==1.9.0
dnspython==2.8.0
ecdsa==0.19.1
email-validator==2.3.0
emergentintegrations==0.1.0
fastapi==0.110.1
fastuuid==0.14.0
filelock==3.25.2
flake8==7.3.0
frozenlist==1.8.0
fsspec==2026.2.0
google-ai-generativelanguage==0.6.15
google-api-core==2.30.0
google-api-python-client==2.193.0
google-auth==2.49.1
google-auth-httplib2==0.3.0
google-genai==1.68.0
google-generativeai==0.8.6
googleapis-common-protos==1.73.0
grpcio==1.78.0
grpcio-status==1.71.2
h11==0.16.0
hf-xet==1.4.2
httpcore==1.0.9
httplib2==0.31.2
httpx==0.28.1
huggingface_hub==1.7.2
idna==3.11
importlib_metadata==9.0.0
iniconfig==2.3.0
isort==8.0.1
Jinja2==3.1.6
jiter==0.13.0
jmespath==1.1.0
jq==1.11.0
jsonschema==4.26.0
jsonschema-specifications==2025.9.1
librt==0.8.1
litellm==1.80.0
markdown-it-py==4.0.0
MarkupSafe==3.0.3
mccabe==0.7.0
mdurl==0.1.2
motor==3.3.1
multidict==6.7.1
mypy==1.19.1
mypy_extensions==1.1.0
numpy==2.4.3
oauthlib==3.3.1
openai==1.99.9
packaging==26.0
pandas==3.0.1
passlib==1.7.4
pathspec==1.0.4
pillow==12.1.1
platformdirs==4.9.4
pluggy==1.6.0
propcache==0.4.1
proto-plus==1.27.1
protobuf==5.29.6
pyasn1==0.6.3
pyasn1_modules==0.4.2
pycodestyle==2.14.0
pycparser==3.0
pydantic==2.12.5
pydantic_core==2.41.5
pyflakes==3.4.0
Pygments==2.19.2
PyJWT==2.12.1
pymongo==4.5.0
pyparsing==3.3.2
pytest==9.0.2
python-dateutil==2.9.0.post0
python-dotenv==1.2.2
python-jose==3.5.0
python-multipart==0.0.22
pytokens==0.4.1
PyYAML==6.0.3
referencing==0.37.0
regex==2026.2.28
requests==2.32.5
requests-oauthlib==2.0.0
resend==2.29.0
rich==14.3.3
rpds-py==0.30.0
rsa==4.9.1
s3transfer==0.16.0
s5cmd==0.2.0
shellingham==1.5.4
six==1.17.0
sniffio==1.3.1
starlette==0.37.2
stripe==14.4.1
tenacity==9.1.4
tiktoken==0.12.0
tokenizers==0.22.2
tqdm==4.67.3
typer==0.24.1
typing-inspection==0.4.2
typing_extensions==4.15.0
tzdata==2025.3
uritemplate==4.2.0
urllib3==2.6.3
uvicorn==0.25.0
watchfiles==1.1.1
websockets==16.0
yarl==1.23.0
zipp==3.23.0

from fastapi import FastAPI, APIRouter, HTTPException, Query, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== DATA ====================

US_CITIES = [
    {"name": "New York", "state": "NY", "population": 8336817, "region": "Northeast"},
    {"name": "Los Angeles", "state": "CA", "population": 3979576, "region": "West"},
    {"name": "Chicago", "state": "IL", "population": 2693976, "region": "Midwest"},
    {"name": "Houston", "state": "TX", "population": 2320268, "region": "South"},
    {"name": "Phoenix", "state": "AZ", "population": 1680992, "region": "West"},
    {"name": "Philadelphia", "state": "PA", "population": 1584064, "region": "Northeast"},
    {"name": "San Antonio", "state": "TX", "population": 1547253, "region": "South"},
    {"name": "San Diego", "state": "CA", "population": 1423851, "region": "West"},
    {"name": "Dallas", "state": "TX", "population": 1343573, "region": "South"},
    {"name": "San Jose", "state": "CA", "population": 1021795, "region": "West"},
    {"name": "Austin", "state": "TX", "population": 978908, "region": "South"},
    {"name": "Jacksonville", "state": "FL", "population": 911507, "region": "South"},
    {"name": "Fort Worth", "state": "TX", "population": 909585, "region": "South"},
    {"name": "Columbus", "state": "OH", "population": 905748, "region": "Midwest"},
    {"name": "Charlotte", "state": "NC", "population": 879709, "region": "South"},
    {"name": "San Francisco", "state": "CA", "population": 873965, "region": "West"},
    {"name": "Indianapolis", "state": "IN", "population": 876384, "region": "Midwest"},
    {"name": "Seattle", "state": "WA", "population": 737015, "region": "West"},
    {"name": "Denver", "state": "CO", "population": 715522, "region": "West"},
    {"name": "Washington", "state": "DC", "population": 689545, "region": "South"},
    {"name": "Boston", "state": "MA", "population": 692600, "region": "Northeast"},
    {"name": "El Paso", "state": "TX", "population": 678815, "region": "South"},
    {"name": "Nashville", "state": "TN", "population": 689447, "region": "South"},
    {"name": "Detroit", "state": "MI", "population": 639111, "region": "Midwest"},
    {"name": "Oklahoma City", "state": "OK", "population": 681054, "region": "South"},
    {"name": "Portland", "state": "OR", "population": 652503, "region": "West"},
    {"name": "Las Vegas", "state": "NV", "population": 641903, "region": "West"},
    {"name": "Memphis", "state": "TN", "population": 633104, "region": "South"},
    {"name": "Louisville", "state": "KY", "population": 617638, "region": "South"},
    {"name": "Baltimore", "state": "MD", "population": 585708, "region": "South"},
    {"name": "Milwaukee", "state": "WI", "population": 577222, "region": "Midwest"},
    {"name": "Albuquerque", "state": "NM", "population": 564559, "region": "West"},
    {"name": "Tucson", "state": "AZ", "population": 542629, "region": "West"},
    {"name": "Fresno", "state": "CA", "population": 542107, "region": "West"},
    {"name": "Mesa", "state": "AZ", "population": 504258, "region": "West"},
    {"name": "Sacramento", "state": "CA", "population": 524943, "region": "West"},
    {"name": "Atlanta", "state": "GA", "population": 498715, "region": "South"},
    {"name": "Kansas City", "state": "MO", "population": 508090, "region": "Midwest"},
    {"name": "Colorado Springs", "state": "CO", "population": 478961, "region": "West"},
    {"name": "Miami", "state": "FL", "population": 467963, "region": "South"},
    {"name": "Raleigh", "state": "NC", "population": 467665, "region": "South"},
    {"name": "Omaha", "state": "NE", "population": 486051, "region": "Midwest"},
    {"name": "Long Beach", "state": "CA", "population": 466742, "region": "West"},
    {"name": "Virginia Beach", "state": "VA", "population": 459470, "region": "South"},
    {"name": "Oakland", "state": "CA", "population": 433031, "region": "West"},
    {"name": "Minneapolis", "state": "MN", "population": 429954, "region": "Midwest"},
    {"name": "Tulsa", "state": "OK", "population": 413066, "region": "South"},
    {"name": "Tampa", "state": "FL", "population": 399700, "region": "South"},
    {"name": "Arlington", "state": "TX", "population": 398854, "region": "South"},
    {"name": "New Orleans", "state": "LA", "population": 383997, "region": "South"},
]

CATEGORIES = [
    "Environmental", "Education", "Health", "Animal Welfare", "Homelessness",
    "Food Security", "Youth Programs", "Senior Care", "Disaster Relief", 
    "Community Development", "Arts & Culture", "Mental Health"
]

LEAD_SOURCES = ["website", "social_media", "referral", "event", "cold_outreach", "landing_page", "partner"]

# ==================== MODELS ====================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class City(BaseModel):
    name: str
    state: str
    population: int
    region: str

# Lead Models
class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    city: str
    interests: List[str] = []
    source: str = "website"
    score: int = 0
    status: str = "new"  # new, contacted, engaged, qualified, converted, lost
    tags: List[str] = []
    notes: str = ""
    last_contacted: Optional[datetime] = None
    email_opens: int = 0
    email_clicks: int = 0
    conversion_value: float = 0.0
    campaign_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    city: str
    interests: List[str] = []
    source: str = "website"
    tags: List[str] = []
    notes: str = ""
    campaign_id: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    score: Optional[int] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    conversion_value: Optional[float] = None

# Email Campaign Models
class EmailTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    html_content: str
    category: str = "general"
    variables: List[str] = []  # e.g., {{name}}, {{city}}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    html_content: str
    category: str = "general"
    variables: List[str] = []

class EmailCampaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    template_id: str
    target_segment: Dict[str, Any] = {}  # filters: city, interests, status, score_min
    status: str = "draft"  # draft, scheduled, running, paused, completed
    scheduled_at: Optional[datetime] = None
    sent_count: int = 0
    open_count: int = 0
    click_count: int = 0
    bounce_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailCampaignCreate(BaseModel):
    name: str
    template_id: str
    target_segment: Dict[str, Any] = {}
    scheduled_at: Optional[datetime] = None

# Drip Sequence Models
class DripSequence(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    trigger: str  # new_lead, tag_added, status_change
    steps: List[Dict[str, Any]] = []  # [{delay_days: 1, template_id: "xxx"}, ...]
    active: bool = True
    enrolled_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DripSequenceCreate(BaseModel):
    name: str
    trigger: str
    steps: List[Dict[str, Any]]

# Email Log
class EmailLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    campaign_id: Optional[str] = None
    sequence_id: Optional[str] = None
    template_id: str
    email_id: Optional[str] = None  # from Resend
    status: str = "sent"  # sent, opened, clicked, bounced, failed
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None

# Social Lead Capture
class SocialCapture(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str  # facebook, instagram, twitter, linkedin
    campaign_name: str
    form_fields: List[str] = ["name", "email"]
    redirect_url: Optional[str] = None
    leads_captured: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SocialCaptureCreate(BaseModel):
    platform: str
    campaign_name: str
    form_fields: List[str] = ["name", "email"]
    redirect_url: Optional[str] = None

# Group Model (existing)
class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    category: str
    members: int = 0
    posts: int = 0
    engagement_rate: float = 0.0
    trending_score: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupCreate(BaseModel):
    name: str
    city: str
    category: str
    members: int = 0

# ==================== HELPER FUNCTIONS ====================

def calculate_lead_score(lead_data: dict) -> int:
    """Calculate lead score based on engagement and profile completeness"""
    score = 20  # Base score
    
    # Profile completeness
    if lead_data.get('phone'):
        score += 10
    if len(lead_data.get('interests', [])) > 0:
        score += len(lead_data['interests']) * 5
    if lead_data.get('notes'):
        score += 5
    
    # Engagement
    score += lead_data.get('email_opens', 0) * 3
    score += lead_data.get('email_clicks', 0) * 5
    
    # Source quality
    source_scores = {
        'referral': 20,
        'event': 15,
        'landing_page': 10,
        'social_media': 8,
        'website': 5,
        'cold_outreach': 3,
        'partner': 15
    }
    score += source_scores.get(lead_data.get('source', 'website'), 5)
    
    return min(score, 100)  # Cap at 100

async def send_email_async(to_email: str, subject: str, html_content: str, lead_name: str = "") -> Optional[str]:
    """Send email using Resend API"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured")
        return None
    
    # Replace template variables
    html_content = html_content.replace("{{name}}", lead_name)
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}, ID: {email.get('id')}")
        return email.get('id')
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return None

async def process_drip_sequence(lead_id: str, sequence_id: str, step_index: int = 0):
    """Process a drip sequence step for a lead"""
    sequence = await db.drip_sequences.find_one({"id": sequence_id}, {"_id": 0})
    if not sequence or not sequence.get('active'):
        return
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        return
    
    steps = sequence.get('steps', [])
    if step_index >= len(steps):
        return  # Sequence complete
    
    step = steps[step_index]
    template = await db.email_templates.find_one({"id": step.get('template_id')}, {"_id": 0})
    if not template:
        return
    
    # Send email
    email_id = await send_email_async(
        lead['email'],
        template['subject'],
        template['html_content'],
        lead['name']
    )
    
    if email_id:
        # Log the email
        log = EmailLog(
            lead_id=lead_id,
            sequence_id=sequence_id,
            template_id=template['id'],
            email_id=email_id
        )
        await db.email_logs.insert_one(log.model_dump())
        
        # Update lead
        await db.leads.update_one(
            {"id": lead_id},
            {"$set": {"last_contacted": datetime.now(timezone.utc).isoformat()}}
        )

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Youandinotai Lead Generation CRM API"}

# Status routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# City routes
@api_router.get("/cities", response_model=List[City])
async def get_cities(region: Optional[str] = None, limit: int = 50):
    cities = US_CITIES.copy()
    if region:
        cities = [c for c in cities if c["region"].lower() == region.lower()]
    return cities[:limit]

@api_router.get("/cities/stats")
async def get_city_stats():
    total_population = sum(c["population"] for c in US_CITIES)
    regions = {}
    for city in US_CITIES:
        region = city["region"]
        if region not in regions:
            regions[region] = {"count": 0, "population": 0}
        regions[region]["count"] += 1
        regions[region]["population"] += city["population"]
    return {
        "total_cities": len(US_CITIES),
        "total_population": total_population,
        "regions": regions,
        "top_5": US_CITIES[:5]
    }

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

# ==================== LEAD MANAGEMENT ====================

@api_router.post("/leads", response_model=Lead)
async def create_lead(input: LeadCreate, background_tasks: BackgroundTasks):
    """Create a new lead with automatic scoring and drip enrollment"""
    lead_data = input.model_dump()
    lead = Lead(**lead_data)
    lead.score = calculate_lead_score(lead_data)
    
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc.get('last_contacted'):
        doc['last_contacted'] = doc['last_contacted'].isoformat()
    
    await db.leads.insert_one(doc)
    
    # Enroll in new_lead drip sequences
    sequences = await db.drip_sequences.find({"trigger": "new_lead", "active": True}, {"_id": 0}).to_list(100)
    for seq in sequences:
        await db.drip_sequences.update_one({"id": seq['id']}, {"$inc": {"enrolled_count": 1}})
        # Schedule first email (in production, use a job queue)
        background_tasks.add_task(process_drip_sequence, lead.id, seq['id'], 0)
    
    return lead

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    city: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    min_score: Optional[int] = None,
    tag: Optional[str] = None,
    campaign_id: Optional[str] = None,
    limit: int = 100
):
    """Get leads with advanced filtering"""
    query = {}
    if city:
        query["city"] = city
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    if min_score:
        query["score"] = {"$gte": min_score}
    if tag:
        query["tags"] = tag
    if campaign_id:
        query["campaign_id"] = campaign_id
    
    leads = await db.leads.find(query, {"_id": 0}).sort("score", -1).to_list(limit)
    for lead in leads:
        for dt_field in ['created_at', 'updated_at', 'last_contacted']:
            if isinstance(lead.get(dt_field), str):
                lead[dt_field] = datetime.fromisoformat(lead[dt_field])
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for dt_field in ['created_at', 'updated_at', 'last_contacted']:
        if isinstance(lead.get(dt_field), str):
            lead[dt_field] = datetime.fromisoformat(lead[dt_field])
    return lead

@api_router.patch("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, update: LeadUpdate):
    """Update lead with automatic score recalculation"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Recalculate score
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    new_score = calculate_lead_score(lead)
    await db.leads.update_one({"id": lead_id}, {"$set": {"score": new_score}})
    lead['score'] = new_score
    
    for dt_field in ['created_at', 'updated_at', 'last_contacted']:
        if isinstance(lead.get(dt_field), str):
            lead[dt_field] = datetime.fromisoformat(lead[dt_field])
    return lead

@api_router.get("/leads/stats/overview")
async def get_lead_stats():
    """Get comprehensive lead statistics"""
    total = await db.leads.count_documents({})
    
    # By status
    by_status = {}
    for status in ["new", "contacted", "engaged", "qualified", "converted", "lost"]:
        count = await db.leads.count_documents({"status": status})
        by_status[status] = count
    
    # By source
    by_source = {}
    for source in LEAD_SOURCES:
        count = await db.leads.count_documents({"source": source})
        by_source[source] = count
    
    # By city (top 10)
    by_city = await db.leads.aggregate([
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    # Score distribution
    score_ranges = {
        "hot": await db.leads.count_documents({"score": {"$gte": 70}}),
        "warm": await db.leads.count_documents({"score": {"$gte": 40, "$lt": 70}}),
        "cold": await db.leads.count_documents({"score": {"$lt": 40}})
    }
    
    # Conversion metrics
    converted = await db.leads.count_documents({"status": "converted"})
    conversion_rate = (converted / total * 100) if total > 0 else 0
    
    # Total conversion value
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$conversion_value"}}}]
    result = await db.leads.aggregate(pipeline).to_list(1)
    total_value = result[0]['total'] if result else 0
    
    return {
        "total": total,
        "by_status": by_status,
        "by_source": by_source,
        "by_city": [{"city": c["_id"], "count": c["count"]} for c in by_city],
        "score_ranges": score_ranges,
        "conversion_rate": round(conversion_rate, 2),
        "total_conversion_value": total_value
    }

# ==================== EMAIL TEMPLATES ====================

@api_router.post("/templates", response_model=EmailTemplate)
async def create_template(input: EmailTemplateCreate):
    template = EmailTemplate(**input.model_dump())
    doc = template.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.email_templates.insert_one(doc)
    return template

@api_router.get("/templates", response_model=List[EmailTemplate])
async def get_templates(category: Optional[str] = None):
    query = {"category": category} if category else {}
    templates = await db.email_templates.find(query, {"_id": 0}).to_list(100)
    for t in templates:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return templates

@api_router.get("/templates/{template_id}", response_model=EmailTemplate)
async def get_template(template_id: str):
    template = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if isinstance(template.get('created_at'), str):
        template['created_at'] = datetime.fromisoformat(template['created_at'])
    return template

# ==================== EMAIL CAMPAIGNS ====================

@api_router.post("/campaigns", response_model=EmailCampaign)
async def create_campaign(input: EmailCampaignCreate):
    campaign = EmailCampaign(**input.model_dump())
    doc = campaign.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('scheduled_at'):
        doc['scheduled_at'] = doc['scheduled_at'].isoformat()
    await db.email_campaigns.insert_one(doc)
    return campaign

@api_router.get("/campaigns", response_model=List[EmailCampaign])
async def get_campaigns(status: Optional[str] = None):
    query = {"status": status} if status else {}
    campaigns = await db.email_campaigns.find(query, {"_id": 0}).to_list(100)
    for c in campaigns:
        for dt_field in ['created_at', 'scheduled_at']:
            if isinstance(c.get(dt_field), str):
                c[dt_field] = datetime.fromisoformat(c[dt_field])
    return campaigns

@api_router.post("/campaigns/{campaign_id}/send")
async def send_campaign(campaign_id: str, background_tasks: BackgroundTasks):
    """Send a campaign to all matching leads"""
    campaign = await db.email_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    template = await db.email_templates.find_one({"id": campaign['template_id']}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Build query from segment
    query = {}
    segment = campaign.get('target_segment', {})
    if segment.get('city'):
        query['city'] = segment['city']
    if segment.get('interests'):
        query['interests'] = {"$in": segment['interests']}
    if segment.get('status'):
        query['status'] = segment['status']
    if segment.get('min_score'):
        query['score'] = {"$gte": segment['min_score']}
    
    leads = await db.leads.find(query, {"_id": 0}).to_list(10000)
    
    # Update campaign status
    await db.email_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "running"}}
    )
    
    sent_count = 0
    for lead in leads:
        email_id = await send_email_async(
            lead['email'],
            template['subject'],
            template['html_content'],
            lead['name']
        )
        if email_id:
            sent_count += 1
            # Log
            log = EmailLog(
                lead_id=lead['id'],
                campaign_id=campaign_id,
                template_id=template['id'],
                email_id=email_id
            )
            log_doc = log.model_dump()
            log_doc['sent_at'] = log_doc['sent_at'].isoformat()
            await db.email_logs.insert_one(log_doc)
            
            # Update lead
            await db.leads.update_one(
                {"id": lead['id']},
                {"$set": {
                    "last_contacted": datetime.now(timezone.utc).isoformat(),
                    "campaign_id": campaign_id
                }}
            )
    
    # Update campaign stats
    await db.email_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "completed", "sent_count": sent_count}}
    )
    
    return {"message": f"Campaign sent to {sent_count} leads", "sent_count": sent_count}

@api_router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str):
    """Get detailed campaign statistics"""
    campaign = await db.email_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    logs = await db.email_logs.find({"campaign_id": campaign_id}, {"_id": 0}).to_list(10000)
    
    stats = {
        "total_sent": len(logs),
        "opened": sum(1 for log in logs if log.get('status') == 'opened'),
        "clicked": sum(1 for log in logs if log.get('status') == 'clicked'),
        "bounced": sum(1 for log in logs if log.get('status') == 'bounced')
    }
    stats['open_rate'] = (stats['opened'] / stats['total_sent'] * 100) if stats['total_sent'] > 0 else 0
    stats['click_rate'] = (stats['clicked'] / stats['total_sent'] * 100) if stats['total_sent'] > 0 else 0
    
    return stats

# ==================== DRIP SEQUENCES ====================

@api_router.post("/sequences", response_model=DripSequence)
async def create_drip_sequence(input: DripSequenceCreate):
    sequence = DripSequence(**input.model_dump())
    doc = sequence.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.drip_sequences.insert_one(doc)
    return sequence

@api_router.get("/sequences", response_model=List[DripSequence])
async def get_drip_sequences(active_only: bool = False):
    query = {"active": True} if active_only else {}
    sequences = await db.drip_sequences.find(query, {"_id": 0}).to_list(100)
    for s in sequences:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return sequences

@api_router.patch("/sequences/{sequence_id}/toggle")
async def toggle_drip_sequence(sequence_id: str):
    """Toggle a drip sequence active/inactive"""
    sequence = await db.drip_sequences.find_one({"id": sequence_id}, {"_id": 0})
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    new_status = not sequence.get('active', True)
    await db.drip_sequences.update_one({"id": sequence_id}, {"$set": {"active": new_status}})
    return {"id": sequence_id, "active": new_status}

# ==================== SOCIAL LEAD CAPTURE ====================

@api_router.post("/social-capture", response_model=SocialCapture)
async def create_social_capture(input: SocialCaptureCreate):
    """Create a social media lead capture campaign"""
    capture = SocialCapture(**input.model_dump())
    doc = capture.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.social_captures.insert_one(doc)
    return capture

@api_router.get("/social-capture", response_model=List[SocialCapture])
async def get_social_captures(platform: Optional[str] = None):
    query = {"platform": platform} if platform else {}
    captures = await db.social_captures.find(query, {"_id": 0}).to_list(100)
    for c in captures:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return captures

@api_router.post("/social-capture/{capture_id}/submit")
async def submit_social_lead(capture_id: str, lead_data: dict, background_tasks: BackgroundTasks):
    """Submit a lead from social media capture form"""
    capture = await db.social_captures.find_one({"id": capture_id}, {"_id": 0})
    if not capture or not capture.get('active'):
        raise HTTPException(status_code=404, detail="Capture form not found or inactive")
    
    # Create lead from form data
    lead_input = LeadCreate(
        name=lead_data.get('name', 'Unknown'),
        email=lead_data.get('email'),
        city=lead_data.get('city', 'Unknown'),
        phone=lead_data.get('phone'),
        interests=lead_data.get('interests', []),
        source="social_media",
        tags=[capture['platform'], capture['campaign_name']]
    )
    
    lead = await create_lead(lead_input, background_tasks)
    
    # Update capture stats
    await db.social_captures.update_one(
        {"id": capture_id},
        {"$inc": {"leads_captured": 1}}
    )
    
    return {
        "message": "Lead captured successfully",
        "lead_id": lead.id,
        "redirect_url": capture.get('redirect_url')
    }

# ==================== EMAIL TRACKING WEBHOOKS ====================

@api_router.post("/webhooks/email/open")
async def track_email_open(email_id: str, lead_id: str):
    """Track email open (called by email tracking pixel)"""
    await db.email_logs.update_one(
        {"email_id": email_id},
        {"$set": {"status": "opened", "opened_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.leads.update_one(
        {"id": lead_id},
        {"$inc": {"email_opens": 1}}
    )
    # Recalculate score
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if lead:
        new_score = calculate_lead_score(lead)
        await db.leads.update_one({"id": lead_id}, {"$set": {"score": new_score}})
    return {"status": "tracked"}

@api_router.post("/webhooks/email/click")
async def track_email_click(email_id: str, lead_id: str):
    """Track email click"""
    await db.email_logs.update_one(
        {"email_id": email_id},
        {"$set": {"status": "clicked", "clicked_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.leads.update_one(
        {"id": lead_id},
        {"$inc": {"email_clicks": 1}, "$set": {"status": "engaged"}}
    )
    # Recalculate score
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if lead:
        new_score = calculate_lead_score(lead)
        await db.leads.update_one({"id": lead_id}, {"$set": {"score": new_score}})
    return {"status": "tracked"}

# ==================== GROUPS ====================

@api_router.post("/groups", response_model=Group)
async def create_group(input: GroupCreate):
    group = Group(**input.model_dump())
    doc = group.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.groups.insert_one(doc)
    return group

@api_router.get("/groups", response_model=List[Group])
async def get_groups(city: Optional[str] = None, category: Optional[str] = None, sort_by: str = "members", limit: int = 50):
    query = {}
    if city:
        query["city"] = city
    if category:
        query["category"] = category
    sort_field = sort_by if sort_by in ["members", "posts", "engagement_rate", "trending_score"] else "members"
    groups = await db.groups.find(query, {"_id": 0}).sort(sort_field, -1).to_list(limit)
    for group in groups:
        if isinstance(group.get('created_at'), str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    return groups

@api_router.get("/groups/trending")
async def get_trending_groups(limit: int = 10):
    groups = await db.groups.find({}, {"_id": 0}).sort("trending_score", -1).to_list(limit)
    for group in groups:
        if isinstance(group.get('created_at'), str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    return groups

# ==================== DASHBOARD ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get all dashboard statistics including CRM metrics"""
    total_leads = await db.leads.count_documents({})
    total_groups = await db.groups.count_documents({})
    total_templates = await db.email_templates.count_documents({})
    total_campaigns = await db.email_campaigns.count_documents({})
    total_sequences = await db.drip_sequences.count_documents({})
    
    # Lead funnel
    lead_funnel = {}
    for status in ["new", "contacted", "engaged", "qualified", "converted"]:
        lead_funnel[status] = await db.leads.count_documents({"status": status})
    
    # Hot leads (score >= 70)
    hot_leads = await db.leads.count_documents({"score": {"$gte": 70}})
    
    # Recent activity
    recent_leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    
    # Email stats
    total_emails_sent = await db.email_logs.count_documents({})
    emails_opened = await db.email_logs.count_documents({"status": "opened"})
    
    return {
        "total_leads": total_leads,
        "total_groups": total_groups,
        "total_templates": total_templates,
        "total_campaigns": total_campaigns,
        "total_sequences": total_sequences,
        "total_cities": len(US_CITIES),
        "total_categories": len(CATEGORIES),
        "lead_funnel": lead_funnel,
        "hot_leads": hot_leads,
        "recent_leads": recent_leads,
        "email_stats": {
            "sent": total_emails_sent,
            "opened": emails_opened,
            "open_rate": round((emails_opened / total_emails_sent * 100) if total_emails_sent > 0 else 0, 2)
        }
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed sample data including email templates and sequences"""
    import random
    
    # Clear existing data
    await db.groups.delete_many({})
    await db.leads.delete_many({})
    await db.email_templates.delete_many({})
    await db.drip_sequences.delete_many({})
    
    # Create email templates
    templates = [
        EmailTemplate(
            name="Welcome Email",
            subject="Welcome to Youandinotai - Let's Make a Difference Together!",
            html_content="""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4A7B59;">Welcome, {{name}}!</h1>
                <p>Thank you for joining our community of volunteers and changemakers.</p>
                <p>At Youandinotai, we connect passionate people like you with meaningful volunteer opportunities in your area.</p>
                <a href="https://youandinotai.com/volunteer" style="display: inline-block; background: #4A7B59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Find Opportunities</a>
                <p style="color: #666; margin-top: 20px;">Together, we can make a difference!</p>
            </div>
            """,
            category="onboarding",
            variables=["name"]
        ),
        EmailTemplate(
            name="Weekly Opportunities",
            subject="This Week's Volunteer Opportunities Near You",
            html_content="""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4A7B59;">Hi {{name}},</h1>
                <p>Here are this week's top volunteer opportunities in your area:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="margin: 0;">Environmental Cleanup</h3>
                    <p style="color: #666; margin: 5px 0;">Saturday, 9 AM - Help clean local parks</p>
                </div>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="margin: 0;">Food Bank Support</h3>
                    <p style="color: #666; margin: 5px 0;">Weekdays - Sort and distribute food supplies</p>
                </div>
                <a href="https://youandinotai.com/events" style="display: inline-block; background: #D97757; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">See All Events</a>
            </div>
            """,
            category="engagement",
            variables=["name"]
        ),
        EmailTemplate(
            name="Re-engagement",
            subject="We Miss You, {{name}}! Come Back and Volunteer",
            html_content="""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4A7B59;">Hey {{name}}, we miss you!</h1>
                <p>It's been a while since we've seen you at our volunteer events.</p>
                <p>Your community needs people like you. Here's what's happening:</p>
                <ul>
                    <li>15 new volunteer opportunities this month</li>
                    <li>Over 500 hours of community service logged</li>
                    <li>3 new cause partnerships</li>
                </ul>
                <a href="https://youandinotai.com" style="display: inline-block; background: #4A7B59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Involved Again</a>
            </div>
            """,
            category="reengagement",
            variables=["name"]
        )
    ]
    
    for template in templates:
        doc = template.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.email_templates.insert_one(doc)
    
    # Create drip sequence
    sequence = DripSequence(
        name="New Lead Welcome Sequence",
        trigger="new_lead",
        steps=[
            {"delay_days": 0, "template_id": templates[0].id},
            {"delay_days": 3, "template_id": templates[1].id},
            {"delay_days": 7, "template_id": templates[1].id}
        ],
        active=True
    )
    seq_doc = sequence.model_dump()
    seq_doc['created_at'] = seq_doc['created_at'].isoformat()
    await db.drip_sequences.insert_one(seq_doc)
    
    # Create sample groups
    sample_groups = []
    for city in US_CITIES[:20]:
        for _ in range(random.randint(2, 5)):
            category = random.choice(CATEGORIES)
            group = Group(
                name=f"{city['name']} {category} Volunteers",
                city=city['name'],
                category=category,
                members=random.randint(50, 5000),
                posts=random.randint(10, 500),
                engagement_rate=round(random.uniform(0.5, 15.0), 2),
                trending_score=round(random.uniform(0, 100), 2)
            )
            doc = group.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            sample_groups.append(doc)
    
    if sample_groups:
        await db.groups.insert_many(sample_groups)
    
    # Create sample leads with varied data
    sample_leads = []
    first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Jamie", "Sam"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Wilson"]
    
    for _ in range(100):
        city = random.choice(US_CITIES[:30])
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        lead = Lead(
            name=name,
            email=f"{name.lower().replace(' ', '.')}@email.com",
            phone=f"+1{random.randint(200, 999)}{random.randint(100, 999)}{random.randint(1000, 9999)}" if random.random() > 0.3 else None,
            city=city['name'],
            interests=random.sample(CATEGORIES, random.randint(1, 4)),
            source=random.choice(LEAD_SOURCES),
            score=random.randint(10, 100),
            status=random.choice(["new", "contacted", "engaged", "qualified", "converted", "lost"]),
            tags=random.sample(["high-value", "newsletter", "event-attendee", "referral", "vip"], random.randint(0, 2)),
            email_opens=random.randint(0, 10),
            email_clicks=random.randint(0, 5),
            conversion_value=random.uniform(0, 500) if random.random() > 0.7 else 0
        )
        doc = lead.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        sample_leads.append(doc)
    
    if sample_leads:
        await db.leads.insert_many(sample_leads)
    
    # Create sample automation rules
    automation_rules = [
        {
            "id": str(uuid.uuid4()),
            "name": "High Score Alert",
            "trigger_type": "score_threshold",
            "trigger_value": 70,
            "action_type": "tag_add",
            "action_value": "hot-lead",
            "active": True,
            "executions": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Welcome New Leads",
            "trigger_type": "new_lead",
            "trigger_value": None,
            "action_type": "send_email",
            "action_value": templates[0].id,
            "active": True,
            "executions": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Webhook to Zapier",
            "trigger_type": "status_change",
            "trigger_value": "qualified",
            "action_type": "webhook",
            "action_value": "https://hooks.zapier.com/your-webhook-url",
            "active": False,
            "executions": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.automation_rules.delete_many({})
    await db.automation_rules.insert_many(automation_rules)
    
    # Create sample landing pages
    landing_pages = [
        {
            "id": str(uuid.uuid4()),
            "name": "Volunteer Sign Up",
            "slug": "volunteer-signup",
            "headline": "Make a Difference in Your Community",
            "subheadline": "Join thousands of volunteers creating positive change",
            "cta_text": "Sign Up Now",
            "form_fields": ["name", "email", "city", "interests"],
            "background_color": "#4A7B59",
            "text_color": "#FFFFFF",
            "visits": random.randint(100, 5000),
            "conversions": random.randint(10, 500),
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Newsletter Subscription",
            "slug": "newsletter",
            "headline": "Stay Connected with Youandinotai",
            "subheadline": "Get weekly updates on volunteer opportunities near you",
            "cta_text": "Subscribe",
            "form_fields": ["name", "email"],
            "background_color": "#D97757",
            "text_color": "#FFFFFF",
            "visits": random.randint(500, 10000),
            "conversions": random.randint(50, 1000),
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.landing_pages.delete_many({})
    await db.landing_pages.insert_many(landing_pages)
    
    # Create sample platform connections
    platforms = [
        {"id": str(uuid.uuid4()), "name": "Youandinotai.com", "api_key": f"yai_{uuid.uuid4().hex[:16]}", "leads_sent": random.randint(50, 500), "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Recycle.org", "api_key": f"rec_{uuid.uuid4().hex[:16]}", "leads_sent": random.randint(20, 200), "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "AI-Solutions.store", "api_key": f"ais_{uuid.uuid4().hex[:16]}", "leads_sent": random.randint(30, 300), "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Aidiesitall.website", "api_key": f"aid_{uuid.uuid4().hex[:16]}", "leads_sent": random.randint(10, 100), "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.platforms.delete_many({})
    await db.platforms.insert_many(platforms)
    
    return {
        "message": "Sample data seeded successfully",
        "groups_created": len(sample_groups),
        "leads_created": len(sample_leads),
        "templates_created": len(templates),
        "sequences_created": 1,
        "automation_rules_created": len(automation_rules),
        "landing_pages_created": len(landing_pages),
        "platforms_connected": len(platforms)
    }

# ==================== AI LEAD QUALIFICATION ====================

@api_router.post("/leads/{lead_id}/ai-qualify")
async def ai_qualify_lead(lead_id: str):
    """Use AI to analyze and qualify a lead with recommendations"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"qualify-{lead_id}",
            system_message="""You are a lead qualification expert for a volunteer/cause platform. 
            Analyze leads and provide actionable recommendations. Be concise and specific."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze this lead and provide qualification insights:

Name: {lead['name']}
Email: {lead['email']}
City: {lead['city']}
Interests: {', '.join(lead.get('interests', []))}
Source: {lead.get('source', 'unknown')}
Current Score: {lead.get('score', 0)}
Status: {lead.get('status', 'new')}
Email Opens: {lead.get('email_opens', 0)}
Email Clicks: {lead.get('email_clicks', 0)}
Tags: {', '.join(lead.get('tags', []))}

Provide:
1. QUALIFICATION: (Hot/Warm/Cold) with reason
2. RECOMMENDED_ACTION: One specific next step
3. BEST_APPROACH: How to engage this lead
4. PREDICTED_CONVERSION: (High/Medium/Low) with reason
5. SUGGESTED_TAGS: 2-3 tags to add

Format each on a new line starting with the label."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        result = {
            "lead_id": lead_id,
            "lead_name": lead['name'],
            "current_score": lead.get('score', 0),
            "ai_analysis": {}
        }
        
        for line in response.strip().split('\n'):
            if line.startswith("QUALIFICATION:"):
                result["ai_analysis"]["qualification"] = line.replace("QUALIFICATION:", "").strip()
            elif line.startswith("RECOMMENDED_ACTION:"):
                result["ai_analysis"]["recommended_action"] = line.replace("RECOMMENDED_ACTION:", "").strip()
            elif line.startswith("BEST_APPROACH:"):
                result["ai_analysis"]["best_approach"] = line.replace("BEST_APPROACH:", "").strip()
            elif line.startswith("PREDICTED_CONVERSION:"):
                result["ai_analysis"]["predicted_conversion"] = line.replace("PREDICTED_CONVERSION:", "").strip()
            elif line.startswith("SUGGESTED_TAGS:"):
                tags_str = line.replace("SUGGESTED_TAGS:", "").strip()
                result["ai_analysis"]["suggested_tags"] = [t.strip() for t in tags_str.split(',')]
        
        if not result["ai_analysis"]:
            result["ai_analysis"]["raw_response"] = response
        
        # Store analysis
        await db.lead_analyses.update_one(
            {"lead_id": lead_id},
            {"$set": {
                "lead_id": lead_id,
                "analysis": result["ai_analysis"],
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error qualifying lead: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to qualify lead: {str(e)}")

@api_router.post("/leads/bulk-qualify")
async def bulk_qualify_leads(lead_ids: List[str], background_tasks: BackgroundTasks):
    """Queue multiple leads for AI qualification"""
    for lead_id in lead_ids[:10]:  # Limit to 10 at a time
        background_tasks.add_task(ai_qualify_lead, lead_id)
    return {"message": f"Queued {min(len(lead_ids), 10)} leads for qualification"}

# ==================== AUTOMATION RULES ====================

class AutomationRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    trigger_type: str  # new_lead, score_threshold, status_change, tag_added, inactivity
    trigger_value: Optional[Any] = None
    action_type: str  # send_email, add_tag, change_status, webhook, notify
    action_value: str
    active: bool = True
    executions: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AutomationRuleCreate(BaseModel):
    name: str
    trigger_type: str
    trigger_value: Optional[Any] = None
    action_type: str
    action_value: str

@api_router.post("/automation/rules", response_model=AutomationRule)
async def create_automation_rule(input: AutomationRuleCreate):
    """Create an automation rule"""
    rule = AutomationRule(**input.model_dump())
    doc = rule.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.automation_rules.insert_one(doc)
    return rule

@api_router.get("/automation/rules")
async def get_automation_rules(active_only: bool = False):
    """Get all automation rules"""
    query = {"active": True} if active_only else {}
    rules = await db.automation_rules.find(query, {"_id": 0}).to_list(100)
    return rules

@api_router.patch("/automation/rules/{rule_id}/toggle")
async def toggle_automation_rule(rule_id: str):
    """Toggle automation rule active/inactive"""
    rule = await db.automation_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    new_status = not rule.get('active', True)
    await db.automation_rules.update_one({"id": rule_id}, {"$set": {"active": new_status}})
    return {"id": rule_id, "active": new_status}

@api_router.post("/automation/execute/{rule_id}")
async def execute_automation_rule(rule_id: str, lead_id: str, background_tasks: BackgroundTasks):
    """Manually execute an automation rule for a lead"""
    rule = await db.automation_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    action_type = rule['action_type']
    action_value = rule['action_value']
    
    if action_type == "add_tag" or action_type == "tag_add":
        current_tags = lead.get('tags', [])
        if action_value not in current_tags:
            current_tags.append(action_value)
            await db.leads.update_one({"id": lead_id}, {"$set": {"tags": current_tags}})
    
    elif action_type == "change_status":
        await db.leads.update_one({"id": lead_id}, {"$set": {"status": action_value}})
    
    elif action_type == "send_email":
        template = await db.email_templates.find_one({"id": action_value}, {"_id": 0})
        if template:
            await send_email_async(lead['email'], template['subject'], template['html_content'], lead['name'])
    
    elif action_type == "webhook":
        background_tasks.add_task(send_webhook, action_value, lead)
    
    # Increment execution count
    await db.automation_rules.update_one({"id": rule_id}, {"$inc": {"executions": 1}})
    
    return {"message": f"Executed rule '{rule['name']}' for lead {lead['name']}"}

async def send_webhook(url: str, data: dict):
    """Send webhook to external service"""
    import aiohttp
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data, timeout=10) as response:
                logger.info(f"Webhook sent to {url}, status: {response.status}")
    except Exception as e:
        logger.error(f"Webhook failed: {e}")

# ==================== LANDING PAGES ====================

class LandingPage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    headline: str
    subheadline: str = ""
    cta_text: str = "Sign Up"
    form_fields: List[str] = ["name", "email"]
    background_color: str = "#4A7B59"
    text_color: str = "#FFFFFF"
    image_url: Optional[str] = None
    visits: int = 0
    conversions: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LandingPageCreate(BaseModel):
    name: str
    slug: str
    headline: str
    subheadline: str = ""
    cta_text: str = "Sign Up"
    form_fields: List[str] = ["name", "email"]
    background_color: str = "#4A7B59"
    text_color: str = "#FFFFFF"
    image_url: Optional[str] = None

@api_router.post("/landing-pages", response_model=LandingPage)
async def create_landing_page(input: LandingPageCreate):
    """Create a landing page"""
    # Check slug uniqueness
    existing = await db.landing_pages.find_one({"slug": input.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    page = LandingPage(**input.model_dump())
    doc = page.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.landing_pages.insert_one(doc)
    return page

@api_router.get("/landing-pages")
async def get_landing_pages():
    """Get all landing pages"""
    pages = await db.landing_pages.find({}, {"_id": 0}).to_list(100)
    return pages

@api_router.get("/landing-pages/{slug}")
async def get_landing_page(slug: str):
    """Get a landing page by slug (public)"""
    page = await db.landing_pages.find_one({"slug": slug, "active": True}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Increment visits
    await db.landing_pages.update_one({"slug": slug}, {"$inc": {"visits": 1}})
    return page

@api_router.post("/landing-pages/{slug}/submit")
async def submit_landing_page(slug: str, form_data: dict, background_tasks: BackgroundTasks):
    """Submit a landing page form (creates lead)"""
    page = await db.landing_pages.find_one({"slug": slug, "active": True}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Create lead
    lead_input = LeadCreate(
        name=form_data.get('name', 'Unknown'),
        email=form_data.get('email'),
        city=form_data.get('city', 'Unknown'),
        phone=form_data.get('phone'),
        interests=form_data.get('interests', []),
        source="landing_page",
        tags=[f"lp:{slug}"]
    )
    
    lead = await create_lead(lead_input, background_tasks)
    
    # Increment conversions
    await db.landing_pages.update_one({"slug": slug}, {"$inc": {"conversions": 1}})
    
    return {
        "message": "Thank you for signing up!",
        "lead_id": lead.id
    }

@api_router.get("/landing-pages/{page_id}/stats")
async def get_landing_page_stats(page_id: str):
    """Get landing page performance stats"""
    page = await db.landing_pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    conversion_rate = (page['conversions'] / page['visits'] * 100) if page['visits'] > 0 else 0
    
    return {
        "name": page['name'],
        "visits": page['visits'],
        "conversions": page['conversions'],
        "conversion_rate": round(conversion_rate, 2),
        "leads": await db.leads.count_documents({"tags": f"lp:{page['slug']}"})
    }

# ==================== MULTI-PLATFORM HUB ====================

class Platform(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    api_key: str = Field(default_factory=lambda: f"plat_{uuid.uuid4().hex[:24]}")
    webhook_url: Optional[str] = None
    leads_sent: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlatformCreate(BaseModel):
    name: str
    webhook_url: Optional[str] = None

@api_router.post("/platforms", response_model=Platform)
async def create_platform(input: PlatformCreate):
    """Register a new platform for the hub"""
    platform = Platform(**input.model_dump())
    doc = platform.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.platforms.insert_one(doc)
    return platform

@api_router.get("/platforms")
async def get_platforms():
    """Get all connected platforms"""
    platforms = await db.platforms.find({}, {"_id": 0}).to_list(100)
    return platforms

@api_router.post("/platforms/ingest")
async def ingest_lead_from_platform(
    api_key: str,
    lead_data: dict,
    background_tasks: BackgroundTasks
):
    """Universal endpoint for all platforms to send leads"""
    platform = await db.platforms.find_one({"api_key": api_key, "active": True}, {"_id": 0})
    if not platform:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    # Create lead with platform source
    lead_input = LeadCreate(
        name=lead_data.get('name', 'Unknown'),
        email=lead_data.get('email'),
        city=lead_data.get('city', 'Unknown'),
        phone=lead_data.get('phone'),
        interests=lead_data.get('interests', []),
        source="partner",
        tags=[f"platform:{platform['name'].lower().replace(' ', '-')}"]
    )
    
    lead = await create_lead(lead_input, background_tasks)
    
    # Update platform stats
    await db.platforms.update_one({"api_key": api_key}, {"$inc": {"leads_sent": 1}})
    
    return {
        "message": "Lead ingested successfully",
        "lead_id": lead.id,
        "platform": platform['name']
    }

@api_router.get("/platforms/{platform_id}/stats")
async def get_platform_stats(platform_id: str):
    """Get platform performance stats"""
    platform = await db.platforms.find_one({"id": platform_id}, {"_id": 0})
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    platform_tag = f"platform:{platform['name'].lower().replace(' ', '-')}"
    
    leads = await db.leads.find({"tags": platform_tag}, {"_id": 0}).to_list(10000)
    
    status_breakdown = {}
    for lead in leads:
        status = lead.get('status', 'new')
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    converted = status_breakdown.get('converted', 0)
    conversion_rate = (converted / len(leads) * 100) if leads else 0
    
    return {
        "platform": platform['name'],
        "total_leads": len(leads),
        "status_breakdown": status_breakdown,
        "conversion_rate": round(conversion_rate, 2),
        "avg_score": sum(l.get('score', 0) for l in leads) / len(leads) if leads else 0
    }

# ==================== REPORTS & ANALYTICS ====================

@api_router.get("/reports/daily")
async def get_daily_report():
    """Get daily lead generation report"""
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    
    # This week's data
    week_start = today - timedelta(days=today.weekday())
    
    # Get counts
    total_leads = await db.leads.count_documents({})
    
    # Leads by source today (simplified - in production use date queries)
    by_source = {}
    for source in LEAD_SOURCES:
        count = await db.leads.count_documents({"source": source})
        by_source[source] = count
    
    # Top performing cities
    top_cities = await db.leads.aggregate([
        {"$group": {"_id": "$city", "count": {"$sum": 1}, "avg_score": {"$avg": "$score"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]).to_list(5)
    
    # Conversion metrics
    converted = await db.leads.count_documents({"status": "converted"})
    qualified = await db.leads.count_documents({"status": "qualified"})
    
    # Email performance
    emails_sent = await db.email_logs.count_documents({})
    emails_opened = await db.email_logs.count_documents({"status": "opened"})
    
    # Landing page performance
    lp_stats = await db.landing_pages.aggregate([
        {"$group": {"_id": None, "total_visits": {"$sum": "$visits"}, "total_conversions": {"$sum": "$conversions"}}}
    ]).to_list(1)
    
    return {
        "report_date": today.isoformat(),
        "summary": {
            "total_leads": total_leads,
            "converted": converted,
            "qualified": qualified,
            "conversion_rate": round((converted / total_leads * 100) if total_leads > 0 else 0, 2)
        },
        "leads_by_source": by_source,
        "top_cities": [{"city": c["_id"], "leads": c["count"], "avg_score": round(c["avg_score"], 1)} for c in top_cities],
        "email_performance": {
            "sent": emails_sent,
            "opened": emails_opened,
            "open_rate": round((emails_opened / emails_sent * 100) if emails_sent > 0 else 0, 2)
        },
        "landing_pages": lp_stats[0] if lp_stats else {"total_visits": 0, "total_conversions": 0}
    }

@api_router.get("/reports/lead-quality")
async def get_lead_quality_report():
    """Get lead quality analysis report"""
    # Score distribution
    hot = await db.leads.count_documents({"score": {"$gte": 70}})
    warm = await db.leads.count_documents({"score": {"$gte": 40, "$lt": 70}})
    cold = await db.leads.count_documents({"score": {"$lt": 40}})
    
    # Engagement metrics
    high_engagement = await db.leads.count_documents({"email_clicks": {"$gte": 3}})
    no_engagement = await db.leads.count_documents({"email_opens": 0, "email_clicks": 0})
    
    # Source quality
    source_quality = await db.leads.aggregate([
        {"$group": {
            "_id": "$source",
            "count": {"$sum": 1},
            "avg_score": {"$avg": "$score"},
            "converted": {"$sum": {"$cond": [{"$eq": ["$status", "converted"]}, 1, 0]}}
        }},
        {"$sort": {"avg_score": -1}}
    ]).to_list(20)
    
    return {
        "score_distribution": {"hot": hot, "warm": warm, "cold": cold},
        "engagement": {
            "high_engagement": high_engagement,
            "no_engagement": no_engagement
        },
        "source_quality": [{
            "source": s["_id"],
            "leads": s["count"],
            "avg_score": round(s["avg_score"], 1),
            "converted": s["converted"],
            "conversion_rate": round((s["converted"] / s["count"] * 100) if s["count"] > 0 else 0, 1)
        } for s in source_quality]
    }

# ==================== SMART NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(limit: int = 20):
    """Get smart notifications based on lead activity"""
    notifications = []
    
    # Hot leads needing attention
    hot_leads = await db.leads.find(
        {"score": {"$gte": 70}, "status": "new"},
        {"_id": 0}
    ).sort("score", -1).to_list(5)
    
    for lead in hot_leads:
        notifications.append({
            "type": "hot_lead",
            "priority": "high",
            "title": f"Hot lead needs attention: {lead['name']}",
            "message": f"Score: {lead['score']} • City: {lead['city']}",
            "lead_id": lead['id'],
            "action": "Contact immediately"
        })
    
    # Stale leads (no activity)
    stale_leads = await db.leads.find(
        {"status": "contacted", "email_opens": 0},
        {"_id": 0}
    ).to_list(5)
    
    for lead in stale_leads:
        notifications.append({
            "type": "stale_lead",
            "priority": "medium",
            "title": f"Re-engage: {lead['name']}",
            "message": "No email opens after contact",
            "lead_id": lead['id'],
            "action": "Send follow-up"
        })
    
    # High-converting campaigns
    campaigns = await db.email_campaigns.find({"status": "completed"}, {"_id": 0}).to_list(5)
    for campaign in campaigns:
        if campaign.get('open_count', 0) > 10:
            notifications.append({
                "type": "campaign_success",
                "priority": "low",
                "title": f"Campaign performing well: {campaign['name']}",
                "message": f"{campaign.get('open_count', 0)} opens",
                "campaign_id": campaign['id'],
                "action": "Create similar campaign"
            })
    
    return notifications[:limit]

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()Youandinotai Marketing Automation Platform

Original Problem Statement Youandinotai.com marketing automation based off most populated cities - a social platform not just a date app, has message boards for community meetups. Looking for lead generation more than content creation - email maybe or fully automated anything. Multiple platforms: Youandinotai.com, onlinerecycle.net, ai-solutions.store, aidiesitall.website, about 12 apps all automated.

ai Personas to create with hermes profiles 

Platform Admin - Manages marketing content, analyzes city/group data, generates leads
Community Manager - Creates content, manages groups, tracks engagement
Marketing Team - Uses AI tools for content suggestions, runs email campaigns, captures social leads
Core Requirements (Static)

City-based analytics for top 50 US cities
AI-powered content generation using GPT-5.2
Lead scoring and conversion tracking
Email campaign automation with drip sequences
Social media lead capture forms
Group/thread performance tracking
What's Been Implemented (Jan 2026)

Lead Generation CRM (COMPLETE) ✅ Advanced lead management with scoring algorithm ✅ Lead funnel visualization (new → contacted → engaged → qualified → converted) ✅ Email templates with personalization ({{name}} variables) ✅ Email campaign creation and sending ✅ Automated drip sequences (trigger on new_lead) ✅ Social media lead capture forms (Facebook, Instagram, Twitter, LinkedIn) ✅ Email tracking webhooks (opens, clicks) ✅ Lead source tracking (website, social, referral, event, cold_outreach)

Automation Engine (NEW) ✅ Automation rules engine (triggers: new_lead, score_threshold, status_change) ✅ Actions: send_email, add_tag, change_status, webhook, notify ✅ AI Lead Qualification with GPT-5.2 (qualification, recommendations, predictions) ✅ Smart Notifications (hot leads alerts, re-engagement reminders) ✅ Webhook dispatcher to external services (Zapier, Make, etc.)

Landing Pages (NEW) ✅ Landing page builder with custom colors ✅ Customizable form fields (name, email, phone, city, interests) ✅ Public page endpoints with visit tracking ✅ Conversion tracking and stats ✅ Lead source tagging (lp:slug)

Multi-Platform Hub (NEW) ✅ Connect multiple apps (Youandinotai, Recycle.org, AI-Solutions, etc.) ✅ API keys for each platform ✅ Universal lead ingestion endpoint ✅ Per-platform analytics (leads, conversion rate, avg score) ✅ Integration guide with code examples

Reports & Analytics (NEW) ✅ Daily lead generation report ✅ Lead quality analysis report ✅ Source quality rankings ✅ City performance data

Backend (FastAPI + MongoDB) ✅ Top 50 US cities data with population/region info ✅ 12 community categories ✅ Lead CRUD with advanced filtering and scoring ✅ Email templates CRUD ✅ Email campaigns with segment targeting ✅ Drip sequences with multi-step automation ✅ Social capture forms ✅ Dashboard stats with funnel metrics

Frontend (React + Shadcn UI) ✅ Dashboard with Lead Funnel, Email Performance, KPI cards ✅ Lead CRM page with scoring, filtering, export ✅ Email Campaigns page (Campaigns, Templates, Sequences tabs) ✅ Social Capture page with integration guide ✅ City Analytics with population data ✅ Groups Analytics with trending display ✅ AI Content Generator

Architecture Frontend (React + Tailwind + Shadcn) ↓ Backend (FastAPI) ↓ MongoDB (leads, groups, email_templates, email_campaigns, drip_sequences, social_captures) ↓ Resend API (Email sending - optional) Emergent LLM (GPT-5.2 for AI content)

Prioritized Backlog

P0 (Done)

Lead CRM with scoring
Email templates & campaigns
Drip sequences
Social lead capture
P1 (Next Phase)

Configure Resend API key for actual email sending
Webhook integration with Facebook/Instagram Lead Ads
Zapier/Make integration for automation
Lead export to external CRMs (HubSpot, Salesforce)
P2 (Future)

A/B testing for email subject lines
SMS outreach via Twilio
Calendar booking integration
Revenue attribution tracking
Next Tasks

Add Resend API key to enable actual email sending
Set up Facebook Lead Ads webhook
Create landing pages for lead capture
Integrate with external CRM platforms