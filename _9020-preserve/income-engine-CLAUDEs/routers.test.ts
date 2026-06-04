import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context with authenticated user
function createMockContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Chat Router", () => {
  it("should create a new chat session", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.createSession({ title: "Test Chat" });

    expect(result).toBeDefined();
    expect(result.title).toBe("Test Chat");
    expect(result.userId).toBe(1);
  });

  it("should list chat sessions", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a session first
    await caller.chat.createSession({ title: "Session 1" });

    const sessions = await caller.chat.listSessions();

    expect(Array.isArray(sessions)).toBe(true);
  });

  it("should add message to session", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create session
    const session = await caller.chat.createSession({ title: "Test" });

    // Add message
    const message = await caller.chat.addMessage({
      sessionId: session.id,
      role: "user",
      content: "Hello",
      provider: "ollama",
      model: "neural-chat",
    });

    expect(message).toBeDefined();
    expect(message.content).toBe("Hello");
    expect(message.role).toBe("user");
  });
});

describe("Settings Router", () => {
  it("should update provider config", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.updateProviderConfig({
      provider: "ollama",
      apiKey: "test-key",
      baseUrl: "http://localhost:11434",
    });

    expect(result).toBeDefined();
    expect(result.provider).toBe("ollama");
    expect(result.apiKey).toBe("test-key");
  });

  it("should get provider config", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // First set config
    await caller.settings.updateProviderConfig({
      provider: "openai",
      apiKey: "sk-test",
    });

    // Then get it
    const config = await caller.settings.getProviderConfig({
      provider: "openai",
    });

    expect(config).toBeDefined();
    expect(config?.provider).toBe("openai");
  });

  it("should list all provider configs", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const configs = await caller.settings.getProviderConfigs();

    expect(Array.isArray(configs)).toBe(true);
  });
});

describe("Manus Router", () => {
  it("should create a new task", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueId = `task-${Date.now()}-123`;
    const result = await caller.manus.createTask({
      taskId: uniqueId,
      prompt: "Test prompt",
    });

    expect(result).toBeDefined();
    expect(result.taskId).toBe(uniqueId);
    expect(result.prompt).toBe("Test prompt");
    expect(result.status).toBe("pending");
  });

  it("should update task status", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueId = `task-${Date.now()}-456`;
    // Create task
    await caller.manus.createTask({
      taskId: uniqueId,
      prompt: "Test",
    });

    // Update status
    const result = await caller.manus.updateTaskStatus({
      taskId: uniqueId,
      status: "running",
    });

    expect(result.success).toBe(true);
  });

  it("should get task by ID", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueId = `task-${Date.now()}-789`;
    // Create task
    await caller.manus.createTask({
      taskId: uniqueId,
      prompt: "Test prompt",
    });

    // Get task
    const task = await caller.manus.getTask({ taskId: uniqueId });

    expect(task).toBeDefined();
    expect(task?.taskId).toBe(uniqueId);
  });

  it("should list user tasks", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.manus.listTasks();

    expect(Array.isArray(tasks)).toBe(true);
  });
});

describe("Paperclip Router", () => {
  it("should connect to Paperclip", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.paperclip.connect({
      apiUrl: "https://api.paperclip.ai",
      apiKey: "pk-test-key",
      companyId: "company-123",
    });

    expect(result).toBeDefined();
    expect(result.apiUrl).toBe("https://api.paperclip.ai");
    expect(result.companyId).toBe("company-123");
    expect(result.isConnected).toBe(true);
  });

  it("should get Paperclip config", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Connect first
    await caller.paperclip.connect({
      apiUrl: "https://api.paperclip.ai",
      apiKey: "pk-test",
      companyId: "company-456",
    });

    // Get config
    const config = await caller.paperclip.getConfig();

    expect(config).toBeDefined();
    expect(config?.companyId).toBe("company-456");
  });

  it("should update agent ID", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Connect first
    await caller.paperclip.connect({
      apiUrl: "https://api.paperclip.ai",
      apiKey: "pk-test",
      companyId: "company-789",
    });

    // Update agent
    const result = await caller.paperclip.updateAgentId({
      agentId: "agent-openclaw",
    });

    expect(result.agentId).toBe("agent-openclaw");
  });

  it("should delegate a task", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const delegation = await caller.paperclip.delegateTask({
      agentId: "test-agent-123",
      taskDescription: "Process customer data",
    });

    expect(delegation).toBeDefined();
    expect(delegation.agentId).toBe("test-agent-123");
    expect(delegation.status).toBe("pending");
  });

  it("should get agent workload", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const workload = await caller.paperclip.getAgentWorkload({
      agentId: "test-agent-123",
    });

    expect(workload).toBeDefined();
    expect(workload.total).toBeGreaterThanOrEqual(0);
  });
});

describe("FETCHER Router", () => {
  it("should log a new lead", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fetcher.logLead({
      source: "upwork",
      title: "Build a React App",
      url: "https://upwork.com/jobs/123",
      budget: 500,
      postedAt: new Date(),
      deliverable: "Full-stack React application",
      estimatedHourlyRate: 75,
      qualified: true,
    });

    expect(result).toBeDefined();
    expect(result.source).toBe("upwork");
    expect(result.title).toBe("Build a React App");
    expect(result.qualified).toBe(true);
  });

  it("should get qualified leads", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const leads = await caller.fetcher.getLeads({ hoursAgo: 24 });

    expect(Array.isArray(leads)).toBe(true);
  });

  it("should get all leads", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const leads = await caller.fetcher.getAllLeads();

    expect(Array.isArray(leads)).toBe(true);
  });

  it("should trigger lead scan", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fetcher.scanForLeads();

    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });
});

describe("Auth Router", () => {
  it("should get current user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
    expect(user?.role).toBe("user");
  });
});
