import axios, { AxiosInstance } from "axios";

/**
 * Paperclip Integration Service
 * Full integration with Paperclip business OS for issue/task management
 * Based on official Paperclip API: https://github.com/paperclipai/paperclip
 */

export interface PaperclipConfig {
  apiUrl: string; // e.g., "http://localhost:3000"
  apiKey?: string; // JWT token or API key
  companyId: string;
}

export interface PaperclipIssue {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  assigneeAgentId?: string;
  projectId?: string;
  goalId?: string;
  parentId?: string;
  billingCode?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  planDocument?: string;
  documentSummaries?: Array<{
    key: string;
    title: string;
    format: string;
  }>;
}

export interface PaperclipAgent {
  id: string;
  name: string;
  urlKey: string;
  role?: string;
  status: "active" | "idle" | "working" | "paused";
  capabilities?: string[];
}

export interface PaperclipComment {
  id: string;
  body: string;
  authorAgentId: string;
  createdAt: string;
}

export interface PaperclipDocument {
  key: string;
  title: string;
  format: "markdown" | "text";
  body: string;
  revisionId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Paperclip API client
 */
export function createPaperclipClient(config: PaperclipConfig): PaperclipClient {
  return new PaperclipClient(config);
}

class PaperclipClient {
  private client: AxiosInstance;
  private companyId: string;

  constructor(config: PaperclipConfig) {
    this.companyId = config.companyId;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });
  }

  /**
   * Create a new issue in Paperclip
   */
  async createIssue(issue: {
    title: string;
    description: string;
    status?: "backlog" | "todo" | "in_progress" | "in_review" | "done";
    priority?: "low" | "medium" | "high" | "critical";
    assigneeAgentId?: string;
    parentId?: string;
    projectId?: string;
    goalId?: string;
    billingCode?: string;
  }): Promise<PaperclipIssue> {
    try {
      console.log("[Paperclip] Creating issue:", issue.title);

      const response = await this.client.post(
        `/api/companies/${this.companyId}/issues`,
        {
          title: issue.title,
          description: issue.description,
          status: issue.status || "todo",
          priority: issue.priority || "medium",
          assigneeAgentId: issue.assigneeAgentId,
          parentId: issue.parentId,
          projectId: issue.projectId,
          goalId: issue.goalId,
          billingCode: issue.billingCode,
        }
      );

      console.log("[Paperclip] Issue created successfully:", response.data.id);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to create issue:", error);
      throw error;
    }
  }

  /**
   * List all issues in company
   */
  async listIssues(filters?: {
    status?: string; // comma-separated: "todo,in_progress"
    assigneeAgentId?: string;
    projectId?: string;
  }): Promise<PaperclipIssue[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.assigneeAgentId) params.append("assigneeAgentId", filters.assigneeAgentId);
      if (filters?.projectId) params.append("projectId", filters.projectId);

      const response = await this.client.get(
        `/api/companies/${this.companyId}/issues?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to list issues:", error);
      throw error;
    }
  }

  /**
   * Get a specific issue
   */
  async getIssue(issueId: string): Promise<PaperclipIssue> {
    try {
      const response = await this.client.get(`/api/issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to get issue:", error);
      throw error;
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(
    issueId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assigneeAgentId?: string;
      projectId?: string;
      goalId?: string;
      parentId?: string;
      billingCode?: string;
      comment?: string;
    },
    runId?: string
  ): Promise<PaperclipIssue> {
    try {
      console.log("[Paperclip] Updating issue:", issueId);

      const headers: Record<string, string> = {};
      if (runId) {
        headers["X-Paperclip-Run-Id"] = runId;
      }

      const response = await this.client.patch(`/api/issues/${issueId}`, updates, {
        headers,
      });

      console.log("[Paperclip] Issue updated successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to update issue:", error);
      throw error;
    }
  }

  /**
   * Assign issue to agent
   */
  async assignIssue(issueId: string, agentId: string, runId?: string): Promise<PaperclipIssue> {
    try {
      console.log("[Paperclip] Assigning issue to agent:", agentId);

      return await this.updateIssue(
        issueId,
        {
          assigneeAgentId: agentId,
          status: "todo",
        },
        runId
      );
    } catch (error) {
      console.error("[Paperclip] Failed to assign issue:", error);
      throw error;
    }
  }

  /**
   * Checkout (claim) an issue
   */
  async checkoutIssue(
    issueId: string,
    agentId: string,
    expectedStatuses: string[] = ["todo", "backlog", "blocked", "in_review"],
    runId?: string
  ): Promise<{ success: boolean }> {
    try {
      console.log("[Paperclip] Checking out issue:", issueId);

      const headers: Record<string, string> = {};
      if (runId) {
        headers["X-Paperclip-Run-Id"] = runId;
      }

      const response = await this.client.post(
        `/api/issues/${issueId}/checkout`,
        {
          agentId,
          expectedStatuses,
        },
        { headers }
      );

      console.log("[Paperclip] Issue checked out successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to checkout issue:", error);
      throw error;
    }
  }

  /**
   * Release an issue
   */
  async releaseIssue(issueId: string): Promise<{ success: boolean }> {
    try {
      console.log("[Paperclip] Releasing issue:", issueId);

      const response = await this.client.post(`/api/issues/${issueId}/release`);

      console.log("[Paperclip] Issue released successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to release issue:", error);
      throw error;
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueId: string, body: string): Promise<PaperclipComment> {
    try {
      console.log("[Paperclip] Adding comment to issue:", issueId);

      const response = await this.client.post(`/api/issues/${issueId}/comments`, {
        body,
      });

      console.log("[Paperclip] Comment added successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to add comment:", error);
      throw error;
    }
  }

  /**
   * List comments on issue
   */
  async listComments(issueId: string): Promise<PaperclipComment[]> {
    try {
      const response = await this.client.get(`/api/issues/${issueId}/comments`);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to list comments:", error);
      throw error;
    }
  }

  /**
   * Create or update issue document
   */
  async setDocument(
    issueId: string,
    key: string,
    document: {
      title: string;
      format: "markdown" | "text";
      body: string;
      baseRevisionId?: string;
    }
  ): Promise<PaperclipDocument> {
    try {
      console.log("[Paperclip] Setting document:", key, "for issue:", issueId);

      const response = await this.client.put(`/api/issues/${issueId}/documents/${key}`, document);

      console.log("[Paperclip] Document set successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to set document:", error);
      throw error;
    }
  }

  /**
   * Get issue document
   */
  async getDocument(issueId: string, key: string): Promise<PaperclipDocument> {
    try {
      const response = await this.client.get(`/api/issues/${issueId}/documents/${key}`);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to get document:", error);
      throw error;
    }
  }

  /**
   * List all documents for issue
   */
  async listDocuments(issueId: string): Promise<PaperclipDocument[]> {
    try {
      const response = await this.client.get(`/api/issues/${issueId}/documents`);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to list documents:", error);
      throw error;
    }
  }

  /**
   * Create interaction (request confirmation, suggest tasks, ask questions)
   */
  async createInteraction(
    issueId: string,
    interaction: {
      kind: "request_confirmation" | "suggest_tasks" | "ask_user_questions";
      idempotencyKey: string;
      title: string;
      summary: string;
      continuationPolicy?: "wake_assignee" | "none";
      payload: Record<string, unknown>;
    }
  ): Promise<{ id: string }> {
    try {
      console.log("[Paperclip] Creating interaction:", interaction.kind, "for issue:", issueId);

      const response = await this.client.post(`/api/issues/${issueId}/interactions`, interaction);

      console.log("[Paperclip] Interaction created successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to create interaction:", error);
      throw error;
    }
  }

  /**
   * List interactions for issue
   */
  async listInteractions(issueId: string): Promise<Array<{ id: string; kind: string }>> {
    try {
      const response = await this.client.get(`/api/issues/${issueId}/interactions`);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to list interactions:", error);
      throw error;
    }
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(
    issueId: string,
    file: Buffer,
    filename: string
  ): Promise<{ id: string; url: string }> {
    try {
      console.log("[Paperclip] Uploading attachment:", filename);

      const formData = new FormData();
      const blob = new Blob([file]);
      formData.append("file", blob, filename);

      const response = await this.client.post(
        `/api/companies/${this.companyId}/issues/${issueId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("[Paperclip] Attachment uploaded successfully");
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to upload attachment:", error);
      throw error;
    }
  }

  /**
   * List attachments for issue
   */
  async listAttachments(issueId: string): Promise<Array<{ id: string; filename: string }>> {
    try {
      const response = await this.client.get(`/api/issues/${issueId}/attachments`);
      return response.data;
    } catch (error) {
      console.error("[Paperclip] Failed to list attachments:", error);
      throw error;
    }
  }
}

export type PaperclipClient = InstanceType<typeof PaperclipClient>;
