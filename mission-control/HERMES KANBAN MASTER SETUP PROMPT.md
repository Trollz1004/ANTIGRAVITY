# HERMES KANBAN MASTER SETUP PROMPT
## From: Manus Agent (Meta/Key to Mission)
## To: Joshua Coleman (CEO) + Claude Code (Orchestrator) + AI Team
## Re: Hermes Kanban as Central Transparency Hub + Multi-Model AI Integration
## Date: 2026-05-07 | Status: OPERATIONAL

---

## OVERVIEW

Hermes Kanban is the **central transparency hub** for the entire mission-funded ecosystem. Every task, every platform, every AI agent, every payment, every decision is visible here.

**Architecture:**
- Hermes Kanban runs locally on port 9119
- Cloudflared DNS proxy exposes it securely to AI team
- Multi-model AI integration (Ollama Cloud, OpenCode, OpenRouter, local models)
- In-screen model selector and status dashboard
- Manus integration for task orchestration
- Real-time transparency across all platforms

---

## PART 1: HERMES KANBAN INFRASTRUCTURE SETUP

### 1.1 Local Deployment (Port 9119)

**Install Hermes Kanban locally:**
```bash
# Clone Hermes Kanban repository
git clone https://github.com/hermes-kanban/hermes-kanban.git
cd hermes-kanban

# Install dependencies
npm install

# Configure port 9119
export HERMES_PORT=9119
export HERMES_HOST=localhost

# Start Hermes Kanban
npm start
```

**Verify it's running:**
```bash
curl http://localhost:9119
# Should return Hermes Kanban dashboard
```

### 1.2 Cloudflared DNS Proxy Setup

**Install Cloudflare Tunnel:**
```bash
# Download cloudflared
# macOS: brew install cloudflare/cloudflare/cloudflared
# Windows: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# Linux: wget https://github.com/cloudflare/cloudflared/releases/download/2024.1.0/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate with Cloudflare
cloudflared tunnel login

# Create tunnel for Hermes Kanban
cloudflared tunnel create hermes-kanban-mission

# Configure tunnel to route to localhost:9119
# Create ~/.cloudflared/config.yml:
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: hermes-kanban-mission
credentials-file: /home/joshua/.cloudflared/hermes-kanban-mission.json

ingress:
  - hostname: hermes-kanban.youandinotai.com
    service: http://localhost:9119
  - service: http_status:404
EOF

# Start tunnel
cloudflared tunnel run hermes-kanban-mission

# Verify tunnel is live
# Visit: https://hermes-kanban.youandinotai.com
```

**DNS Configuration:**
```
Record: hermes-kanban
Type: CNAME
Value: hermes-kanban-mission.cfargotunnel.com
TTL: Auto
```

**Result:** Hermes Kanban is now accessible at `https://hermes-kanban.youandinotai.com` (secure, encrypted, AI team can access from anywhere)

---

## PART 2: MULTI-MODEL AI INTEGRATION

### 2.1 Ollama Cloud Integration

**Setup Ollama Cloud API:**
```javascript
// server/models/ollamaCloud.ts
import axios from 'axios';

const OLLAMA_CLOUD_API_URL = 'https://api.ollama.cloud/v1';
const OLLAMA_CLOUD_API_KEY = process.env.OLLAMA_CLOUD_API_KEY;

export async function listOllamaCloudModels() {
  try {
    const response = await axios.get(`${OLLAMA_CLOUD_API_URL}/models`, {
      headers: { Authorization: `Bearer ${OLLAMA_CLOUD_API_KEY}` }
    });
    return response.data.models;
  } catch (error) {
    console.error('Ollama Cloud API error:', error);
    return [];
  }
}

export async function callOllamaCloudModel(model, prompt, context = {}) {
  try {
    const response = await axios.post(`${OLLAMA_CLOUD_API_URL}/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
      ...context
    }, {
      headers: { Authorization: `Bearer ${OLLAMA_CLOUD_API_KEY}` }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Ollama Cloud call failed:', error);
    throw error;
  }
}
```

**GitHub Secret:**
```
OLLAMA_CLOUD_API_KEY=your_api_key_here
```

**Available Models (Free Tier):**
- llama2:7b
- mistral:7b
- neural-chat:7b
- starling-lm:7b
- zephyr:7b

---

### 2.2 OpenCode Free Models Integration

**Setup OpenCode API:**
```javascript
// server/models/opencode.ts
import axios from 'axios';

const OPENCODE_API_URL = 'https://api.opencode.dev/v1';
const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY;

export async function listOpenCodeModels() {
  try {
    const response = await axios.get(`${OPENCODE_API_URL}/models`, {
      headers: { Authorization: `Bearer ${OPENCODE_API_KEY}` }
    });
    return response.data.models.filter(m => m.free_tier === true);
  } catch (error) {
    console.error('OpenCode API error:', error);
    return [];
  }
}

export async function callOpenCodeModel(model, prompt, context = {}) {
  try {
    const response = await axios.post(`${OPENCODE_API_URL}/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
      ...context
    }, {
      headers: { Authorization: `Bearer ${OPENCODE_API_KEY}` }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenCode call failed:', error);
    throw error;
  }
}
```

**GitHub Secret:**
```
OPENCODE_API_KEY=your_api_key_here
```

**Available Free Models:**
- code-llama:7b
- codegen:7b
- starcoder:7b
- wizard-coder:7b

---

### 2.3 OpenRouter Free Models Integration

**Setup OpenRouter API:**
```javascript
// server/models/openrouter.ts
import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function listOpenRouterModels() {
  try {
    const response = await axios.get(`${OPENROUTER_API_URL}/models`, {
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` }
    });
    // Filter for free tier models
    return response.data.data.filter(m => m.pricing.prompt === '0' && m.pricing.completion === '0');
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return [];
  }
}

export async function callOpenRouterModel(model, prompt, context = {}) {
  try {
    const response = await axios.post(`${OPENROUTER_API_URL}/chat/completions`, {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
      ...context
    }, {
      headers: { 
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://youandinotai.com',
        'X-Title': 'Mission-Funded Ecosystem'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter call failed:', error);
    throw error;
  }
}
```

**GitHub Secret:**
```
OPENROUTER_API_KEY=your_api_key_here
```

**Available Free Models:**
- mistral-7b-instruct
- neural-chat-7b
- zephyr-7b-beta
- openchat-3.5

---

### 2.4 Local Custom Models (Ollama on Port 11434)

**Setup Local Ollama Integration:**
```javascript
// server/models/localOllama.ts
import axios from 'axios';

const LOCAL_OLLAMA_URL = 'http://localhost:11434';

export async function listLocalModels() {
  try {
    const response = await axios.get(`${LOCAL_OLLAMA_URL}/api/tags`);
    return response.data.models || [];
  } catch (error) {
    console.error('Local Ollama error:', error);
    return [];
  }
}

export async function callLocalModel(model, prompt, context = {}) {
  try {
    const response = await axios.post(`${LOCAL_OLLAMA_URL}/api/generate`, {
      model,
      prompt,
      stream: false,
      ...context
    });
    return response.data.response;
  } catch (error) {
    console.error('Local Ollama call failed:', error);
    throw error;
  }
}

// Streaming version for real-time responses
export async function callLocalModelStreaming(model, prompt, onChunk, context = {}) {
  try {
    const response = await axios.post(`${LOCAL_OLLAMA_URL}/api/generate`, {
      model,
      prompt,
      stream: true,
      ...context
    }, { responseType: 'stream' });

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(l => l);
      lines.forEach(line => {
        try {
          const json = JSON.parse(line);
          onChunk(json.response);
        } catch (e) {
          // Ignore parse errors
        }
      });
    });

    return new Promise((resolve, reject) => {
      response.data.on('end', () => resolve());
      response.data.on('error', reject);
    });
  } catch (error) {
    console.error('Local Ollama streaming failed:', error);
    throw error;
  }
}
```

**Local Models Available (on 9020):**
- qwen2.5:7b (currently running)
- mistral:7b (available)
- neural-chat:7b (available)
- zephyr:7b (available)

---

### 2.5 Model Router (Unified Interface)

**Create unified model router:**
```javascript
// server/models/modelRouter.ts
import * as ollamaCloud from './ollamaCloud';
import * as opencode from './opencode';
import * as openrouter from './openrouter';
import * as localOllama from './localOllama';

export async function getAllAvailableModels() {
  const models = {
    ollamaCloud: await ollamaCloud.listOllamaCloudModels(),
    opencode: await opencode.listOpenCodeModels(),
    openrouter: await openrouter.listOpenRouterModels(),
    local: await localOllama.listLocalModels()
  };
  return models;
}

export async function callModel(provider, model, prompt, context = {}) {
  const providers = {
    'ollama-cloud': ollamaCloud.callOllamaCloudModel,
    'opencode': opencode.callOpenCodeModel,
    'openrouter': openrouter.callOpenRouterModel,
    'local': localOllama.callLocalModel
  };

  const callFn = providers[provider];
  if (!callFn) throw new Error(`Unknown provider: ${provider}`);

  try {
    return await callFn(model, prompt, context);
  } catch (error) {
    console.error(`${provider}/${model} failed:`, error);
    // Fallback to next available provider
    return await fallbackToNextProvider(provider, model, prompt, context);
  }
}

async function fallbackToNextProvider(failedProvider, model, prompt, context) {
  const fallbackOrder = {
    'ollama-cloud': ['openrouter', 'opencode', 'local'],
    'openrouter': ['opencode', 'local', 'ollama-cloud'],
    'opencode': ['local', 'openrouter', 'ollama-cloud'],
    'local': ['ollama-cloud', 'openrouter', 'opencode']
  };

  for (const nextProvider of fallbackOrder[failedProvider] || []) {
    try {
      return await callModel(nextProvider, model, prompt, context);
    } catch (e) {
      continue;
    }
  }

  throw new Error('All model providers failed');
}
```

---

## PART 3: HERMES KANBAN UI ENHANCEMENTS

### 3.1 In-Screen Model Selector

**Add to Hermes Kanban dashboard:**
```html
<!-- client/src/components/ModelSelector.tsx -->
<div class="model-selector">
  <label>Select AI Model:</label>
  
  <select id="provider" onchange="updateModels()">
    <option value="local">Local Models (Ollama)</option>
    <option value="ollama-cloud">Ollama Cloud</option>
    <option value="opencode">OpenCode</option>
    <option value="openrouter">OpenRouter</option>
  </select>

  <select id="model">
    <option value="">Loading models...</option>
  </select>

  <div class="model-status">
    <span id="status">Ready</span>
    <span id="latency">--ms</span>
    <span id="cost">Free</span>
  </div>
</div>

<style>
.model-selector {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: #1a1a1a;
  border: 1px solid #00ff88;
  border-radius: 4px;
}

.model-status {
  display: flex;
  gap: 15px;
  margin-left: auto;
  font-size: 12px;
  color: #00ff88;
}

#status {
  padding: 2px 8px;
  background: #00ff88;
  color: #000;
  border-radius: 3px;
}
</style>

<script>
async function updateModels() {
  const provider = document.getElementById('provider').value;
  const response = await fetch(`/api/models?provider=${provider}`);
  const data = await response.json();
  
  const modelSelect = document.getElementById('model');
  modelSelect.innerHTML = data.models
    .map(m => `<option value="${m.id}">${m.name}</option>`)
    .join('');
}

// Load models on page load
document.addEventListener('DOMContentLoaded', updateModels);
</script>
```

### 3.2 Model Status Dashboard

**Add to Hermes Kanban:**
```html
<!-- client/src/components/ModelStatusDashboard.tsx -->
<div class="model-status-dashboard">
  <h3>AI Model Status</h3>
  
  <div class="status-grid">
    <div class="status-card local">
      <h4>Local Models</h4>
      <p>Ollama (port 11434)</p>
      <p class="status-indicator online">● Online</p>
      <p class="model-list">qwen2.5:7b, mistral:7b, neural-chat:7b</p>
      <p class="cost">Cost: Free</p>
    </div>

    <div class="status-card cloud">
      <h4>Ollama Cloud</h4>
      <p>API-based</p>
      <p class="status-indicator" id="ollama-status">● Checking...</p>
      <p class="model-count" id="ollama-count">Loading...</p>
      <p class="cost">Cost: Free tier</p>
    </div>

    <div class="status-card code">
      <h4>OpenCode</h4>
      <p>Code-specific models</p>
      <p class="status-indicator" id="opencode-status">● Checking...</p>
      <p class="model-count" id="opencode-count">Loading...</p>
      <p class="cost">Cost: Free tier</p>
    </div>

    <div class="status-card router">
      <h4>OpenRouter</h4>
      <p>Multi-provider</p>
      <p class="status-indicator" id="openrouter-status">● Checking...</p>
      <p class="model-count" id="openrouter-count">Loading...</p>
      <p class="cost">Cost: Free tier</p>
    </div>
  </div>

  <div class="fallback-chain">
    <h4>Fallback Chain (if primary fails):</h4>
    <p>Local → Ollama Cloud → OpenRouter → OpenCode → Local</p>
  </div>
</div>

<style>
.model-status-dashboard {
  padding: 20px;
  background: #0a0a0a;
  border: 1px solid #00ff88;
  border-radius: 8px;
  margin: 20px 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 15px 0;
}

.status-card {
  padding: 15px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #1a1a1a;
}

.status-card h4 {
  color: #00ff88;
  margin: 0 0 10px 0;
}

.status-indicator {
  font-weight: bold;
  margin: 5px 0;
}

.status-indicator.online {
  color: #00ff88;
}

.status-indicator.offline {
  color: #ff0000;
}

.model-list, .model-count {
  font-size: 12px;
  color: #aaa;
  margin: 5px 0;
}

.cost {
  font-size: 12px;
  color: #00ff88;
  margin-top: 10px;
  font-weight: bold;
}

.fallback-chain {
  margin-top: 20px;
  padding: 10px;
  background: #1a1a1a;
  border-left: 3px solid #00ff88;
}
</style>

<script>
async function checkModelStatus() {
  const response = await fetch('/api/models/status');
  const status = await response.json();

  document.getElementById('ollama-status').textContent = 
    status.ollamaCloud.online ? '● Online' : '● Offline';
  document.getElementById('ollama-count').textContent = 
    `${status.ollamaCloud.count} models available`;

  document.getElementById('opencode-status').textContent = 
    status.opencode.online ? '● Online' : '● Offline';
  document.getElementById('opencode-count').textContent = 
    `${status.opencode.count} models available`;

  document.getElementById('openrouter-status').textContent = 
    status.openrouter.online ? '● Online' : '● Offline';
  document.getElementById('openrouter-count').textContent = 
    `${status.openrouter.count} models available`;
}

// Check status on load and every 30 seconds
document.addEventListener('DOMContentLoaded', checkModelStatus);
setInterval(checkModelStatus, 30000);
</script>
```

---

## PART 4: MANUS INTEGRATION

### 4.1 Manus Task Orchestration

**Add Manus integration to Hermes:**
```javascript
// server/manus/taskOrchestrator.ts
import { invokeManus } from '../_core/manus';

export async function createManusTasks(kanbanCards) {
  const tasks = kanbanCards
    .filter(card => card.priority === 'CRITICAL')
    .map(card => ({
      title: card.title,
      description: card.notes,
      priority: 'high',
      context: {
        kanbanCardId: card.id,
        owner: card.owner,
        category: card.category,
        successCriteria: card.successCriteria
      }
    }));

  for (const task of tasks) {
    try {
      const result = await invokeManus({
        action: 'create_task',
        payload: task
      });
      console.log(`Created Manus task: ${result.taskId}`);
    } catch (error) {
      console.error(`Failed to create Manus task: ${task.title}`, error);
    }
  }
}

export async function syncManusTasks() {
  // Periodically sync Kanban with Manus
  const interval = setInterval(async () => {
    try {
      const kanbanCards = await getKanbanCards();
      await createManusTasks(kanbanCards);
    } catch (error) {
      console.error('Manus sync failed:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  return interval;
}
```

### 4.2 Manus Webhook Receiver

**Add Manus webhook handler:**
```javascript
// server/webhooks/manus.ts
app.post('/webhooks/manus', async (req, res) => {
  const { taskId, status, result, context } = req.body;

  try {
    // Update corresponding Kanban card
    const kanbanCard = await getKanbanCardByManuTaskId(taskId);
    
    if (status === 'completed') {
      await updateKanbanCard(kanbanCard.id, {
        status: 'DONE',
        notes: `Completed by Manus. Result: ${result}`
      });
    } else if (status === 'failed') {
      await updateKanbanCard(kanbanCard.id, {
        status: 'BLOCKED',
        notes: `Manus task failed: ${result}`
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Manus webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## PART 5: HERMES KANBAN CARD TEMPLATE

### Master Card for Hermes Setup

**Add this card to your Hermes Kanban board:**

```
TITLE: 
Hermes Kanban Master Setup + Multi-Model AI Integration

PRIORITY: 
CRITICAL

OWNER: 
Claude Code + Manus

CATEGORY: 
INFRASTRUCTURE

EFFORT: 
1 WEEK

DEPENDENCIES:
- Cloudflare account setup
- Ollama Cloud API key
- OpenCode API key
- OpenRouter API key
- Local Ollama running on port 11434

SUCCESS CRITERIA:
- [ ] Hermes Kanban running on localhost:9119
- [ ] Cloudflared tunnel active (https://hermes-kanban.youandinotai.com)
- [ ] Model selector dropdown shows all 4 providers
- [ ] Model status dashboard shows real-time status
- [ ] Ollama Cloud models loading
- [ ] OpenCode models loading
- [ ] OpenRouter models loading
- [ ] Local models loading from port 11434
- [ ] Fallback chain working (tested with provider failures)
- [ ] Manus integration syncing tasks
- [ ] Manus webhooks updating Kanban cards
- [ ] All AI team can access via Cloudflare tunnel
- [ ] Real-time transparency across all platforms
- [ ] Screenshot capability working

NOTES:
- Use GitHub secrets for all API keys
- Never expose credentials in Kanban cards
- Test each provider independently first
- Verify fallback chain with provider outages
- Document any API rate limits
- Set up monitoring for model availability
- Create incident response plan for provider failures

IMPLEMENTATION STEPS:
1. Deploy Hermes Kanban on port 9119
2. Setup Cloudflared tunnel to hermes-kanban.youandinotai.com
3. Integrate Ollama Cloud API
4. Integrate OpenCode API
5. Integrate OpenRouter API
6. Connect local Ollama on port 11434
7. Build model router with fallback chain
8. Add model selector UI component
9. Add model status dashboard
10. Integrate Manus task orchestration
11. Add Manus webhook receiver
12. Test all providers and fallbacks
13. Configure monitoring and alerts
14. Document for AI team
15. Launch to AI team

TESTING CHECKLIST:
- [ ] Each provider works independently
- [ ] Fallback chain works when primary fails
- [ ] Model selector updates correctly
- [ ] Status dashboard refreshes every 30 seconds
- [ ] Manus tasks sync to Kanban
- [ ] Kanban updates sync back to Manus
- [ ] Cloudflare tunnel is stable
- [ ] No credentials exposed in logs
- [ ] Performance acceptable (< 500ms latency)
- [ ] All AI team can access and see tasks

LINKS:
- Hermes Kanban: https://hermes-kanban.youandinotai.com
- Ollama Cloud: https://ollama.cloud
- OpenCode: https://opencode.dev
- OpenRouter: https://openrouter.ai
- Local Ollama: http://localhost:11434
```

---

## PART 6: TRANSPARENCY & MONITORING

### 6.1 Real-Time Task Visibility

**All AI team members can see:**
- Current tasks (what's being worked on)
- Task status (BACKLOG, IN PROGRESS, REVIEW, DONE)
- Task owner (who's responsible)
- Task priority (CRITICAL, HIGH, MEDIUM, LOW)
- Success criteria (how we know it's done)
- Blockers (what's preventing progress)
- Revenue impact (how much this task generates)
- Mission alignment (how this helps #ForTheKids)

### 6.2 Model Selection Transparency

**Every task shows:**
- Which AI model was used
- Which provider (local, Ollama Cloud, OpenCode, OpenRouter)
- Response time (latency)
- Cost (free tier or paid)
- Quality score (if available)

### 6.3 Weekly Standup Report

**Every Friday in Hermes Kanban:**
- Cards moved to DONE
- Revenue generated (real numbers)
- Founder cap status ($X of $50k)
- Kids bucket total paymentd
- Blockers and resolutions
- Next week priorities
- Model performance metrics

---

## GITHUB SECRETS REQUIRED

```
OLLAMA_CLOUD_API_KEY=your_key
OPENCODE_API_KEY=your_key
OPENROUTER_API_KEY=your_key
CLOUDFLARE_TUNNEL_TOKEN=your_token
MANUS_API_KEY=your_key
```

---

## DEPLOYMENT CHECKLIST

- [ ] Hermes Kanban installed and running on port 9119
- [ ] Cloudflared tunnel configured and active
- [ ] DNS record pointing to tunnel
- [ ] All GitHub secrets configured
- [ ] Model integrations tested
- [ ] UI components deployed
- [ ] Manus integration active
- [ ] Monitoring configured
- [ ] AI team can access
- [ ] Documentation complete

---

**From Manus Agent | Meta/Key to Mission | 2026-05-07 | #ForTheKids Always 💚**

**This is your operational transparency hub. Every task. Every model. Every decision. Every AI agent. All visible. All real. All mission-focused.**
