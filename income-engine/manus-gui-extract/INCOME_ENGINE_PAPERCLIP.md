# 🎯 Income Engine + Paperclip Integration Guide

**For:** ManusClaw on 9020 (i7-4790, 32GB, GTX 1070)  
**Repo:** Trollz1004/income-engine  
**Mission:** #ForTheKids  

---

## 📋 Quick Setup

### 1. Fresh Paperclip Instance on 9020

```powershell
# Verify Paperclip is running on port 3100
curl http://localhost:3100/health

# Should return: {"status": "ok"}
```

### 2. Create Income Engine Company in Paperclip

```powershell
# In Paperclip UI:
# 1. Go to Settings → Companies
# 2. Click "Create New Company"
# 3. Name: "Income Engine"
# 4. Description: "Lead hunting and task orchestration"
# 5. Save
# 6. Copy Company ID (e.g., "company-abc123")
```

### 3. Generate API Key

```powershell
# In Paperclip UI:
# 1. Go to Settings → API Keys
# 2. Click "Create New Key"
# 3. Name: "ManusClaw Income Engine"
# 4. Permissions: All (admin)
# 5. Copy API Key (long string)
# 6. Save to .env: PAPERCLIP_API_KEY=your-key-here
```

### 4. Configure ManusClaw

```env
# In C:\income-engine\.env
PAPERCLIP_API_KEY=your-api-key-from-step-3
PAPERCLIP_URL=http://localhost:3100
PAPERCLIP_PORT=3100
PAPERCLIP_AGENT_JWT_SECRET=your-jwt-secret
PAPERCLIP_COMPANY_ID=company-abc123
PAPERCLIP_WORKSPACE=income-engine
```

### 5. Verify Connection

```powershell
# Start ManusClaw
cd C:\income-engine
pnpm dev

# In browser: http://localhost:3000
# Go to Settings → Paperclip
# Click "Test Connection"
# Should show: ✅ Connected
```

---

## 🎯 Task Assignment Workflow

### Creating Tasks from Chat

```
1. User: "Create task: Find 5 leads with $100+ budget"
2. ManusClaw: Sends to FETCHER agent
3. FETCHER: Scans Reddit, Upwork, Fiverr
4. Results: Creates task in Paperclip
5. Task: Assigned to agent (e.g., Claude Opus)
6. Status: Real-time updates in ManusClaw
```

### Manual Task Creation

```
1. Open ManusClaw Workspace
2. Click "Tasks" tab
3. Click "Create Task"
4. Fill form:
   - Title: "Find leads for Q2"
   - Description: "Budget $50+, posted <4 hours"
   - Priority: High
   - Assignee: Select agent
5. Click "Create"
6. Task appears in Paperclip instantly
```

### Assigning to Agents

```
1. In ManusClaw Tasks panel
2. Click task
3. Click "Assign"
4. Select agent from dropdown:
   - Claude Opus
   - Manus Agent
   - Custom agents
5. Set deadline
6. Click "Assign"
7. Agent receives notification
```

---

## 📊 Task Lifecycle

```
┌─────────────┐
│   BACKLOG   │  Initial state
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    TODO     │  Ready to start
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ IN_PROGRESS │  Agent working
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  IN_REVIEW  │  Waiting approval
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    DONE     │  Completed
└─────────────┘
```

### Status Transitions

```
BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE
BACKLOG → CANCELLED (anytime)
TODO → BLOCKED (if stuck)
BLOCKED → TODO (when unblocked)
IN_PROGRESS → BLOCKED (if stuck)
```

---

## 💬 Comments & Collaboration

### Adding Comments

```
1. Open task in ManusClaw
2. Scroll to "Comments" section
3. Type comment (supports markdown)
4. Use @mentions: @claude-opus, @manus-agent
5. Click "Post"
6. Comment appears in Paperclip instantly
```

### Comment Features

- **Markdown support**: **bold**, *italic*, `code`
- **@mentions**: Notify specific agents
- **Links**: Reference other tasks
- **Timestamps**: Auto-tracked
- **Edit/Delete**: 24-hour window

### Example Comment

```
@claude-opus - Found 3 leads matching criteria:
1. Reddit r/forhire - $150 budget - posted 2h ago
2. Upwork - $200 budget - posted 3h ago  
3. Fiverr - $75 budget - posted 1h ago

Top pick: #2 (Upwork, $200)
```

---

## 📈 Lead Tracking

### FETCHER Integration

```
1. ManusClaw scans lead sources every 1 hour
2. Filters: Budget >= $50, Posted <= 4 hours
3. Creates task in Paperclip for each lead
4. Assigns to lead-hunter agent
5. Tracks status: New → Contacted → Qualified → Won
```

### Lead Task Format

```
Title: [SOURCE] Lead - $BUDGET - [TITLE]
Description:
- Source: Reddit r/forhire
- Budget: $150
- Posted: 2 hours ago
- URL: https://reddit.com/r/forhire/...
- Requirements: Web design, 2-week turnaround
- Contact: user@example.com

Priority: High (if budget > $100)
Assignee: Lead Hunter Agent
```

### Tracking Metrics

```
- Total leads found: 42
- Qualified leads: 18
- Contacted: 12
- Proposals sent: 8
- Won: 3
- Conversion rate: 7.1%
```

---

## 🔐 Security & Permissions

### API Key Permissions

```
✅ Create tasks
✅ Read tasks
✅ Update tasks
✅ Delete tasks
✅ Assign tasks
✅ Add comments
✅ View agents
✅ Manage workspace
```

### Role-Based Access

```
Admin (ManusClaw):
- Create/delete tasks
- Manage agents
- View all data
- Configure settings

Agent (Claude Opus):
- View assigned tasks
- Update task status
- Add comments
- Cannot delete tasks

Viewer (Reporting):
- View tasks (read-only)
- View comments
- Export reports
```

---

## 🚨 Troubleshooting

### Connection Failed

```powershell
# Check Paperclip is running
curl http://localhost:3100/health

# Check API key in .env
echo $env:PAPERCLIP_API_KEY

# Check URL is correct
echo $env:PAPERCLIP_URL

# Restart ManusClaw
pnpm dev
```

### Tasks Not Syncing

```powershell
# Check logs
Get-Content .manus-logs/devserver.log | Select-String "paperclip"

# Verify database connection
psql -U income_user -d income_engine -c "SELECT * FROM chat_sessions LIMIT 1;"

# Check Paperclip webhook
curl -X POST http://localhost:3100/webhooks/test
```

### Agent Not Receiving Assignment

```powershell
# Check agent is registered
# In Paperclip UI: Settings → Agents

# Verify agent JWT secret
echo $env:PAPERCLIP_AGENT_JWT_SECRET

# Check notifications
# In Paperclip UI: Settings → Notifications
```

### Comments Not Appearing

```powershell
# Verify comment was saved
# In database:
psql -U income_user -d income_engine -c "SELECT * FROM chat_messages WHERE content LIKE '%@%' ORDER BY created_at DESC LIMIT 5;"

# Check Paperclip API response
# In logs: .manus-logs/networkRequests.log
```

---

## 📊 Monitoring

### Health Checks

```powershell
# Paperclip health
curl http://localhost:3100/health

# ManusClaw connection to Paperclip
curl http://localhost:3000/api/health/paperclip

# Database sync status
curl http://localhost:3000/api/health/db
```

### Metrics to Track

```
- Tasks created per day
- Average task completion time
- Agent utilization rate
- Lead conversion rate
- Comment response time
- API latency
```

### Logs

```powershell
# Real-time Paperclip logs
Get-Content .manus-logs/devserver.log -Wait -Tail 20 | Select-String "paperclip"

# Network requests to Paperclip
Get-Content .manus-logs/networkRequests.log | Select-String "paperclip"

# Errors
Get-Content .manus-logs/devserver.log | Select-String "ERROR"
```

---

## 🎯 Best Practices

### Task Naming

```
✅ Good:
- "Find 5 leads with $100+ budget"
- "[URGENT] Client X - Website redesign"
- "Q2 Lead hunting - Reddit r/forhire"

❌ Bad:
- "Task 1"
- "Work"
- "TODO"
```

### Descriptions

```
✅ Good:
Title: Find leads for web design project
Description:
- Budget: $150-300
- Timeline: 2 weeks
- Skills: React, Node.js
- Contact: email@example.com

❌ Bad:
Description: "find leads"
```

### Assignment

```
✅ Good:
- Assign to specific agent (Claude Opus)
- Set realistic deadline (2 days)
- Add context in comments

❌ Bad:
- Assign to multiple agents
- No deadline
- No context
```

---

## 🚀 Advanced Features

### Webhooks

```
POST /webhooks/paperclip/task-created
POST /webhooks/paperclip/task-updated
POST /webhooks/paperclip/task-assigned
POST /webhooks/paperclip/comment-added
```

### Automation

```
1. Task created → Auto-assign to agent
2. Lead found → Auto-create task
3. Task completed → Auto-notify owner
4. Comment added → Auto-send email
```

### Integrations

```
- Slack: Task notifications
- Email: Daily summaries
- Discord: Real-time updates
- Telegram: Urgent alerts
```

---

## 📞 Support

**If you get stuck:**
1. Check troubleshooting section above
2. Review logs in `.manus-logs/`
3. Verify Paperclip is running
4. Check .env configuration
5. Contact: support@manus.im

---

**Built for #ForTheKids Mission | Paperclip + ManusClaw Integration**

**The wall holds. The mission continues. 💚**
