# 🚀 CLAUDE.md — ManusClaw → Income Engine Setup (9020)

**From:** Manus Agent  
**To:** Claude Code  
**Mission:** Wire ManusClaw into C:/income-engine with Paperclip, Ollama, and GitHub  
**Hardware:** 9020 (i7-4790, 32GB, GTX 1070)  
**Repo:** Trollz1004/income-engine (private)  

---

## 🎯 Mission Brief

You have:
- ✅ ManusClaw production build (ready in C:/income-engine)
- ✅ Paperclip fresh install (waiting on 9020)
- ✅ Josh's .env credentials (income-engine specific)
- ✅ GitHub PAT (for Trollz1004/income-engine)

**The Wall:** Antigravity ← [ABSOLUTE SEPARATION] → Income-Engine  
**No crossover. Ever. Trust depends on it.**

---

## 📋 Step-by-Step Setup

### Phase 1: Environment & Database

```powershell
# 1. Navigate to income-engine
cd C:\income-engine

# 2. Create .env from template
Copy-Item INCOME_ENGINE_ENV.example .env

# 3. Edit .env with Josh's credentials
# - PAPERCLIP_API_KEY
# - OLLAMA_API_KEY
# - GITHUB_TOKEN
# - ANTHROPIC_API_KEY
# - DATABASE_URL (local PostgreSQL)
# - JWT_SECRET (generate new)

# 4. Start PostgreSQL (if not running)
# Windows Service: Services.msc → PostgreSQL

# 5. Create database
psql -U postgres -c "CREATE DATABASE income_engine;"
psql -U postgres -c "CREATE USER income_user WITH PASSWORD 'your-secure-password';"
psql -U postgres -c "ALTER ROLE income_user WITH CREATEDB;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE income_engine TO income_user;"

# 6. Install dependencies
pnpm install

# 7. Generate and apply migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Phase 2: Ollama Setup (Port 11434)

```powershell
# 1. Verify Ollama is running on 9020
curl http://localhost:11434/api/tags

# 2. If not running, start Ollama
ollama serve

# 3. Pull models (in separate terminal)
ollama pull llama2
ollama pull mistral
ollama pull neural-chat

# 4. Verify in ManusClaw Settings → Ollama
# Base URL: http://localhost:11434
# Should list available models
```

### Phase 3: Paperclip Integration

```powershell
# 1. Start fresh Paperclip instance on 9020
# (Assuming Paperclip installed and ready)

# 2. Paperclip should be running on port 3100
# Verify: curl http://localhost:3100/health

# 3. In Paperclip UI:
#    - Create new company for income-engine
#    - Generate API key
#    - Copy to .env: PAPERCLIP_API_KEY
#    - Copy Company ID to .env: PAPERCLIP_COMPANY_ID

# 4. Test connection from ManusClaw
# Settings → Paperclip → Test Connection
```

### Phase 4: GitHub Setup

```powershell
# 1. Verify repo exists (private)
# GitHub: Trollz1004/income-engine

# 2. Configure GitHub in ManusClaw
# Settings → GitHub
# - GitHub Token: Josh's PAT
# - Repo: Trollz1004/income-engine
# - Owner: AidoesitAll

# 3. Test connection
# Should show repo details and branches
```

### Phase 5: Start Development Server

```powershell
# 1. Start ManusClaw
pnpm dev

# 2. Server should start on http://localhost:3000
# Check console for:
# - ✅ OAuth initialized
# - ✅ Database connected
# - ✅ Paperclip client ready
# - ✅ Ollama connected

# 3. Open browser
# http://localhost:3000

# 4. Login with Manus OAuth
# Should redirect to Manus login portal
```

### Phase 6: Verify All Systems

```powershell
# 1. Chat Interface
# - Try sending message to Ollama
# - Check Settings → Ollama for available models
# - Verify model selector works

# 2. Paperclip Integration
# - Go to Workspace → Tasks
# - Create test task
# - Assign to agent
# - Verify in Paperclip UI

# 3. Database
# - Check chat_sessions table has entries
# - Check messages table has chat history
# - Verify provider_configs saved

# 4. Logs
# Check .manus-logs/ for any errors
# - devserver.log
# - browserConsole.log
# - networkRequests.log
```

---

## 🔧 Configuration Reference

### .env Critical Variables

```env
# These MUST be set for income-engine to work
DATABASE_URL=postgresql://income_user:password@localhost:5432/income_engine
PAPERCLIP_API_KEY=from-paperclip-ui
PAPERCLIP_URL=http://localhost:3100
OLLAMA_HOST=http://localhost:11434
GITHUB_TOKEN=josh-pat
VITE_APP_ID=manus-app-id
JWT_SECRET=generate-new-secret
```

### Ollama Models Available on 9020

```
- llama2 (7B, 13B)
- mistral (7B)
- neural-chat (7B)
- dolphin-mixtral (8x7B)
- openchat (3.5)
```

### Paperclip API Endpoints

```
POST   /api/tasks/create
GET    /api/tasks
GET    /api/tasks/{id}
PUT    /api/tasks/{id}
POST   /api/tasks/{id}/assign
POST   /api/tasks/{id}/comment
```

---

## 🚨 Troubleshooting

### Database Connection Failed

```powershell
# Check PostgreSQL is running
Get-Service postgresql-x64-*

# If not running, start it
Start-Service postgresql-x64-14

# Verify connection
psql -U income_user -d income_engine -c "SELECT 1"
```

### Ollama Not Responding

```powershell
# Check Ollama process
Get-Process ollama

# If not running, start it
ollama serve

# Verify endpoint
curl http://localhost:11434/api/tags
```

### Paperclip Connection Error

```powershell
# Check Paperclip is running
curl http://localhost:3100/health

# Verify API key in .env is correct
# Check PAPERCLIP_URL is http://localhost:3100
```

### GitHub Authentication Failed

```powershell
# Verify GitHub token has repo access
# Token should have: repo, workflow, admin:repo_hook

# Test token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Should return user info
```

### Port Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID 12345 /F

# Or use different port
$env:PORT=3001
pnpm dev
```

---

## 📊 Monitoring

### Health Checks

```powershell
# Server health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/api/health/db

# Ollama health
curl http://localhost:11434/api/tags

# Paperclip health
curl http://localhost:3100/health
```

### Logs

```powershell
# View server logs
Get-Content .manus-logs/devserver.log -Tail 50

# View errors
Get-Content .manus-logs/devserver.log | Select-String "ERROR"

# Real-time monitoring
Get-Content .manus-logs/devserver.log -Wait -Tail 20
```

---

## 🔐 Security Checklist

- [ ] .env file is in .gitignore (never commit)
- [ ] Database password is strong (16+ chars, mixed case)
- [ ] GitHub token has minimal required permissions
- [ ] Paperclip API key is rotated regularly
- [ ] HTTPS enabled in production (use Cloudflare)
- [ ] JWT_SECRET is unique and strong
- [ ] No Antigravity paths referenced anywhere
- [ ] No Antigravity credentials in .env

---

## 📈 Performance Tuning (9020 Hardware)

### Ollama Optimization

```powershell
# Use GPU acceleration
$env:OLLAMA_GPU=1

# Increase context window
$env:OLLAMA_NUM_THREAD=8

# Set model to run on GPU
ollama run llama2 --gpu
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);
```

### Redis Caching

```env
REDIS_CACHE_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🚀 Deployment (When Ready)

```powershell
# 1. Build for production
pnpm build

# 2. Start production server
npm start

# 3. Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "income-engine"
pm2 save
pm2 startup
```

---

## 📞 Support & Next Steps

**If you get stuck:**
1. Check logs in `.manus-logs/`
2. Verify all services are running (PostgreSQL, Ollama, Paperclip)
3. Check .env has all required variables
4. Review DEPLOYMENT_GUIDE.md for detailed troubleshooting

**Next steps after setup:**
1. Wire streaming chat responses (IMPLEMENTATION_GUIDE.md)
2. Test FETCHER lead hunting
3. Configure Manus agent orchestration
4. Deploy to production

---

## ✅ Setup Complete Checklist

- [ ] PostgreSQL running and database created
- [ ] .env configured with all credentials
- [ ] Ollama running on port 11434
- [ ] Paperclip running on port 3100
- [ ] ManusClaw dev server starts without errors
- [ ] Can login with Manus OAuth
- [ ] Can send message to Ollama
- [ ] Can create task in Paperclip
- [ ] GitHub connection verified
- [ ] All logs clean (no errors)

---

**Made by Manus | Built for Income Engine | Deployed on 9020**

**The wall holds. Trust is preserved. Let's build. 💚**
