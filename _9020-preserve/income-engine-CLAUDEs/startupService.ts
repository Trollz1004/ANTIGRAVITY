import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { paperclipConfigs } from "../../drizzle/schema";

/**
 * Startup service for initializing OpenClaw agent with Paperclip
 */

const OPENCLAW_AGENT_ID = "openclaw-unified-gui";
const OPENCLAW_AGENT_NAME = "OpenClaw Unified GUI";
const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Initialize OpenClaw agent with Paperclip on startup
 */
export async function initializeAgent(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Startup] Database not available, skipping agent initialization");
      return;
    }

    // Get Paperclip config
    const config = await db
      .select()
      .from(paperclipConfigs)
      .limit(1);

    if (!config || config.length === 0) {
      console.log("[Startup] No Paperclip config found, agent registration skipped");
      return;
    }

    const paperclipCfg = config[0];
    if (!paperclipCfg.isConnected || !paperclipCfg.apiUrl || !paperclipCfg.apiKey) {
      console.log("[Startup] Paperclip not connected, agent registration skipped");
      return;
    }

    // Register agent
    const { registerAgent } = await import("./paperclipService");
    const registered = await registerAgent(
      {
        apiUrl: paperclipCfg.apiUrl,
        apiKey: paperclipCfg.apiKey,
        companyId: paperclipCfg.companyId || "",
      },
      OPENCLAW_AGENT_ID,
      OPENCLAW_AGENT_NAME
    );

    if (registered) {
      console.log("[Startup] OpenClaw agent registered with Paperclip");
      // Start heartbeat
      startHeartbeat(paperclipCfg);
    } else {
      console.warn("[Startup] Failed to register OpenClaw agent");
    }
  } catch (error) {
    console.error("[Startup] Agent initialization failed:", error);
  }
}

/**
 * Start periodic heartbeat to Paperclip
 */
function startHeartbeat(config: any): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(async () => {
    try {
      const { sendHeartbeat } = await import("./paperclipService");
      const success = await sendHeartbeat(
        {
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          companyId: config.companyId || "",
        },
        OPENCLAW_AGENT_ID
      );

      if (!success) {
        console.warn("[Heartbeat] Failed to send heartbeat to Paperclip");
      }
    } catch (error) {
      console.error("[Heartbeat] Error sending heartbeat:", error);
    }
  }, HEARTBEAT_INTERVAL_MS);

  console.log("[Startup] Heartbeat started (interval: 60 seconds)");
}

/**
 * Stop heartbeat on shutdown
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log("[Startup] Heartbeat stopped");
  }
}
