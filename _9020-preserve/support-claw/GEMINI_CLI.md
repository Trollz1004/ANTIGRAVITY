# Gemini 2.0 Flash CLI Integration for YouAndINotAI Support
## For: Sabretooth (192.168.0.8) + Support Bot (D:\support-claw\)

This document provides CLI commands to verify the support bot works with Gemini 2.0 Flash, then integrate it with youandinotai.com.

---

## 1. Setup Gemini API Key

### Step 1a: Get Your API Key
```bash
# On any machine with browser access:
# 1. Visit: https://ai.google.dev/
# 2. Click "Get API Key" (top right)
# 3. Create new project or select existing
# 4. Generate API key (free tier available)
# 5. Copy the key (starts with: AIza...)
```

### Step 1b: Add to Support Bot (.env)
```powershell
# On your Windows PC (D:\support-claw\)
# Edit .env and add:
echo "GEMINI_API_KEY=AIza..." >> D:\support-claw\.env

# Or edit manually:
# Open D:\support-claw\.env
# Uncomment and fill in:
# GEMINI_API_KEY=AIza...
```

---

## 2. Verify Gemini Works Locally (D: Drive)

### Test via Python Script
```bash
# On D:\support-claw\
python -c "
import os
from google.generativeai import configure, GenerativeModel

# Load API key
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print('❌ GEMINI_API_KEY not set in .env')
    exit(1)

configure(api_key=api_key)
model = GenerativeModel('gemini-2.0-flash')

# Test query
response = model.generate_content('Answer briefly: What is YouAndINotAI?')
print('✅ Gemini works!')
print(f'Response: {response.text[:100]}')
"
```

### Expected Output
```
✅ Gemini works!
Response: YouAndINotAI is a verified-human dating platform where every user
```

---

## 3. Test Support Bot with Gemini Fallback

### Start the Bot
```powershell
# On D:\support-claw\
cd D:\support-claw
python bot.py
```

### Expected Output
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

### Test API Endpoints (in another terminal)
```bash
# Health check
curl http://127.0.0.1:8765/health

# Ask support question (will use FAQ or Ollama first)
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is YouAndINotAI?"}'

# Get stats
curl http://127.0.0.1:8765/api/support/status
```

### Expected Response
```json
{
  "ticket_id": 1,
  "query": "What is YouAndINotAI?",
  "response": "YouAndINotAI is a verified-human dating platform...",
  "llm_used": "faq",
  "escalated": false,
  "timestamp": "2026-04-02T15:30:45.123456"
}
```

---

## 4. Sabretooth CLI: Verify Gemini Integration

### On Sabretooth (192.168.0.8) via SSH/RDP

#### 4a. Install Google Cloud CLI
```bash
# If not already installed
# macOS:
brew install google-cloud-sdk

# Linux:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows (PowerShell):
choco install google-cloud-sdk
# or download from: https://cloud.google.com/sdk/docs/install
```

#### 4b. Configure gcloud with Gemini Project
```bash
# Login to your Google Cloud account
gcloud auth login

# Set project (replace with your project ID)
gcloud config set project YOUR_GCP_PROJECT_ID

# Set API key as environment variable
export GOOGLE_API_KEY="AIza..."

# Verify
gcloud ai models list
```

#### 4c: Test Gemini CLI on Sabretooth
```bash
# Using curl directly (no SDK needed)
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIza..." \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Answer briefly: What is YouAndINotAI?"
      }]
    }]
  }'
```

#### Expected Output
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "YouAndINotAI is a verified-human dating platform launched April 4, 2026. Every person passes a liveness check to prove they're human..."
      }]
    }
  }]
}
```

#### 4d: Store Gemini Response in Support Bot Database
```bash
# On Sabretooth, call support bot API with Gemini fallback
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I verify my account?"}'
```

---

## 5. Verify Works with youandinotai.com

### 5a: Add Support Bot to Website

#### Option 1: Web Chat Widget (Recommended)
```html
<!-- Add to youandinotai.com header or footer -->
<script>
  window.supportBotConfig = {
    apiUrl: "http://127.0.0.1:8765/api/support/ask",
    theme: "light",
    position: "bottom-right"
  };
</script>
<script src="https://youandinotai.com/js/support-widget.js"></script>
```

#### Option 2: API Endpoint
```javascript
// On youandinotai.com frontend:
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

#### Option 3: iframe Embed
```html
<!-- Embed support chat on youandinotai.com -->
<iframe 
  src="http://127.0.0.1:8765/chat" 
  width="400" 
  height="600"
  frameborder="0">
</iframe>
```

### 5b: Test from Browser
```javascript
// Open youandinotai.com in browser console:
fetch('http://127.0.0.1:8765/api/support/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'What is the verification fee?' })
})
.then(r => r.json())
.then(data => console.log(data.response))
```

### 5c: Monitor Support Tickets
```bash
# Check SQLite database on D:\support-claw\
sqlite3 state/support.db "SELECT * FROM tickets;"

# Or via API:
curl http://127.0.0.1:8765/api/support/status
```

---

## 6. Production Deployment Checklist

- [ ] **Gemini API Key**: Stored in `.env` on D:\support-claw\
- [ ] **Ollama**: Running on Sabretooth (192.168.0.8:11434)
- [ ] **FAQ Database**: Updated with YouAndINotAI content (`data/faq.json`)
- [ ] **Support Bot**: Running on http://127.0.0.1:8765
- [ ] **API Endpoints**: Accessible and responding
- [ ] **Tickets Logged**: SQLite database recording interactions
- [ ] **Website Integration**: Chat widget or API endpoint added to youandinotai.com
- [ ] **Monitoring**: Logs being written to `logs/support.log`
- [ ] **Escalation**: Unresolved tickets marked and routable to humans
- [ ] **Rate Limiting**: 10 requests/minute per IP (hardcoded)

---

## 7. CLI Commands Reference

### Check Support Bot Status
```bash
curl http://127.0.0.1:8765/health
curl http://127.0.0.1:8765/api/support/status
```

### Ask a Question via CLI
```bash
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "How much does it cost?"}'
```

### Check Logs
```powershell
# On D:\support-claw\
Get-Content logs/support.log -Tail 50 -Wait
```

### View Database
```bash
# On D:\support-claw\
sqlite3 state/support.db
> SELECT COUNT(*) FROM tickets;
> SELECT query, response FROM tickets WHERE escalated=1;
```

### Test Gemini Direct (Sabretooth)
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIza..." \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Answer: What is YouAndINotAI?"}]}]}'
```

---

## 8. Troubleshooting

### "Ollama connection failed"
```bash
# Check Sabretooth is running Ollama
curl http://192.168.0.8:11434/api/tags

# If fails, start Ollama on Sabretooth:
ollama serve
```

### "Gemini API Key invalid"
```bash
# Verify key format (should start with AIza...)
# Regenerate at: https://ai.google.dev/

# Test locally:
python -c "import google.generativeai; print('✅ SDK installed')"
```

### "Support bot not responding"
```bash
# Check if running:
lsof -i :8765  # Linux/Mac
netstat -ano | grep 8765  # Windows

# Check logs:
tail -f D:\support-claw\logs\support.log
```

### "Website can't reach support bot"
```
# If on same PC (localhost):
- Use http://127.0.0.1:8765 (correct)

# If on different network:
- Change host from 127.0.0.1 to 0.0.0.0 in config.json
- Update firewall to allow port 8765
- Use http://YOUR_IP:8765 from website
```

---

## 9. Architecture Diagram

```
youandinotai.com (Website)
        ↓
    [Chat Widget / API Call]
        ↓
Support Bot (D:\support-claw\)
        ↓
  ┌─────┴─────┐
  ↓           ↓
[FAQ DB]   [Ollama on Sabretooth]
(12 answers)  (qwen2.5:7b)
                ↓
          [Gemini 2.0 Flash - Fallback]
          (if Ollama fails)
        ↓
[SQLite Ticket DB]
(Logs all interactions)
```

---

## 10. Summary: How It Works

1. **User visits youandinotai.com** → clicks support chat
2. **Question sent to support bot** → http://127.0.0.1:8765/api/support/ask
3. **Bot checks FAQ** → if match found, return FAQ answer
4. **No FAQ match** → query Ollama on Sabretooth (192.168.0.8:11434)
5. **Ollama fails** → fallback to Gemini 2.0 Flash API
6. **All responses stored** → SQLite ticket database
7. **Escalation flag set** → if confidence too low, mark for human review

**Result**: Fully automated support bot powered by Ollama (primary) + Gemini (fallback), all logged and isolated on D:\support-claw\

---

## Quick Start Summary

```bash
# 1. Setup (one time)
cd D:\support-claw
powershell -ExecutionPolicy Bypass -File setup.ps1

# 2. Add Gemini key to .env
# Edit D:\support-claw\.env and set GEMINI_API_KEY=AIza...

# 3. Start bot
python bot.py

# 4. Test locally
curl -X POST http://127.0.0.1:8765/api/support/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is YouAndINotAI?"}'

# 5. Add to youandinotai.com
# Add widget script to website or call API from frontend

# 6. Monitor
curl http://127.0.0.1:8765/api/support/status
Get-Content D:\support-claw\logs\support.log -Tail 20 -Wait
```

Done! Your support bot is isolated, safe, and ready for youandinotai.com.
