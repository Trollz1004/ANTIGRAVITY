import axios from "axios";
import * as db from "./db";

/**
 * Paperclip Integration Service
 * Handles communication with Paperclip business OS for agent coordination
 */

export interface PaperclipConfig {
  apiUrl: string;
  apiKey: string;
  companyId: string;
}

export interface PaperclipAgent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "working" | "paused";
  budget: number;
  spent: number;
  lastHeartbeat: Date;
}

export interface PaperclipTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  budget: number;
  spent: number;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface PaperclipCompany {
  id: string;
  name: string;
  mission: string;
  budget: number;
  spent: number;
  agents: PaperclipAgent[];
}

/**
 * Initialize Paperclip API client
 */
export function createPaperclipClient(config: PaperclipConfig) {
  const client = axios.create({
    baseURL: config.apiUrl,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  return {
    /**
     * Register OpenClaw as an agent in Paperclip
     */
    async registerAgent(agentConfig: {
      name: string;
      role: string;
      description: string;
      capabilities: string[];
      budget: number;
    }) {
      try {
        const response = await client.post("/agents", {
          ...agentConfig,
          type: "openclaw",
          heartbeatUrl: `${process.env.OPENCLAW_BASE_URL}/api/paperclip/heartbeat`,
        });
        return response.data;
      } catch (error) {
        console.error("Failed to register agent with Paperclip:", error);
        throw error;
      }
    },

    /**
     * Send heartbeat to Paperclip
     */
    async sendHeartbeat(agentId: string, status: {
      status: "active" | "idle" | "working";
      currentTask?: string;
      tasksCompleted?: number;
      tokensUsed?: number;
    }) {
      try {
        const response = await client.post(`/agents/${agentId}/heartbeat`, status);
        return response.data;
      } catch (error) {
        console.error("Failed to send heartbeat:", error);
        throw error;
      }
    },

    /**
     * Get company information
     */
    async getCompany(companyId: string): Promise<PaperclipCompany> {
      try {
        const response = await client.get(`/companies/${companyId}`);
        return response.data;
      } catch (error) {
        console.error("Failed to get company:", error);
        throw error;
      }
    },

    /**
     * Get all agents in company
     */
    async getAgents(companyId: string): Promise<PaperclipAgent[]> {
      try {
        const response = await client.get(`/companies/${companyId}/agents`);
        return response.data;
      } catch (error) {
        console.error("Failed to get agents:", error);
        throw error;
      }
    },

    /**
     * Create a task in Paperclip
     */
    async createTask(companyId: string, task: Omit<PaperclipTask, "id" | "spent">) {
      try {
        const response = await client.post(`/companies/${companyId}/tasks`, task);
        return response.data;
      } catch (error) {
        console.error("Failed to create task:", error);
        throw error;
      }
    },

    /**
     * Update task status
     */
    async updateTaskStatus(
      companyId: string,
      taskId: string,
      status: PaperclipTask["status"],
      metadata?: Record<string, unknown>
    ) {
      try {
        const response = await client.patch(
          `/companies/${companyId}/tasks/${taskId}`,
          { status, metadata }
        );
        return response.data;
      } catch (error) {
        console.error("Failed to update task:", error);
        throw error;
      }
    },

    /**
     * Get task details
     */
    async getTask(companyId: string, taskId: string): Promise<PaperclipTask> {
      try {
        const response = await client.get(`/companies/${companyId}/tasks/${taskId}`);
        return response.data;
      } catch (error) {
        console.error("Failed to get task:", error);
        throw error;
      }
    },

    /**
     * Delegate task to specific agent
     */
    async delegateTask(
      companyId: string,
      taskId: string,
      agentId: string,
      context?: Record<string, unknown>
    ) {
      try {
        const response = await client.post(
          `/companies/${companyId}/tasks/${taskId}/delegate`,
          { agentId, context }
        );
        return response.data;
      } catch (error) {
        console.error("Failed to delegate task:", error);
        throw error;
      }
    },

    /**
     * Get agent status
     */
    async getAgentStatus(agentId: string): Promise<PaperclipAgent> {
      try {
        const response = await client.get(`/agents/${agentId}`);
        return response.data;
      } catch (error) {
        console.error("Failed to get agent status:", error);
        throw error;
      }
    },

    /**
     * Update agent budget
     */
    async updateAgentBudget(agentId: string, budget: number) {
      try {
        const response = await client.patch(`/agents/${agentId}`, { budget });
        return response.data;
      } catch (error) {
        console.error("Failed to update agent budget:", error);
        throw error;
      }
    },

    /**
     * Pause agent
     */
    async pauseAgent(agentId: string) {
      try {
        const response = await client.post(`/agents/${agentId}/pause`);
        return response.data;
      } catch (error) {
        console.error("Failed to pause agent:", error);
        throw error;
      }
    },

    /**
     * Resume agent
     */
    async resumeAgent(agentId: string) {
      try {
        const response = await client.post(`/agents/${agentId}/resume`);
        return response.data;
      } catch (error) {
        console.error("Failed to resume agent:", error);
        throw error;
      }
    },

    /**
     * Terminate agent
     */
    async terminateAgent(agentId: string) {
      try {
        const response = await client.post(`/agents/${agentId}/terminate`);
        return response.data;
      } catch (error) {
        console.error("Failed to terminate agent:", error);
        throw error;
      }
    },

    /**
     * Get org chart
     */
    async getOrgChart(companyId: string) {
      try {
        const response = await client.get(`/companies/${companyId}/org-chart`);
        return response.data;
      } catch (error) {
        console.error("Failed to get org chart:", error);
        throw error;
      }
    },

    /**
     * Get company goals
     */
    async getGoals(companyId: string) {
      try {
        const response = await client.get(`/companies/${companyId}/goals`);
        return response.data;
      } catch (error) {
        console.error("Failed to get goals:", error);
        throw error;
      }
    },

    /**
     * Update company goal
     */
    async updateGoal(companyId: string, goalId: string, updates: Record<string, unknown>) {
      try {
        const response = await client.patch(`/companies/${companyId}/goals/${goalId}`, updates);
        return response.data;
      } catch (error) {
        console.error("Failed to update goal:", error);
        throw error;
      }
    },
  };
}

/**
 * Sync OpenClaw chat message to Paperclip task context
 */
export async function syncChatToPaperclipTask(
  userId: number,
  sessionId: number,
  paperclipConfig: PaperclipConfig,
  taskId: string
) {
  try {
    const messages = await db.getChatMessages(sessionId);
    const client = createPaperclipClient(paperclipConfig);

    // Update task with latest conversation context
    await client.updateTaskStatus(
      paperclipConfig.companyId,
      taskId,
      "in_progress",
      {
        conversationContext: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          provider: msg.provider,
          timestamp: msg.createdAt,
        })),
      }
    );
  } catch (error) {
    console.error("Failed to sync chat to Paperclip task:", error);
    throw error;
  }
}

/**
 * Create OpenClaw chat session from Paperclip task
 */
export async function createChatFromPaperclipTask(
  userId: number,
  paperclipTask: PaperclipTask
): Promise<number> {
  try {
    const sessionResult = await db.createChatSession(
      userId,
      `Task: ${paperclipTask.title}`
    );

    const sessionId = (sessionResult as any).insertId || 0;

    // Add task context as initial message
    await db.createChatMessage(
      sessionId,
      "assistant",
      `Task: ${paperclipTask.title}\n\nDescription: ${paperclipTask.description}\n\nAssigned to: ${paperclipTask.assignedTo}\n\nBudget: $${paperclipTask.budget}`,
      "paperclip",
      "task-context"
    );

    return sessionId;
  } catch (error) {
    console.error("Failed to create chat from Paperclip task:", error);
    throw error;
  }
}
