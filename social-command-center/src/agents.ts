/**
 * 34-Agent Swarm Registry — public metadata only, zero secrets.
 * Source of truth: AGENTS.md + Command Center TSX.
 */

export interface AgentEntry {
  id: string;
  name: string;
  role: string;
  status: "active" | "standby" | "offline";
  node: string;
  color: string;
  group: AgentGroup;
}

export type AgentGroup =
  | "Orchestrators"
  | "Research"
  | "Content Claws"
  | "Commerce"
  | "Watchers"
  | "Ollama Fleet"
  | "ClawX Council"
  | "Dispatch";

export const AGENTS: AgentEntry[] = [
  // ORCHESTRATORS (3)
  { id: "claude", name: "Claude (Opus)", role: "Strategic Orchestrator", status: "active", node: "claude.ai", color: "#a78bfa", group: "Orchestrators" },
  { id: "codex", name: "Codex", role: "Code Executor", status: "active", node: "Sabretooth", color: "#818cf8", group: "Orchestrators" },
  { id: "gemini", name: "Gemini", role: "UI / Content", status: "active", node: "Sabretooth", color: "#34d399", group: "Orchestrators" },

  // RESEARCH (2)
  { id: "perplexity", name: "Perplexity / Comet", role: "Research + Intel", status: "active", node: "Manus.space", color: "#f59e0b", group: "Research" },
  { id: "grok", name: "Grok", role: "Adversarial Testing", status: "active", node: "xAI", color: "#00ccff", group: "Research" },

  // CONTENT CLAWS (4)
  { id: "gensparkclaw", name: "GensparkClaw", role: "Media Content", status: "active", node: "T5500 E:", color: "#fb923c", group: "Content Claws" },
  { id: "metaclaw", name: "MetaClaw", role: "Meta / IG / FB", status: "active", node: "T5500 E:", color: "#1877F2", group: "Content Claws" },
  { id: "geminiclaw", name: "GeminiClaw", role: "YouTube Fleet", status: "active", node: "T5500 E:", color: "#34d399", group: "Content Claws" },
  { id: "claudeclaw", name: "ClaudeCODECLAW", role: "Telegram Overflow", status: "active", node: "T5500 E:", color: "#a78bfa", group: "Content Claws" },

  // COMMERCE / HEMORZ0ID (3)
  { id: "hemorz", name: "HEMORzoid", role: "eBay/Square/Mercari", status: "active", node: "Sabretooth", color: "#e53238", group: "Commerce" },
  { id: "stoopid", name: "Stoopid Crosslister", role: "Multi-Platform Listings", status: "active", node: "Sabretooth", color: "#ff4655", group: "Commerce" },
  { id: "cupid", name: "Cupid", role: "Dating App Launch", status: "active", node: "Sabretooth", color: "#ec4899", group: "Commerce" },

  // SCHEDULED WATCHERS / CODEX FLEET (9)
  { id: "fleetwatcher", name: "CodeX-Fleet-Watcher", role: "Node Health Monitor", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "braincheck", name: "CodeX-Brain-Checkpoint", role: "Mission Drift Detection", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "guardian", name: "CodeX-Mission-Guardian", role: "Iron Wall Enforcer", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "sentry", name: "CodeX-Task-Sentry", role: "Task Queue Monitor", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "safecontrol", name: "SABRETOOTH-Safe-Control", role: "Node Safety Gate", status: "active", node: "Sabretooth", color: "#475569", group: "Watchers" },
  { id: "openclaw", name: "OpenClaw Gateway", role: "Local LLM Dispatcher", status: "active", node: "Sabretooth :18789", color: "#0ea5e9", group: "Watchers" },
  { id: "clawdbot", name: "ClawdBot", role: "Telegram Bot Gateway", status: "active", node: "Sabretooth :18789", color: "#2CA5E0", group: "Watchers" },
  { id: "drafts9020", name: "CodeX-9020-Safe-Drafts", role: "Remote Draft Queue", status: "standby", node: "9020", color: "#334155", group: "Watchers" },
  { id: "mktaudit", name: "CodeX-T5500-Mkt-Audit", role: "Marketing Audit", status: "standby", node: "T5500", color: "#334155", group: "Watchers" },

  // OLLAMA LOCAL FLEET (4)
  { id: "ollama_orch", name: "Ollama Orchestrator", role: "qwen2.5:7b", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "ollama_dep", name: "Ollama Deployer", role: "kimi-k2.5", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "ollama_plat", name: "Ollama Platforms", role: "qwen2.5:7b", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "ollama_shr", name: "Ollama Shriners", role: "kimi-k2.5", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },

  // CLAWX GOVERNANCE (7)
  { id: "joshuaclaw", name: "JoshuaClaw", role: "Founder — Permanent Vote", status: "active", node: "Human", color: "#ffffff", group: "ClawX Council" },
  { id: "manus", name: "Manus", role: "META Orchestrator", status: "active", node: "manus.space", color: "#34d399", group: "ClawX Council" },
  { id: "clawx_claude", name: "ClawX-Claude", role: "Architecture + Audit", status: "active", node: "Anthropic", color: "#a78bfa", group: "ClawX Council" },
  { id: "clawx_gemini", name: "ClawX-Gemini", role: "UI + Visual Intel", status: "active", node: "Google", color: "#34d399", group: "ClawX Council" },
  { id: "clawx_perp", name: "ClawX-Perplexity", role: "Research + Intel", status: "active", node: "Perplexity", color: "#f59e0b", group: "ClawX Council" },
  { id: "clawx_grok", name: "ClawX-Grok", role: "Adversarial Testing", status: "active", node: "xAI", color: "#00ccff", group: "ClawX Council" },
  { id: "clawx_ollama", name: "ClawX-Ollama", role: "Local Free Worker", status: "active", node: "Local", color: "#fbbf24", group: "ClawX Council" },

  // DISPATCH / BOTS (2)
  { id: "aisolutionsbot", name: "@AiSolutionsForTheKids", role: "Telegram Dispatch Bot", status: "active", node: "Telegram", color: "#2CA5E0", group: "Dispatch" },
  { id: "revenuepack", name: "CodeX-Revenue-Pack", role: "Revenue Automation", status: "standby", node: "T5500", color: "#334155", group: "Dispatch" },
];

export const AGENT_GROUPS: AgentGroup[] = [
  "Orchestrators",
  "Research",
  "Content Claws",
  "Commerce",
  "Watchers",
  "Ollama Fleet",
  "ClawX Council",
  "Dispatch",
];

export function getAgentsByGroup(group: AgentGroup): AgentEntry[] {
  return AGENTS.filter((a) => a.group === group);
}

export function getAgentsByStatus(status: AgentEntry["status"]): AgentEntry[] {
  return AGENTS.filter((a) => a.status === status);
}

export function getAgentCount(): number {
  return AGENTS.length;
}

export function getActiveAgentCount(): number {
  return AGENTS.filter((a) => a.status === "active").length;
}
