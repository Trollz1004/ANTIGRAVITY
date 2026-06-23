// ── PLATFORM TYPES ──────────────────────────────────────────
export type PlatformType = "social" | "commerce" | "content" | "llm" | "dispatch" | "infra";

// ── AI SOURCES (the only ones that create content) ──────────
export interface AiSource {
  id: string; label: string; icon: string; color: string; url: string;
}

export const AI_SOURCES: AiSource[] = [
  { id: "codex", label: "Codex CEO", icon: "C", color: "#38bdf8", url: "https://chatgpt.com/codex" },
  { id: "hermes", label: "Hermes Marketing", icon: "H", color: "#22c55e", url: "http://localhost:9020" },
  { id: "fcc", label: "FCC Worker", icon: "F", color: "#f97316", url: "http://localhost:9020" },
  { id: "grok", label: "Grok / X", icon: "\u2B21", color: "#00ccff", url: "https://x.com/i/grok" },
  { id: "genspark", label: "GenSpark Claw", icon: "G", color: "#facc15", url: "https://www.genspark.ai" },
  { id: "autoclaw", label: "AutoClaw", icon: "A", color: "#fb7185", url: "http://localhost:9020" },
  { id: "zai-openclaws", label: "Z.ai OpenClaws", icon: "Z", color: "#a78bfa", url: "https://chat.z.ai" },
  { id: "opus", label: "Opus Review", icon: "\u26A1", color: "#c084fc", url: "https://claude.ai" },
  { id: "gemini", label: "Gemini", icon: "\u2726", color: "#34d399", url: "https://aistudio.google.com" },
  { id: "perplexity", label: "Perplexity", icon: "\u25CE", color: "#f59e0b", url: "https://www.perplexity.ai" },
  { id: "manus", label: "Manus", icon: "\u2666", color: "#34d399", url: "https://manus.space" },
];
// Official OpenClaw is intentionally excluded from marketing sources.
// It is customer support only.

// ── ALL PLATFORMS (full roster from SCC + revenue-core) ─────
export interface Platform {
  id: string; label: string; icon: string; color: string;
  type: PlatformType; claw: string; api: string; url: string;
}

export const PLATFORMS: Platform[] = [
  // Social
  { id: "youtube", label: "YouTube", icon: "\u25B6", color: "#FF0000", type: "social", claw: "GeminiClaw", api: "YouTube Data API v3", url: "https://studio.youtube.com" },
  { id: "instagram", label: "Instagram", icon: "\u25C8", color: "#E1306C", type: "social", claw: "MetaClaw", api: "Meta Graph API", url: "https://www.instagram.com" },
  { id: "facebook", label: "Facebook", icon: "f", color: "#1877F2", type: "social", claw: "MetaClaw", api: "Meta Graph API", url: "https://business.facebook.com" },
  { id: "tiktok", label: "TikTok", icon: "\u266A", color: "#69C9D0", type: "social", claw: "GensparkClaw", api: "TikTok Content API", url: "https://www.tiktok.com/creator-center" },
  { id: "twitter", label: "X / Twitter", icon: "\u2715", color: "#1DA1F2", type: "social", claw: "Hermes + Grok", api: "X API v2 / manual", url: "https://x.com/compose/post" },
  { id: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", type: "social", claw: "AutoClaw", api: "LinkedIn Marketing API / manual", url: "https://www.linkedin.com/feed/" },
  { id: "reddit", label: "Reddit", icon: "\u25CF", color: "#FF4500", type: "social", claw: "Z.ai OpenClaws", api: "Reddit API v1 / manual", url: "https://www.reddit.com/submit" },
  { id: "pinterest", label: "Pinterest", icon: "P", color: "#E60023", type: "social", claw: "GensparkClaw", api: "Pinterest API v5", url: "https://www.pinterest.com/pin-creation-tool/" },
  { id: "threads", label: "Threads", icon: "@", color: "#f8fafc", type: "social", claw: "MetaClaw", api: "Manual / Meta", url: "https://www.threads.net" },
  { id: "bluesky", label: "Bluesky", icon: "B", color: "#1185FE", type: "social", claw: "AutoClaw", api: "AT Protocol / manual", url: "https://bsky.app" },
  { id: "mastodon", label: "Mastodon", icon: "M", color: "#6364FF", type: "social", claw: "AutoClaw", api: "ActivityPub / manual", url: "https://mastodon.social/publish" },
  // Commerce
  { id: "ebay", label: "eBay", icon: "e", color: "#e53238", type: "commerce", claw: "HEMORzoid", api: "eBay Browse API", url: "https://www.ebay.com/sh/overview" },
  { id: "square", label: "Square", icon: "\u25FC", color: "#00B388", type: "commerce", claw: "HEMORzoid", api: "Square Commerce API", url: "https://squareup.com/dashboard" },
  { id: "mercari", label: "Mercari", icon: "M", color: "#FF4655", type: "commerce", claw: "HEMORzoid", api: "Mercari API", url: "https://www.mercari.com/sell/" },
  { id: "fbmkt", label: "FB Marketplace", icon: "FM", color: "#1877F2", type: "commerce", claw: "MetaClaw", api: "Meta Graph API", url: "https://www.facebook.com/marketplace/create/item" },
  // Content / launch communities
  { id: "producthunt", label: "Product Hunt", icon: "PH", color: "#DA552F", type: "content", claw: "GenSpark Claw", api: "Manual launch", url: "https://www.producthunt.com/posts/new" },
  { id: "indiehackers", label: "Indie Hackers", icon: "IH", color: "#0EA5E9", type: "content", claw: "AutoClaw", api: "Manual community", url: "https://www.indiehackers.com/new-post" },
  { id: "medium", label: "Medium", icon: "Me", color: "#f8fafc", type: "content", claw: "Hermes", api: "Draft / manual", url: "https://medium.com/new-story" },
  { id: "substack", label: "Substack", icon: "S", color: "#FF6719", type: "content", claw: "Hermes", api: "Draft / manual", url: "https://substack.com/home" },
  { id: "quora", label: "Quora", icon: "Q", color: "#B92B27", type: "content", claw: "Z.ai OpenClaws", api: "Draft / manual", url: "https://www.quora.com" },
  { id: "devto", label: "DEV.to", icon: "DEV", color: "#94a3b8", type: "content", claw: "AutoClaw", api: "Draft / manual", url: "https://dev.to/new" },
  // LLM (content sources — also launchable)
  { id: "opus", label: "Claude Code", icon: "\u26A1", color: "#a78bfa", type: "llm", claw: "Orchestrator", api: "Anthropic API", url: "https://claude.ai" },
  { id: "gemini", label: "Gemini", icon: "\u2726", color: "#34d399", type: "llm", claw: "GeminiClaw", api: "Google AI Studio", url: "https://aistudio.google.com" },
  { id: "perplexity", label: "Perplexity", icon: "\u25CE", color: "#f59e0b", type: "llm", claw: "Comet", api: "Perplexity Sonar Pro", url: "https://www.perplexity.ai" },
  { id: "grok", label: "Grok", icon: "\u2B21", color: "#00ccff", type: "llm", claw: "Comet", api: "xAI API", url: "https://x.com/i/grok" },
  { id: "kimi", label: "Kimi-K2.5", icon: "K", color: "#ff6b9d", type: "llm", claw: "Ollama", api: "Ollama local", url: "http://localhost:11434" },
  { id: "qwen", label: "qwen2.5", icon: "Q", color: "#fbbf24", type: "llm", claw: "Ollama", api: "Ollama local", url: "http://localhost:11434" },
  // Dispatch
  { id: "telegram", label: "Telegram", icon: "\u2708", color: "#2CA5E0", type: "dispatch", claw: "ClawdBot", api: "Telegram Bot API", url: "https://web.telegram.org" },
  { id: "whatsapp", label: "WhatsApp", icon: "W", color: "#25D366", type: "dispatch", claw: "MetaClaw", api: "WhatsApp Business API", url: "https://web.whatsapp.com" },
  { id: "discord", label: "Discord", icon: "D", color: "#5865F2", type: "dispatch", claw: "AutoClaw", api: "Manual community", url: "https://discord.com/channels/@me" },
  // Infra
  { id: "cloudflare", label: "Cloudflare", icon: "CF", color: "#F6821F", type: "infra", claw: "Wrangler", api: "CF Pages + Workers", url: "https://dash.cloudflare.com" },
  { id: "gcp", label: "GCP / GCR", icon: "G", color: "#4285F4", type: "infra", claw: "Codex", api: "GCP Cloud Run", url: "https://console.cloud.google.com" },
  { id: "qdrant", label: "Qdrant Memory", icon: "Q", color: "#dc2626", type: "infra", claw: "Ollama", api: "Qdrant REST API", url: "http://localhost:6333/dashboard" },
  { id: "github", label: "GitHub", icon: "GH", color: "#94a3b8", type: "infra", claw: "Codex", api: "GitHub API v4", url: "https://github.com/Trollz1004/ANTIGRAVITY" },
];

// Convenience: third-party destinations stay human-approved/manual.
export const TARGET_PLATFORMS = PLATFORMS.filter(p =>
  p.type === "social" || p.type === "commerce" || p.type === "content" || p.type === "dispatch"
);

// ── CONTENT ITEM (what flows through the approval desk) ─────
export type ContentStatus = "inbox" | "approved" | "rejected" | "sent";

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  mediaUrl: string;       // URL to image, video, or audio
  mediaType: "image" | "video" | "audio" | "";
  source: string;          // AI source id
  targets: string[];       // platform ids — default is ALL social+commerce
  customUrl: string;       // user-pasted URL to a specific thread/page/location
  tags: string[];
  status: ContentStatus;
  created: string;         // ISO date
  approvedAt: string;      // ISO date or empty
  sentAt: string;          // ISO date or empty
  notes: string;           // Josh's notes/edits
}

export function createItem(partial: Partial<ContentItem>): ContentItem {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: "",
    body: "",
    mediaUrl: "",
    mediaType: "",
    source: "",
    targets: TARGET_PLATFORMS.map(p => p.id), // all social+commerce by default
    customUrl: "",
    tags: [],
    status: "inbox",
    created: new Date().toISOString().split("T")[0],
    approvedAt: "",
    sentAt: "",
    notes: "",
    ...partial,
  };
}
