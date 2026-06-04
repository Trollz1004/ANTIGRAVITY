import axios, { AxiosInstance } from "axios";

export interface HermesConfig {
  apiUrl: string;
  dashboardUrl?: string;
  apiToken?: string;
}

export interface HermesSession {
  id: string;
  name: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface HermesAgent {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  role: string;
  queue: number;
  lastSeen: string;
}

export interface HermesMemory {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface HermesTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
  assignedAgent?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export class HermesService {
  private client: AxiosInstance;
  private config: HermesConfig;

  constructor(config: HermesConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: config.apiToken
        ? { Authorization: `Bearer ${config.apiToken}` }
        : {},
      timeout: 30000,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      console.error("[Hermes] Health check failed:", error);
      return false;
    }
  }

  async createSession(name: string, model: string): Promise<HermesSession> {
    try {
      const response = await this.client.post("/sessions", {
        name,
        model,
      });
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to create session:", error);
      throw error;
    }
  }

  async listSessions(): Promise<HermesSession[]> {
    try {
      const response = await this.client.get("/sessions");
      return response.data || [];
    } catch (error) {
      console.error("[Hermes] Failed to list sessions:", error);
      return [];
    }
  }

  async sendMessage(
    sessionId: string,
    message: string,
    streaming: boolean = false
  ): Promise<string | AsyncIterable<string>> {
    try {
      const response = await this.client.post(
        `/sessions/${sessionId}/messages`,
        { content: message },
        { responseType: streaming ? "stream" : "json" }
      );

      if (streaming) {
        return response.data;
      }
      return response.data.content || "";
    } catch (error) {
      console.error("[Hermes] Failed to send message:", error);
      throw error;
    }
  }

  async listAgents(): Promise<HermesAgent[]> {
    try {
      const response = await this.client.get("/agents");
      return response.data || [];
    } catch (error) {
      console.error("[Hermes] Failed to list agents:", error);
      return [];
    }
  }

  async getAgentStatus(agentId: string): Promise<HermesAgent | null> {
    try {
      const response = await this.client.get(`/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to get agent status:", error);
      return null;
    }
  }

  async delegateTask(
    agentId: string,
    task: { title: string; description: string }
  ): Promise<HermesTask> {
    try {
      const response = await this.client.post(`/agents/${agentId}/tasks`, task);
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to delegate task:", error);
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<HermesTask | null> {
    try {
      const response = await this.client.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to get task status:", error);
      return null;
    }
  }

  async listMemory(limit: number = 50): Promise<HermesMemory[]> {
    try {
      const response = await this.client.get("/memory", { params: { limit } });
      return response.data || [];
    } catch (error) {
      console.error("[Hermes] Failed to list memory:", error);
      return [];
    }
  }

  async searchMemory(query: string): Promise<HermesMemory[]> {
    try {
      const response = await this.client.get("/memory/search", {
        params: { q: query },
      });
      return response.data || [];
    } catch (error) {
      console.error("[Hermes] Failed to search memory:", error);
      return [];
    }
  }

  async addMemory(content: string, metadata?: Record<string, unknown>): Promise<HermesMemory> {
    try {
      const response = await this.client.post("/memory", {
        content,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to add memory:", error);
      throw error;
    }
  }

  async listSkills(limit: number = 100): Promise<Array<{ id: string; name: string; description: string }>> {
    try {
      const response = await this.client.get("/skills", { params: { limit } });
      return response.data || [];
    } catch (error) {
      console.error("[Hermes] Failed to list skills:", error);
      return [];
    }
  }

  async getModels(): Promise<Array<{ id: string; name: string; provider: string }>> {
    try {
      const response = await this.client.get("/models");
      return response.data || [];
    } catch (error) {
      console.error("[Hermes] Failed to get models:", error);
      return [];
    }
  }

  async orchestrateSwarm(
    mission: string,
    agents?: string[]
  ): Promise<{ taskId: string; agents: string[] }> {
    try {
      const response = await this.client.post("/swarm/orchestrate", {
        mission,
        agents,
      });
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to orchestrate swarm:", error);
      throw error;
    }
  }

  async getMissionStatus(missionId: string): Promise<{
    id: string;
    status: string;
    progress: number;
    agents: Array<{ id: string; status: string; progress: number }>;
  } | null> {
    try {
      const response = await this.client.get(`/swarm/missions/${missionId}`);
      return response.data;
    } catch (error) {
      console.error("[Hermes] Failed to get mission status:", error);
      return null;
    }
  }
}

let hermesService: HermesService | null = null;

export function initHermesService(config: HermesConfig): HermesService {
  hermesService = new HermesService(config);
  return hermesService;
}

export function getHermesService(): HermesService | null {
  return hermesService;
}
