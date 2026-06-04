# OpenClaw Implementation Guide for Claude Opus & Team

This guide outlines the remaining implementation tasks for OpenClaw. These features are designed to be built by Claude Opus, Manus, and the team as you find leads and coordinate work.

## 🎯 Overview

OpenClaw has a solid foundation with:
- ✅ Database schema and tRPC procedures
- ✅ Multi-provider model support (Ollama, OpenRouter, OpenAI)
- ✅ Paperclip integration service
- ✅ FETCHER lead scanning logic
- ✅ Image generation service
- ✅ Manus API integration framework
- ✅ Dark cyberpunk UI with sidebar

The following tasks complete the end-to-end functionality and are ready for implementation.

---

## 1. Streaming Chat Responses

### Current State
- Backend has `ollamaCloud.streamChatCompletion()` helper
- Frontend Workspace sends messages but doesn't stream responses
- No real-time markdown rendering

### Implementation Tasks

**Backend (server/routers.ts):**
```typescript
// Add streaming chat procedure
models: router({
  streamMessage: protectedProcedure
    .input(z.object({
      provider: z.string(),
      model: z.string(),
      messages: z.array(...),
      sessionId: z.number(),
    }))
    .subscription(async ({ ctx, input }) => {
      // Yield tokens as they arrive
      // Store complete message in DB when done
    }),
})
```

**Frontend (client/src/pages/Workspace.tsx):**
- Connect to streaming subscription
- Display tokens in real-time as they arrive
- Render markdown on-the-fly
- Show loading indicator during streaming
- Handle connection errors gracefully

### Success Criteria
- User types message and sees tokens appearing in real-time
- Markdown renders correctly (bold, code, tables, etc.)
- Can cancel streaming mid-response
- Message saved to database when complete

---

## 2. Image Generation in Chat

### Current State
- Backend has `generateImageForChat()` service
- No UI trigger or integration
- Image generation helpers exist but aren't wired

### Implementation Tasks

**Backend (server/routers.ts):**
```typescript
// Add image generation procedure
models: router({
  generateImage: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      sessionId: z.number(),
      style: z.enum(["realistic", "artistic", "abstract", "cyberpunk"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Call imageGeneration.generateImageForChat()
      // Return generated image URL
    }),
})
```

**Frontend (client/src/pages/Workspace.tsx):**
- Detect image generation keywords in user messages
- Show style selector (optional)
- Call generateImage mutation
- Display image inline in conversation
- Show generation progress/loading state

### Detection Keywords
- "generate image of"
- "create image"
- "draw"
- "paint"
- "illustrate"
- "make a picture"

### Success Criteria
- User types "generate image of a cyberpunk city"
- Image appears inline in conversation within 10-20 seconds
- User can see generation progress
- Image is saved with message metadata

---

## 3. Paperclip Heartbeat Scheduling

### Current State
- Heartbeat helper exists: `createPaperclipClient().sendHeartbeat()`
- No scheduled execution
- No agent registration on startup

### Implementation Tasks

**Backend (server/_core/index.ts or new file):**
```typescript
// On server startup
async function initializePaperclipAgent() {
  const config = await db.getProviderConfig(ownerUserId, "paperclip");
  if (!config) return;
  
  const client = createPaperclipClient(config);
  
  // Register agent on first run
  const agent = await client.registerAgent({
    name: "OpenClaw",
    role: "AI Workspace & Chat Interface",
    description: "Multi-provider chat, lead hunting, and task execution",
    capabilities: ["chat", "image_generation", "lead_hunting"],
    budget: 500, // Monthly budget
  });
  
  // Schedule heartbeat every 5 minutes
  setInterval(() => {
    sendHeartbeat(agent.id, {
      status: "active",
      tasksCompleted: getTaskCount(),
      tokensUsed: getTokenCount(),
    });
  }, 5 * 60 * 1000);
}
```

### Success Criteria
- OpenClaw appears in Paperclip org chart on startup
- Heartbeat sent every 5 minutes
- Agent status updates in real-time
- Budget tracking works correctly

---

## 4. FETCHER Lead Scanning

### Current State
- `fetcherAgent.runFetcherScan()` is fully implemented
- Router procedure is stubbed and returns TODO
- No actual scanning happens

### Implementation Tasks

**Backend (server/routers.ts):**
```typescript
fetcher: router({
  scanForLeads: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Get optional API keys for Upwork/Fiverr
        const upworkKey = await getApiKey(ctx.user.id, "upwork");
        const fiverrKey = await getApiKey(ctx.user.id, "fiverr");
        
        // Run full scan
        const result = await fetcherAgent.runFetcherScan(
          ctx.user.id,
          upworkKey,
          fiverrKey
        );
        
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Scan failed",
        });
      }
    }),
})
```

**Frontend (client/src/pages/Workspace.tsx or new FETCHER page):**
- Add "Scan for Leads" button
- Show scan progress
- Display results in real-time
- Show qualified leads highlighted
- Enable filtering by source/budget

### Success Criteria
- User clicks "Scan for Leads"
- Scan completes in 30-60 seconds
- Results show all sources (Reddit, Upwork, Fiverr)
- Qualified leads (budget ≥$50, posted ≤4 hours) are highlighted
- Leads saved to database

---

## 5. Owner Notifications for Qualified Leads

### Current State
- `notifyOwnerOfQualifiedLeads()` exists but only logs to console
- No real notification implementation
- TODO comments indicate missing integration

### Implementation Tasks

**Backend (server/fetcherAgent.ts):**
```typescript
async function notifyOwnerOfQualifiedLeads(
  userId: number,
  qualifiedLeads: FetcherLead[],
  topPick: FetcherLead
) {
  try {
    // Use Manus built-in notification system
    await notifyOwner({
      title: `🎯 FETCHER: ${qualifiedLeads.length} New Leads Found!`,
      content: `
Top opportunity: "${topPick.title}"
Budget: $${topPick.budget}
Source: ${topPick.source}
Posted: ${formatTime(topPick.postedAt)}

URL: ${topPick.url}

Total qualified leads: ${qualifiedLeads.length}
      `.trim(),
    });
    
    // Also send to Paperclip if connected
    const paperclipConfig = await db.getProviderConfig(userId, "paperclip");
    if (paperclipConfig) {
      // Create task in Paperclip for top pick
      const client = createPaperclipClient(paperclipConfig);
      await client.createTask(paperclipConfig.companyId, {
        title: topPick.title,
        description: topPick.deliverable,
        assignedTo: "openclaw-001",
        status: "pending",
        priority: "high",
        budget: topPick.budget,
      });
    }
  } catch (error) {
    console.error("[FETCHER] Failed to notify owner:", error);
  }
}
```

### Success Criteria
- When 3+ leads qualify, owner receives notification
- Notification includes top pick title and budget
- Notification appears in Manus dashboard
- Task created in Paperclip (if connected)
- Notification sent within 5 seconds of scan completion

---

## 6. Manus Task Message Sending

### Current State
- tRPC procedures exist for task CRUD
- No actual Manus API message sending
- Integration is framework only

### Implementation Tasks

**Backend (server/routers.ts):**
```typescript
manus: router({
  sendMessage: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get Manus API key from env
        const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
        const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
        
        // Send message to Manus task
        const response = await axios.post(
          `${apiUrl}/tasks/${input.taskId}/messages`,
          { content: input.message },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        
        return response.data;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),
})
```

**Frontend:**
- Add message input in task details
- Show message history
- Send and receive messages in real-time
- Show delivery status

### Success Criteria
- User can send messages to Manus tasks
- Messages appear in task history
- Manus agents receive messages
- Real-time updates when agents respond

---

## 7. Paperclip Agent Status Polling

### Current State
- `getAgents()` procedure exists
- No polling mechanism
- UI shows TODO placeholders

### Implementation Tasks

**Frontend (client/src/pages/PaperclipIntegration.tsx):**
```typescript
// Poll agent status every 10 seconds
useEffect(() => {
  const interval = setInterval(() => {
    getAgentsMutation.mutate({ companyId });
  }, 10 * 1000);
  
  return () => clearInterval(interval);
}, [companyId]);

// Display agent status with real-time updates
return (
  <div className="grid gap-4">
    {agents.map(agent => (
      <AgentCard
        key={agent.id}
        agent={agent}
        isLoading={getAgentsMutation.isPending}
      />
    ))}
  </div>
);
```

### Success Criteria
- Agent list updates every 10 seconds
- Status changes reflected immediately
- Budget usage updates in real-time
- Last heartbeat timestamp shown

---

## 8. Paperclip Webhook Receiver

### Current State
- No webhook route implemented
- Paperclip can't push updates to OpenClaw
- One-way integration only

### Implementation Tasks

**Backend (server/_core/index.ts):**
```typescript
// Add webhook route
app.post("/api/paperclip/webhook", async (req, res) => {
  try {
    const { event, data } = req.body;
    
    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    switch (event) {
      case "task.updated":
        await handleTaskUpdate(data);
        break;
      case "agent.status_changed":
        await handleAgentStatusChange(data);
        break;
      case "task.completed":
        await handleTaskCompleted(data);
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Success Criteria
- Paperclip can send webhook events
- OpenClaw receives and processes events
- Task updates reflected immediately
- Agent status changes trigger UI updates

---

## 9. Ollama Cloud Model Integration

### Current State
- `ollamaCloud.listModels()` exists
- Model selector doesn't use Ollama Cloud models
- No integration in UI

### Implementation Tasks

**Frontend (client/src/pages/Workspace.tsx):**
```typescript
// Update model selector to load Ollama Cloud models
const handleProviderChange = async (provider: string) => {
  if (provider === "ollama") {
    const models = await trpc.ollamaCloud.listModels.query();
    setAvailableModels(models);
  }
  // ... handle other providers
};
```

### Success Criteria
- User selects "Ollama" provider
- Models load from Ollama Cloud
- User can select any available model
- Chat works with selected model

---

## 10. Paperclip Org Chart & Goals

### Current State
- UI shows "coming soon" placeholders
- No data fetching or display
- Helpers exist but aren't used

### Implementation Tasks

**Backend (server/routers.ts):**
```typescript
paperclip: router({
  getOrgChart: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await db.getProviderConfig(ctx.user.id, "paperclip");
      const client = createPaperclipClient(config);
      return await client.getOrgChart(input.companyId);
    }),
    
  getGoals: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await db.getProviderConfig(ctx.user.id, "paperclip");
      const client = createPaperclipClient(config);
      return await client.getGoals(input.companyId);
    }),
})
```

**Frontend:**
- Display org chart as tree/graph
- Show goals with progress bars
- Allow editing goals
- Show agent assignments

### Success Criteria
- Org chart displays all agents
- Goals show with progress
- Can update goals
- Real-time sync with Paperclip

---

## 🚀 Getting Started

### For Claude Opus

1. **Start with streaming** - Most impactful for UX
2. **Add image generation** - Quick win, visible feature
3. **Wire FETCHER scanning** - Core business logic
4. **Implement notifications** - Completes lead hunting loop
5. **Build Paperclip integration** - Enables team coordination

### For Manus Team

1. **Set up Manus API integration** - Message sending, task creation
2. **Configure notification system** - Owner alerts
3. **Verify Paperclip connectivity** - Webhook setup
4. **Monitor performance** - Track token usage, costs

### For You

1. **Configure API keys** - Ollama Cloud, Upwork, Fiverr
2. **Set company goals** - In Paperclip
3. **Create agents** - Register team members
4. **Monitor leads** - Watch FETCHER find opportunities
5. **Delegate work** - Assign to Claude Opus and team

---

## 📊 Architecture Diagram

```
User Input
    ↓
[Workspace UI]
    ↓
[tRPC Procedures]
    ↓
[Service Layer]
    ├─ modelProvider (chat)
    ├─ fetcherAgent (lead hunting)
    ├─ paperclipIntegration (team coordination)
    ├─ imageGeneration (images)
    └─ ollamaCloud (models)
    ↓
[External APIs]
    ├─ Ollama Cloud
    ├─ OpenRouter
    ├─ Paperclip
    ├─ Manus
    └─ Reddit/Upwork/Fiverr
```

---

## 🧪 Testing Checklist

Before marking each feature complete:

- [ ] Feature works end-to-end
- [ ] Error handling works
- [ ] Loading states show
- [ ] Data persists correctly
- [ ] UI updates in real-time
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive

---

## 📝 Notes for Implementation

1. **Error Handling** - All API calls need try/catch with user-friendly errors
2. **Loading States** - Show spinners/skeletons during async operations
3. **Optimistic Updates** - Update UI before server confirmation when safe
4. **Rate Limiting** - Respect API rate limits (add backoff/retry)
5. **Caching** - Cache models list, agent status to reduce API calls
6. **Logging** - Log all important events for debugging
7. **Testing** - Write vitest tests for each feature
8. **Documentation** - Update README as features are added

---

## 🎯 Success Metrics

Track these as you build:

| Metric | Target |
|--------|--------|
| **Chat Response Time** | < 2 seconds first token |
| **Image Generation** | < 20 seconds |
| **FETCHER Scan** | < 60 seconds |
| **Lead Qualification** | 100% accuracy |
| **Notification Latency** | < 5 seconds |
| **API Uptime** | > 99.9% |
| **UI Load Time** | < 2 seconds |

---

## 🤝 Collaboration

- **Manus** - Infrastructure, LLM APIs, notifications
- **Claude Opus** - Streaming, image generation, Paperclip integration
- **You** - Lead hunting, team coordination, business logic
- **Paperclip** - Agent coordination, org chart, goals

---

**Ready to build? Let's go! 🚀**
