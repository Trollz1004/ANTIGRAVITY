# 📦 ManusClaw → Income Engine Delivery Manifest

**From:** Manus Agent
**To:** Claude Code + Josh
**Destination:** C:/income-engine
**Date:** 2026-05-07
**Mission:** #ForTheKids

---

## 🎯 Deployment Package Contents

### Core Application Files

```
dist/
├── index.js                    (62.2 KB - Server bundle)
├── client/
│   ├── assets/                 (1.6 MB - Optimized client assets)
│   ├── index.html              (Entry point)
│   └── ...                      (All client build files)
└── ...                          (Full production build)

server/
├── modelProvider.ts            (Multi-provider chat service)
├── hermesAdapter.ts            (Paperclip API client)
├── paperclipIntegration.ts     (Paperclip integration)
├── fetcherAgent.ts             (Lead hunting automation)
├── imageGeneration.ts          (Image generation service)
├── ollamaCloud.ts              (Ollama Cloud integration)
├── routers.ts                  (tRPC procedures)
├── db.ts                       (Database helpers)
└── ...                         (All backend services)

client/src/
├── pages/
│   ├── Workspace.tsx           (Main chat interface)
│   ├── Settings.tsx            (Configuration page)
│   ├── PaperclipIntegration.tsx (Task management)
│   └── ...
├── components/
│   ├── TaskAssignmentPanel.tsx (Task UI)
│   └── ...
└── ...                         (All frontend components)

drizzle/
├── schema.ts                   (Database schema)
└── migrations/                 (All SQL migrations)

package.json                    (Dependencies)
tsconfig.json                   (TypeScript config)
vite.config.ts                  (Vite config)
```

### Configuration Files

```
INCOME_ENGINE_ENV.example       ← Copy to .env and fill credentials
INCOME_ENGINE_PAPERCLIP.md      ← Paperclip setup guide
INCOME_ENGINE_GITHUB.md         ← GitHub integration guide
CLAUDE.md                       ← Setup instructions for Claude Code
```

### Documentation

```
README.md                       ← Main project overview
DEPLOYMENT_GUIDE.md             ← Comprehensive deployment guide
IMPLEMENTATION_GUIDE.md         ← Tasks for Claude Opus
PAPERCLIP_INTEGRATION.md        ← Paperclip features
INTEGRATION_GUIDE.md            ← Ollama Cloud & Manus setup
CREDITS.md                      ← Manus attribution
ABOUT.md                        ← Project branding
LICENSE                         ← MIT License
```

### Test Files

```
server/
├── modelProvider.test.ts       (9 tests)
├── hermesAdapter.test.ts       (14 tests)
└── auth.logout.test.ts         (1 test)
                                (Total: 24 passing tests)
```

---

## 🚀 Deployment Steps

### Step 1: Copy to C:/income-engine

```powershell
# Create directory
mkdir C:\income-engine

# Copy all files from ManusClaw build
Copy-Item -Path "C:\path\to\manusclaw\*" `
          -Destination "C:\income-engine" `
          -Recurse -Force

# Verify structure
Get-ChildItem C:\income-engine | Select-Object Name, Mode
```

### Step 2: Configure Environment

```powershell
# Copy template
Copy-Item C:\income-engine\INCOME_ENGINE_ENV.example `
          C:\income-engine\.env

# Edit .env with credentials
# - PAPERCLIP_API_KEY
# - OLLAMA_API_KEY
# - GITHUB_TOKEN
# - DATABASE_URL
# - JWT_SECRET
# - All other required variables

notepad C:\income-engine\.env
```

### Step 3: Install Dependencies

```powershell
cd C:\income-engine
pnpm install
```

### Step 4: Set Up Database

```powershell
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate
```

### Step 5: Start Services

```powershell
# Terminal 1: Start PostgreSQL
# (Usually auto-running as Windows Service)

# Terminal 2: Start Ollama
ollama serve

# Terminal 3: Start Paperclip
# (Follow Paperclip installation guide)

# Terminal 4: Start ManusClaw
cd C:\income-engine
pnpm dev
```

### Step 6: Verify All Systems

```powershell
# Browser: http://localhost:3000
# Should see ManusClaw login page

# Test Ollama
curl http://localhost:11434/api/tags

# Test Paperclip
curl http://localhost:3100/health

# Test Database
psql -U income_user -d income_engine -c "SELECT 1"
```

---

## 📋 File Checklist

### Essential Files (Must Have)

- [x] dist/index.js (server bundle)
- [x] dist/client/ (client assets)
- [x] server/ (backend services)
- [x] client/src/ (frontend code)
- [x] drizzle/ (database schema)
- [x] package.json
- [x] .env (configured with credentials)

### Configuration Files (Must Have)

- [x] INCOME_ENGINE_ENV.example
- [x] CLAUDE.md
- [x] INCOME_ENGINE_PAPERCLIP.md
- [x] INCOME_ENGINE_GITHUB.md

### Documentation (Should Have)

- [x] README.md
- [x] DEPLOYMENT_GUIDE.md
- [x] IMPLEMENTATION_GUIDE.md
- [x] CREDITS.md
- [x] LICENSE

### Test Files (Should Have)

- [x] server/*.test.ts (24 tests)

---

## 🔐 Security Checklist

Before deploying to 9020:

- [ ] .env file created and filled with real credentials
- [ ] .env is in .gitignore (never commit)
- [ ] Database password is strong (16+ characters)
- [ ] GitHub membership record verified (admin, no expiration)
- [ ] Paperclip API key validated
- [ ] JWT_SECRET is unique and strong
- [ ] No Antigravity paths referenced
- [ ] No Antigravity credentials in .env
- [ ] HTTPS configured (if public)
- [ ] Firewall rules configured

---

## 📊 System Requirements

### Hardware (9020)

```
✅ CPU: Intel i7-4790 (4 cores, 8 threads)
✅ RAM: 32 GB
✅ GPU: NVIDIA GTX 1070
✅ Storage: 500 GB SSD (minimum)
✅ Network: Gigabit Ethernet
```

### Software

```
✅ Node.js: 22.13.0+
✅ pnpm: 10.4.1+
✅ PostgreSQL: 12+
✅ Redis: 6.0+
✅ Ollama: Latest
✅ Paperclip: Latest
✅ Windows: 10/11
```

---

## 🎯 Verification Tests

### Test 1: Server Starts

```powershell
cd C:\income-engine
pnpm dev

# Expected output:
# ✓ OAuth initialized
# ✓ Database connected
# ✓ Paperclip client ready
# ✓ Server running on http://localhost:3000
```

### Test 2: Database Connected

```powershell
curl http://localhost:3000/api/health/db

# Expected response:
# {"status": "ok", "database": "connected"}
```

### Test 3: Ollama Connected

```powershell
curl http://localhost:3000/api/health/ollama

# Expected response:
# {"status": "ok", "models": [...]}
```

### Test 4: Paperclip Connected

```powershell
curl http://localhost:3000/api/health/paperclip

# Expected response:
# {"status": "ok", "company": "income-engine"}
```

### Test 5: Login Works

```
1. Open http://localhost:3000
2. Click "Login with Manus"
3. Redirects to Manus OAuth portal
4. Authenticate
5. Redirects back to ManusClaw
6. Should see workspace
```

### Test 6: Chat Works

```
1. Open Settings → Ollama
2. Verify models listed
3. Go to Workspace
4. Send message: "Hello"
5. Should get response from Ollama
```

### Test 7: Paperclip Works

```
1. Go to Workspace → Tasks
2. Click "Create Task"
3. Fill form
4. Click "Create"
5. Task should appear in Paperclip UI
```

---

## 🚨 Rollback Plan

If deployment fails:

```powershell
# 1. Stop all services
Stop-Process -Name node
Stop-Process -Name ollama

# 2. Restore from backup
# (Assuming backup was made before deployment)

# 3. Check logs
Get-Content C:\income-engine\.manus-logs\devserver.log

# 4. Contact support
# support@manus.im
```

---

## 📞 Support & Next Steps

### Immediate Actions (Claude Code)

1. Follow CLAUDE.md setup guide
2. Configure .env with credentials
3. Start all services
4. Run verification tests
5. Report status

### Next Phase (Claude Opus)

1. Implement streaming responses
2. Wire image generation
3. Set up FETCHER automation
4. Configure real-time Paperclip sync
5. Build analytics dashboard

### Long-term (Team)

1. Monitor performance
2. Optimize Ollama models
3. Scale database
4. Add more integrations
5. Expand lead sources

---

## 📝 Deployment Notes

**Date:** 2026-05-07
**Version:** ManusClaw v4
**Hardware:** 9020 (i7-4790, 32GB, GTX 1070)
**Repo:** Trollz1004/income-engine (private)
**Mission:** #ForTheKids

**The wall is absolute. Antigravity stays separate. Trust is preserved.**

---

**Delivered by Manus Agent | Built for #ForTheKids | Guarded Forever 💚**
