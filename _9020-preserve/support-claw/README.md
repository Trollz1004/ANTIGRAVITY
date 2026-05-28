# YouAndINotAI Support Bot

**Location**: `D:\support-claw\`  
**Purpose**: Support-only bot for youandinotai.com  
**LLM**: Ollama (primary) + Gemini 2.0 Flash (fallback)  
**Status**: ✅ Ready for local testing and site integration

---

## 🎯 What This Does

- Answers support questions about YouAndINotAI
- Uses FAQ database first (12 Q&A pairs)
- Falls back to Ollama LLM on Sabretooth (192.168.0.8:11434)
- Can use Gemini 2.0 Flash as final fallback
- Logs all interactions to SQLite database
- Escalates complex issues to humans
- **Does NOT do** social media posting, marketing, or general chat

---

## 📁 Files & Structure

```
D:\support-claw\
├── bot.py                    ← Main support bot (run this)
├── test.py                   ← Verification test script
├── setup.ps1                 ← One-time setup script
├── config.json               ← Configuration (LLM, API, etc.)
├── .env                      ← Credentials (Gemini API key)
├── requirements.txt          ← Python dependencies
├── GEMINI_CLI.md             ← Integration guide for Sabretooth
├── README.md                 ← This file
│
├── data/
│   └── faq.json              ← FAQ database (12 Q&A pairs)
│
├── state/
│   └── support.db            ← SQLite ticket database (auto-created)
│
└── logs/
    └── support.log           ← Activity logs (auto-created)
```

---

## 🚀 Quick Start (5 minutes)

### 1. Setup (One-time)
```powershell
cd D:\support-claw
powershell -ExecutionPolicy Bypass -File setup.ps1
```

This:
- ✅ Checks Python 3.9+
- ✅ Creates logs/ and state/ directories
- ✅ Installs dependencies
- ✅ Tests Ollama on Sabretooth (192.168.0.8:11434)

### 2. Verify Installation
```bash
python test.py
```

Expected output:
```
Ollama........................... ✅ PASS
Gemini API....................... ⚠️ (optional)
FAQ Data......................... ✅ PASS
Database......................... ✅ PASS
Dependencies..................... ✅ PASS
API Endpoint..................... ⚠️ (bot not running yet)

Result: 4/6 tests passed
```

### 3. Start the Bot
```bash
python bot.py
```

Expected output:
```
======================================================================
🚀 YouAndINotAI Support Bot Starting
======================================================================
Location: D:\support-claw\
Product:  https://youandinotai.com
LLM:      ollama (qwen2.5:7b)
Host:     http://192.168.0.8:11434
FAQs:     12 loaded
Database: state/support.db
======================================================================
✅ API running on http://127.0.0.1:8765
   POST /api/support/ask
   GET  /api/support/status
   GET  /health
```

### 4. Test the API (in another terminal)
```bash
# Health check
curl http://127.0.0.1:8765/health

# Ask a question
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is YouAndINotAI?"}'

# Get stats
curl http://127.0.0.1:8765/api/support/status
```

---

## 📡 Architecture

```
youandinotai.com (Website)
        ↓
   [Chat Widget]
        ↓
Support Bot API (127.0.0.1:8765)
        ↓
  ┌─────┴──────┐
  ↓            ↓
[FAQ DB]   [Ollama on Sabretooth]
(12 answers)  (192.168.0.8:11434)
              (qwen2.5:7b)
              ↓
         [Gemini Fallback]
         (if configured)
        ↓
[SQLite Database]
(All tickets logged)
```

---

## 🔧 Configuration

### config.json
```json
{
  "llm": {
    "provider": "ollama",
    "host": "http://192.168.0.8:11434",
    "model": "qwen2.5:7b"
  },
  "gemini": {
    "model": "gemini-2.0-flash",
    "api_key_env": "GEMINI_API_KEY"
  },
  "channels": {
    "api": {
      "port": 8765,
      "endpoints": {
        "ask": "/api/support/ask",
        "status": "/api/support/status"
      }
    }
  }
}
```

### .env
```
OLLAMA_HOST=http://192.168.0.8:11434
OLLAMA_MODEL=qwen2.5:7b
GEMINI_API_KEY=AIza...           # Optional: add if using Gemini fallback
YOUANDINOTAI_URL=https://youandinotai.com
SUPPORT_EMAIL=support@youandinotai.com
```

---

## ❓ FAQ Management

### Add/Edit FAQs
Edit `data/faq.json`:
```json
{
  "faqs": [
    {
      "question": "How much does it cost?",
      "answer": "$1 verification fee + $14.99/month..."
    },
    ...
  ]
}
```

Bot reloads FAQ on startup (no restart needed after edits).

### View FAQ
```bash
python -c "import json; print(json.dumps(json.load(open('data/faq.json')), indent=2))"
```

---

## 💻 API Endpoints

### POST /api/support/ask
Ask a support question
```bash
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I verify my account?"}'
```

**Response:**
```json
{
  "ticket_id": 1,
  "query": "How do I verify my account?",
  "response": "When you join YouAndINotAI...",
  "llm_used": "faq",
  "escalated": false,
  "timestamp": "2026-04-02T15:30:45.123456"
}
```

### GET /api/support/status
Get support statistics
```bash
curl http://127.0.0.1:8765/api/support/status
```

**Response:**
```json
{
  "total_tickets": 42,
  "escalated": 3,
  "resolved": 39
}
```

### GET /health
Health check
```bash
curl http://127.0.0.1:8765/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "YouAndINotAI-Support"
}
```

---

## 🌐 Integrate with youandinotai.com

### Option 1: Embed Chat Widget
Add to your website:
```html
<script>
  window.supportBotConfig = {
    apiUrl: "http://127.0.0.1:8765/api/support/ask",
    theme: "light",
    position: "bottom-right",
    title: "YouAndINotAI Support"
  };
</script>
<script src="https://youandinotai.com/js/support-widget.js"></script>
```

### Option 2: JavaScript API
Call from your frontend:
```javascript
async function askSupport(question) {
  const response = await fetch('http://127.0.0.1:8765/api/support/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: question })
  });
  return response.json();
}

// Usage:
const result = await askSupport('What are founding member spots?');
console.log(result.response);
```

### Option 3: iframe Embed
```html
<iframe 
  src="http://127.0.0.1:8765/chat" 
  width="400" 
  height="600"
  frameborder="0">
</iframe>
```

---

## 📊 Monitor & Debug

### Check Logs
```powershell
# Real-time log tail
Get-Content logs/support.log -Tail 50 -Wait

# Search for errors
Select-String -Path logs/support.log -Pattern "ERROR|❌"
```

### View Tickets Database
```bash
# List all tickets
sqlite3 state/support.db "SELECT ticket_id, query, llm_used, escalated FROM tickets;"

# Check escalated issues
sqlite3 state/support.db "SELECT * FROM tickets WHERE escalated=1;"

# Count by LLM
sqlite3 state/support.db "SELECT llm_used, COUNT(*) FROM tickets GROUP BY llm_used;"
```

### API Status
```bash
curl http://127.0.0.1:8765/api/support/status
```

---

## ⚙️ Gemini Integration

To use Gemini 2.0 Flash as fallback:

### Step 1: Get API Key
Visit https://ai.google.dev/, click "Get API Key", copy the key (starts with `AIza...`)

### Step 2: Add to .env
```bash
echo "GEMINI_API_KEY=AIza..." >> D:\support-claw\.env
```

### Step 3: Test
```bash
python test.py
```

See **GEMINI_CLI.md** for full integration guide with Sabretooth CLI commands.

---

## 🔒 Security & Isolation

✅ **Isolated**: Only answers YouAndINotAI support questions  
✅ **Local**: All data stored in `state/` (SQLite)  
✅ **Rate-limited**: 10 requests/minute per IP  
✅ **Logged**: All interactions recorded in `logs/support.log`  
✅ **Safe**: No social media posting, no outbound messaging  
✅ **Escalatable**: Marks unresolved issues for human review  

---

## 🛑 Stop & Restart

### Stop the Bot
```bash
# Press Ctrl+C in the terminal running bot.py
```

### Restart
```bash
python bot.py
```

### Reset Database
```bash
rm state/support.db
# Bot will recreate on next run
```

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Memory | ~100-200 MB |
| CPU (idle) | <5% |
| FAQ response time | <100ms |
| Ollama response time | 1-3s |
| Database size | <10 MB |
| Log retention | 30 days, auto-rotated |

---

## 🐛 Troubleshooting

### "Ollama connection failed"
```bash
# Check Ollama is running on Sabretooth
curl http://192.168.0.8:11434/api/tags

# If fails, start Ollama:
# On Sabretooth: ollama serve
```

### "Gemini API key invalid"
```bash
# Verify format (should start with AIza...)
# Get new key at: https://ai.google.dev/
# Add to .env: GEMINI_API_KEY=AIza...
```

### "Bot not responding"
```bash
# Check if running
netstat -ano | grep 8765

# Check logs
Get-Content logs/support.log -Tail 30

# Restart
python bot.py
```

### "Website can't reach bot"
If bot on different machine:
1. Change `127.0.0.1` to `0.0.0.0` in config.json
2. Update firewall to allow port 8765
3. Use machine IP instead of localhost

---

## 📖 CLI Commands Reference

### Start Bot
```bash
python bot.py
```

### Run Tests
```bash
python test.py
```

### Check Health
```bash
curl http://127.0.0.1:8765/health
```

### Ask Question
```bash
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Your question here?"}'
```

### Get Stats
```bash
curl http://127.0.0.1:8765/api/support/status
```

### View Logs
```powershell
Get-Content logs/support.log -Tail 20 -Wait
```

### View Database
```bash
sqlite3 state/support.db "SELECT * FROM tickets LIMIT 10;"
```

---

## ✅ Deployment Checklist

- [ ] Setup completed (`setup.ps1` run)
- [ ] Tests passing (`python test.py`)
- [ ] Ollama running on Sabretooth (192.168.0.8:11434)
- [ ] FAQ data reviewed and updated
- [ ] Bot starts without errors (`python bot.py`)
- [ ] API endpoints responding
- [ ] Gemini API key added (optional)
- [ ] Website integration code added
- [ ] Logs being written to `logs/support.log`
- [ ] Database recording tickets in `state/support.db`

---

## 🎉 You're Done!

Your support bot is:
✅ Isolated on D: drive  
✅ Using Ollama on Sabretooth  
✅ Ready for youandinotai.com integration  
✅ All data local (no cloud sync)  
✅ Support-only (no social media)  

**Next**: See **GEMINI_CLI.md** for Sabretooth CLI verification commands.

---

*YouAndINotAI Support Bot v1.0*  
*Launched: April 2, 2026*  
*Location: D:\support-claw\*
