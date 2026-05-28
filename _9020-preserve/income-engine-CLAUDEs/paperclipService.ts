/**
 * Paperclip integration service for agent management
 */

export interface PaperclipConfig {
  apiUrl: string;
  apiKey: string;
  companyId: string;
}

export interface AgentStatus {
  status: "online" | "offline" | "busy";
  lastHeartbeat: Date;
  budget: number;
  tasksCompleted: number;
}

/**
 * Get agent status from Paperclip API
 */
export async function getAgentStatus(
  config: PaperclipConfig,
  agentId: string
): Promise<AgentStatus | null> {
  try {
    const response = await fetch(
      `${config.apiUrl}/agents/${agentId}/status`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("[Paperclip] Status fetch failed:", response.status);
      return null;
    }

    const data = await response.json();
    return {
      status: data.status || "offline",
      lastHeartbeat: new Date(data.lastHeartbeat),
      budget: data.budget || 0,
      tasksCompleted: data.tasksCompleted || 0,
    };
  } catch (error) {
    console.error("[Paperclip] Error fetching agent status:", error);
    return null;
  }
}

/**
 * Register an agent with Paperclip
 */
export async function registerAgent(
  config: PaperclipConfig,
  agentId: string,
  agentName: string
): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/agents/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        agentName,
        companyId: config.companyId,
      }),
    });

    if (!response.ok) {
      console.error("[Paperclip] Registration failed:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Paperclip] Error registering agent:", error);
    return false;
  }
}

/**
 * Send heartbeat to Paperclip
 */
export async function sendHeartbeat(
  config: PaperclipConfig,
  agentId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/agents/${agentId}/heartbeat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        status: "online",
      }),
    });

    if (!response.ok) {
      console.error("[Paperclip] Heartbeat failed:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Paperclip] Error sending heartbeat:", error);
    return false;
  }
}

/**
 * Delegate a task to an agent
 */
export async function delegateTask(
  config: PaperclipConfig,
  agentId: string,
  taskDescription: string
): Promise<string | null> {
  try {
    const response = await fetch(`${config.apiUrl}/agents/${agentId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: taskDescription,
        priority: "normal",
      }),
    });

    if (!response.ok) {
      console.error("[Paperclip] Task delegation failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.taskId || null;
  } catch (error) {
    console.error("[Paperclip] Error delegating task:", error);
    return null;
  }
}
