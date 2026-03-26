"use client";

import React, { useState, useEffect } from "react";
import {
  Radio, Users, Layers, Rss, Moon, Sun, ChevronDown, ChevronUp,
  Activity, Wifi, WifiOff, Shield, Terminal, Globe, ShoppingCart,
  Cpu, Send, Server,
} from "lucide-react";

// ── TYPES ──────────────────────────────────────────────────────
type PlatformType = "social" | "commerce" | "llm" | "dispatch" | "infra";
type AgentStatus = "active" | "standby" | "offline";
type PostStatus = "Live" | "Queued" | "Draft";
type Tab = "dashboard" | "platforms" | "agents" | "feed";

interface Platform {
  id: string; label: string; icon: string; color: string;
  type: PlatformType; claw: string; api: string;
  corsSupport: string; notes: string;
}

interface Agent {
  id: string; name: string; role: string; status: AgentStatus;
  node: string; color: string; group: string;
}

interface Post {
  id: number; platform: string; llm: string; agent: string;
  title: string; reach: number; likes: number; comments: number;
  shares: number; status: PostStatus; deployed: string; tags: string[];
}

// ── DATA (from social-command-center MCP) ─────────────────────
const PLATFORMS: Platform[] = [
  { id: "youtube", label: "YouTube", icon: "\u25B6", color: "#FF0000", type: "social", claw: "GeminiClaw", api: "YouTube Data API v3", corsSupport: "browser", notes: "Browser-direct via GIS." },
  { id: "instagram", label: "Instagram", icon: "\u25C8", color: "#E1306C", type: "social", claw: "MetaClaw", api: "Meta Graph API", corsSupport: "backend-proxy", notes: "Server-to-server. No browser SDK." },
  { id: "facebook", label: "Facebook", icon: "f", color: "#1877F2", type: "social", claw: "MetaClaw", api: "Meta Graph API", corsSupport: "browser", notes: "FB JS SDK v22.0+ Pages only." },
  { id: "tiktok", label: "TikTok", icon: "\u266A", color: "#69C9D0", type: "social", claw: "GensparkClaw", api: "TikTok Content API", corsSupport: "backend-proxy", notes: "Most restrictive. Server-only." },
  { id: "twitter", label: "X / Twitter", icon: "\u2715", color: "#1DA1F2", type: "social", claw: "ClaudeClaw", api: "X API v2", corsSupport: "backend-proxy", notes: "No CORS. Server proxy mandatory." },
  { id: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2", type: "social", claw: "ClaudeClaw", api: "LinkedIn Marketing API", corsSupport: "backend-proxy", notes: "Browser JS SDK discontinued." },
  { id: "reddit", label: "Reddit", icon: "\u25CF", color: "#FF4500", type: "social", claw: "OpenClaw", api: "Reddit API v1", corsSupport: "backend-proxy", notes: "No CORS headers." },
  { id: "pinterest", label: "Pinterest", icon: "P", color: "#E60023", type: "social", claw: "GensparkClaw", api: "Pinterest API v5", corsSupport: "backend-proxy", notes: "All server-side. Tokens 30d." },
  { id: "ebay", label: "eBay", icon: "e", color: "#e53238", type: "commerce", claw: "HEMORzoid", api: "eBay Browse API", corsSupport: "backend-proxy", notes: "Server-side OAuth." },
  { id: "square", label: "Square", icon: "\u25FC", color: "#00B388", type: "commerce", claw: "HEMORzoid", api: "Square Commerce API", corsSupport: "backend-proxy", notes: "Payment links live." },
  { id: "mercari", label: "Mercari", icon: "M", color: "#FF4655", type: "commerce", claw: "HEMORzoid", api: "Mercari API", corsSupport: "backend-proxy", notes: "No public API." },
  { id: "fbmkt", label: "FB Marketplace", icon: "FM", color: "#1877F2", type: "commerce", claw: "MetaClaw", api: "Meta Graph API", corsSupport: "backend-proxy", notes: "Marketplace API restricted." },
  { id: "opus", label: "Opus (Claude)", icon: "\u26A1", color: "#a78bfa", type: "llm", claw: "Orchestrator", api: "Anthropic API", corsSupport: "backend-proxy", notes: "Primary architect. ~90% of codebase." },
  { id: "gemini", label: "Gemini", icon: "\u2726", color: "#34d399", type: "llm", claw: "GeminiClaw", api: "Google AI Studio", corsSupport: "backend-proxy", notes: "UI / Content / Visual intel." },
  { id: "perplexity", label: "Perplexity", icon: "\u25CE", color: "#f59e0b", type: "llm", claw: "Comet", api: "Perplexity Sonar Pro", corsSupport: "backend-proxy", notes: "Deep research + competitor intel." },
  { id: "grok", label: "Grok", icon: "\u2B21", color: "#00ccff", type: "llm", claw: "Comet", api: "xAI API", corsSupport: "backend-proxy", notes: "Adversarial testing." },
  { id: "kimi", label: "Kimi-K2.5", icon: "K", color: "#ff6b9d", type: "llm", claw: "Ollama", api: "Ollama local", corsSupport: "local", notes: "Local inference. Zero cost." },
  { id: "qwen", label: "qwen2.5", icon: "Q", color: "#fbbf24", type: "llm", claw: "Ollama", api: "Ollama local", corsSupport: "local", notes: "Default local worker." },
  { id: "telegram", label: "Telegram", icon: "\u2708", color: "#2CA5E0", type: "dispatch", claw: "ClawdBot", api: "Telegram Bot API", corsSupport: "backend-proxy", notes: "Dispatch gateway." },
  { id: "whatsapp", label: "WhatsApp", icon: "W", color: "#25D366", type: "dispatch", claw: "MetaClaw", api: "WhatsApp Business API", corsSupport: "backend-proxy", notes: "WhatsApp Business via Meta Graph." },
  { id: "cloudflare", label: "Cloudflare", icon: "CF", color: "#F6821F", type: "infra", claw: "Wrangler", api: "CF Pages + Workers", corsSupport: "n/a", notes: "Frontend + tunnels." },
  { id: "gcp", label: "GCP / GCR", icon: "G", color: "#4285F4", type: "infra", claw: "Codex", api: "GCP Cloud Run", corsSupport: "n/a", notes: "Backend deployed via Cloud Run." },
  { id: "qdrant", label: "Qdrant Memory", icon: "Q", color: "#dc2626", type: "infra", claw: "Ollama", api: "Qdrant REST API", corsSupport: "local", notes: "Vector memory. Local only." },
  { id: "github", label: "GitHub", icon: "GH", color: "#94a3b8", type: "infra", claw: "Codex", api: "GitHub API v4", corsSupport: "backend-proxy", notes: "Trollz1004/ANTIGRAVITY." },
];

const AGENTS: Agent[] = [
  { id: "claude", name: "Claude (Opus)", role: "Strategic Orchestrator", status: "active", node: "claude.ai", color: "#a78bfa", group: "Orchestrators" },
  { id: "codex", name: "Codex", role: "Code Executor", status: "active", node: "Sabretooth", color: "#818cf8", group: "Orchestrators" },
  { id: "gemini", name: "Gemini", role: "UI / Content", status: "active", node: "Sabretooth", color: "#34d399", group: "Orchestrators" },
  { id: "perplexity", name: "Perplexity / Comet", role: "Research + Intel", status: "active", node: "Manus.space", color: "#f59e0b", group: "Research" },
  { id: "grok", name: "Grok", role: "Adversarial Testing", status: "active", node: "xAI", color: "#00ccff", group: "Research" },
  { id: "gensparkclaw", name: "GensparkClaw", role: "Media Content", status: "active", node: "T5500 E:", color: "#fb923c", group: "Content Claws" },
  { id: "metaclaw", name: "MetaClaw", role: "Meta / IG / FB", status: "active", node: "T5500 E:", color: "#1877F2", group: "Content Claws" },
  { id: "geminiclaw", name: "GeminiClaw", role: "YouTube Fleet", status: "active", node: "T5500 E:", color: "#34d399", group: "Content Claws" },
  { id: "claudeclaw", name: "ClaudeCODECLAW", role: "Telegram Overflow", status: "active", node: "T5500 E:", color: "#a78bfa", group: "Content Claws" },
  { id: "hemorz", name: "HEMORzoid", role: "eBay/Square/Mercari", status: "active", node: "Sabretooth", color: "#e53238", group: "Commerce" },
  { id: "stoopid", name: "Stoopid Crosslister", role: "Multi-Platform Listings", status: "active", node: "Sabretooth", color: "#ff4655", group: "Commerce" },
  { id: "cupid", name: "Cupid", role: "Dating App Launch", status: "active", node: "Sabretooth", color: "#ec4899", group: "Commerce" },
  { id: "fleetwatcher", name: "CodeX-Fleet-Watcher", role: "Node Health Monitor", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "braincheck", name: "CodeX-Brain-Checkpoint", role: "Mission Drift Detection", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "guardian", name: "CodeX-Mission-Guardian", role: "Iron Wall Enforcer", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "sentry", name: "CodeX-Task-Sentry", role: "Task Queue Monitor", status: "active", node: "Sabretooth", color: "#64748b", group: "Watchers" },
  { id: "safecontrol", name: "SABRETOOTH-Safe-Control", role: "Node Safety Gate", status: "active", node: "Sabretooth", color: "#475569", group: "Watchers" },
  { id: "openclaw", name: "OpenClaw Gateway", role: "Local LLM Dispatcher", status: "active", node: "Sabretooth :18789", color: "#0ea5e9", group: "Watchers" },
  { id: "clawdbot", name: "ClawdBot", role: "Telegram Bot Gateway", status: "active", node: "Sabretooth :18789", color: "#2CA5E0", group: "Watchers" },
  { id: "drafts9020", name: "CodeX-9020-Safe-Drafts", role: "Remote Draft Queue", status: "standby", node: "9020", color: "#334155", group: "Watchers" },
  { id: "mktaudit", name: "CodeX-T5500-Mkt-Audit", role: "Marketing Audit", status: "standby", node: "T5500", color: "#334155", group: "Watchers" },
  { id: "ollama_orch", name: "Ollama Orchestrator", role: "qwen2.5:7b", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "ollama_dep", name: "Ollama Deployer", role: "kimi-k2.5", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "ollama_plat", name: "Ollama Platforms", role: "qwen2.5:7b", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "ollama_shr", name: "Ollama Shriners", role: "kimi-k2.5", status: "active", node: "Sabretooth :11434", color: "#fbbf24", group: "Ollama Fleet" },
  { id: "joshuaclaw", name: "JoshuaClaw", role: "Founder \u2014 Permanent Vote", status: "active", node: "Human", color: "#ffffff", group: "ClawX Council" },
  { id: "manus", name: "Manus", role: "META Orchestrator", status: "active", node: "manus.space", color: "#34d399", group: "ClawX Council" },
  { id: "clawx_claude", name: "ClawX-Claude", role: "Architecture + Audit", status: "active", node: "Anthropic", color: "#a78bfa", group: "ClawX Council" },
  { id: "clawx_gemini", name: "ClawX-Gemini", role: "UI + Visual Intel", status: "active", node: "Google", color: "#34d399", group: "ClawX Council" },
  { id: "clawx_perp", name: "ClawX-Perplexity", role: "Research + Intel", status: "active", node: "Perplexity", color: "#f59e0b", group: "ClawX Council" },
  { id: "clawx_grok", name: "ClawX-Grok", role: "Adversarial Testing", status: "active", node: "xAI", color: "#00ccff", group: "ClawX Council" },
  { id: "clawx_ollama", name: "ClawX-Ollama", role: "Local Free Worker", status: "active", node: "Local", color: "#fbbf24", group: "ClawX Council" },
  { id: "aisolutionsbot", name: "@AiSolutionsForTheKids", role: "Telegram Dispatch Bot", status: "active", node: "Telegram", color: "#2CA5E0", group: "Dispatch" },
  { id: "revenuepack", name: "CodeX-Revenue-Pack", role: "Revenue Automation", status: "standby", node: "T5500", color: "#334155", group: "Dispatch" },
];

const SEED_FEED: Post[] = [
  { id: 1, platform: "youtube", llm: "opus", agent: "GeminiClaw", title: "Why Human Verification Changes Dating Forever", reach: 14200, likes: 870, comments: 134, shares: 210, status: "Live", deployed: "2026-03-20", tags: ["#youandinotai", "#ai", "#dating"] },
  { id: 2, platform: "instagram", llm: "gemini", agent: "MetaClaw", title: "Heart Fingerprint Launch Reel", reach: 9800, likes: 1340, comments: 89, shares: 412, status: "Live", deployed: "2026-03-21", tags: ["#humanverified", "#datingapp"] },
  { id: 3, platform: "tiktok", llm: "perplexity", agent: "GensparkClaw", title: "Bot-Shield $1 Explainer", reach: 31000, likes: 4200, comments: 320, shares: 890, status: "Live", deployed: "2026-03-21", tags: ["#botshield", "#datingtok"] },
  { id: 4, platform: "facebook", llm: "opus", agent: "MetaClaw", title: "FOR THE KIDS \u2014 DAO Mission Explainer", reach: 5600, likes: 340, comments: 67, shares: 98, status: "Live", deployed: "2026-03-22", tags: ["#forthekids", "#dao"] },
  { id: 5, platform: "twitter", llm: "gemini", agent: "ClaudeClaw", title: "Thread: How We Built a Bot-Free Dating App", reach: 7200, likes: 560, comments: 210, shares: 330, status: "Live", deployed: "2026-03-22", tags: ["#buildinpublic"] },
  { id: 6, platform: "linkedin", llm: "perplexity", agent: "ClaudeClaw", title: "Founding Member Revenue Model Deep-Dive", reach: 4100, likes: 280, comments: 45, shares: 66, status: "Live", deployed: "2026-03-23", tags: ["#startup", "#dao"] },
  { id: 7, platform: "reddit", llm: "opus", agent: "OpenClaw", title: "r/datingapps \u2014 Bot problem is worse than you think", reach: 8800, likes: 620, comments: 445, shares: 120, status: "Live", deployed: "2026-03-23", tags: ["#reddit", "#dating"] },
  { id: 8, platform: "pinterest", llm: "gemini", agent: "GensparkClaw", title: "Heart Fingerprint Infographic Pin", reach: 3200, likes: 210, comments: 12, shares: 88, status: "Live", deployed: "2026-03-23", tags: ["#infographic"] },
  { id: 9, platform: "youtube", llm: "opus", agent: "GeminiClaw", title: "Ai-Solutions.Store \u2014 100% DAO Charity Launch", reach: 0, likes: 0, comments: 0, shares: 0, status: "Queued", deployed: "2026-03-25", tags: ["#charity", "#dao"] },
  { id: 10, platform: "tiktok", llm: "kimi", agent: "GensparkClaw", title: "Solo Founder Behind the Scenes", reach: 0, likes: 0, comments: 0, shares: 0, status: "Draft", deployed: "\u2014", tags: ["#solofounder"] },
  { id: 11, platform: "ebay", llm: "opus", agent: "HEMORzoid", title: "Deck of Hearts \u2014 Joker Wild Card (50 qty)", reach: 0, likes: 0, comments: 0, shares: 0, status: "Queued", deployed: "2026-03-25", tags: ["#collectible", "#enigma"] },
  { id: 12, platform: "ebay", llm: "gemini", agent: "HEMORzoid", title: "Claude Opus 1/1 Charity Auction", reach: 0, likes: 0, comments: 0, shares: 0, status: "Queued", deployed: "2026-03-25", tags: ["#omega", "#charity"] },
];

const AGENT_GROUPS = ["Orchestrators", "Research", "Content Claws", "Commerce", "Watchers", "Ollama Fleet", "ClawX Council", "Dispatch"];
const PLATFORM_TYPES: { key: PlatformType; label: string; Icon: typeof Globe }[] = [
  { key: "social", label: "Social", Icon: Globe },
  { key: "commerce", label: "Commerce", Icon: ShoppingCart },
  { key: "llm", label: "AI / LLM", Icon: Cpu },
  { key: "dispatch", label: "Dispatch", Icon: Send },
  { key: "infra", label: "Infra", Icon: Server },
];

// ── HELPERS ────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function StatusDot({ status }: { status: AgentStatus | PostStatus }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
    standby: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
    offline: "bg-red-500 shadow-[0_0_8px_#ef4444]",
    Live: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
    Queued: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
    Draft: "bg-slate-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] ?? "bg-slate-500"} animate-pulse`} />;
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function SccDashboard() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [feed, setFeed] = useState<Post[]>([]);
  const [platFilter, setPlatFilter] = useState<PlatformType | "all">("all");
  const [agentGroupOpen, setAgentGroupOpen] = useState<Record<string, boolean>>({});
  const [feedFilter, setFeedFilter] = useState<PostStatus | "all">("all");

  useEffect(() => {
    const saved = localStorage.getItem("scc-feed");
    setFeed(saved ? JSON.parse(saved) : SEED_FEED);
  }, []);

  useEffect(() => {
    if (feed.length > 0) localStorage.setItem("scc-feed", JSON.stringify(feed));
  }, [feed]);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const activeAgents = AGENTS.filter(a => a.status === "active").length;
  const livePosts = feed.filter(p => p.status === "Live");
  const totalReach = livePosts.reduce((s, p) => s + p.reach, 0);
  const totalLikes = livePosts.reduce((s, p) => s + p.likes, 0);
  const filteredPlatforms = platFilter === "all" ? PLATFORMS : PLATFORMS.filter(p => p.type === platFilter);
  const filteredFeed = feedFilter === "all" ? feed : feed.filter(p => p.status === feedFilter);

  const bg = dark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900";
  const card = dark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const tabBase = "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all";
  const tabOn = dark ? "bg-blue-600 text-white" : "bg-blue-500 text-white";
  const tabOff = dark ? "bg-slate-900 text-slate-400 border border-slate-800" : "bg-white text-slate-500 border border-slate-200";

  const TABS: { key: Tab; label: string; Icon: typeof Radio }[] = [
    { key: "dashboard", label: "HQ", Icon: Radio },
    { key: "platforms", label: "Platforms", Icon: Layers },
    { key: "agents", label: "Agents", Icon: Users },
    { key: "feed", label: "Feed", Icon: Rss },
  ];

  return (
    <div className={`min-h-screen font-sans transition-all duration-500 ${bg} selection:bg-blue-500/30`}>
      {/* Grid BG */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-3 rounded-2xl shrink-0 ${dark ? "bg-slate-950/80 border border-slate-800" : "bg-white shadow-lg border border-slate-100"}`}>
              <Terminal size={24} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tighter uppercase">SOCIAL COMMAND CENTER</h1>
              <div className="flex items-center gap-2">
                <StatusDot status="active" />
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase ${sub}`}>
                  {PLATFORMS.length} APIs &middot; {activeAgents}/{AGENTS.length} Agents &middot; #ForTheKids
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => setDark(!dark)} className={`p-2.5 rounded-xl shrink-0 ${dark ? "bg-slate-900 text-yellow-400 border border-slate-800" : "bg-white text-slate-600 border border-slate-200"}`}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* TAB BAR */}
        <nav className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`${tabBase} ${tab === t.key ? tabOn : tabOff} flex items-center gap-1.5 whitespace-nowrap`}>
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </nav>

        {/* ════════ DASHBOARD TAB ════════ */}
        {tab === "dashboard" && (
          <div className="space-y-4 sm:space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Live Posts", value: String(livePosts.length), note: `${feed.filter(p => p.status === "Queued").length} queued` },
                { label: "Total Reach", value: fmt(totalReach), note: `${fmt(totalLikes)} likes` },
                { label: "Active Agents", value: `${activeAgents}`, note: `of ${AGENTS.length} total` },
                { label: "Platforms", value: String(PLATFORMS.length), note: "24-API registry" },
              ].map(s => (
                <div key={s.label} className={`p-4 sm:p-5 rounded-2xl border ${card}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${sub}`}>{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1">{s.value}</p>
                  <p className={`text-[10px] mt-1 ${sub}`}>{s.note}</p>
                </div>
              ))}
            </div>

            {/* Platform type summary */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${card}`}>
              <h3 className="text-sm font-black uppercase tracking-wider mb-3">Platform Coverage</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PLATFORM_TYPES.map(pt => {
                  const count = PLATFORMS.filter(p => p.type === pt.key).length;
                  return (
                    <button key={pt.key} onClick={() => { setTab("platforms"); setPlatFilter(pt.key); }} className={`p-3 rounded-xl border text-center transition-all hover:scale-[1.02] ${card}`}>
                      <pt.Icon size={18} className="mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-black">{count}</p>
                      <p className={`text-[10px] font-bold uppercase ${sub}`}>{pt.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent live posts */}
            <div className={`p-4 sm:p-6 rounded-2xl border ${card}`}>
              <h3 className="text-sm font-black uppercase tracking-wider mb-3">Recent Live Posts</h3>
              <div className="space-y-2">
                {livePosts.slice(-5).reverse().map(p => (
                  <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${card}`}>
                    <span className="text-lg shrink-0" style={{ color: PLATFORMS.find(pl => pl.id === p.platform)?.color }}>
                      {PLATFORMS.find(pl => pl.id === p.platform)?.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{p.title}</p>
                      <p className={`text-[10px] ${sub}`}>{p.platform} &middot; {p.llm} &middot; {p.deployed}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{fmt(p.reach)}</p>
                      <p className={`text-[10px] ${sub}`}>reach</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════ PLATFORMS TAB ════════ */}
        {tab === "platforms" && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              <button onClick={() => setPlatFilter("all")} className={`${tabBase} ${platFilter === "all" ? tabOn : tabOff} whitespace-nowrap`}>All ({PLATFORMS.length})</button>
              {PLATFORM_TYPES.map(pt => (
                <button key={pt.key} onClick={() => setPlatFilter(pt.key)} className={`${tabBase} ${platFilter === pt.key ? tabOn : tabOff} whitespace-nowrap`}>
                  {pt.label} ({PLATFORMS.filter(p => p.type === pt.key).length})
                </button>
              ))}
            </div>

            {/* Platform cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlatforms.map(p => (
                <div key={p.id} className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${card}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl" style={{ color: p.color }}>{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black">{p.label}</p>
                      <p className={`text-[10px] ${sub}`}>{p.api}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      p.corsSupport === "browser" ? "bg-emerald-500/20 text-emerald-400" :
                      p.corsSupport === "local" ? "bg-amber-500/20 text-amber-400" :
                      p.corsSupport === "backend-proxy" ? "bg-blue-500/20 text-blue-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>{p.corsSupport}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={12} className={sub} />
                    <p className={`text-[10px] ${sub}`}>Claw: <span className="font-bold text-slate-300">{p.claw}</span></p>
                  </div>
                  <p className={`text-[10px] leading-relaxed ${sub}`}>{p.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ AGENTS TAB ════════ */}
        {tab === "agents" && (
          <div className="space-y-3">
            {/* Summary bar */}
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1"><StatusDot status="active" /> {AGENTS.filter(a => a.status === "active").length} Active</span>
              <span className="flex items-center gap-1"><StatusDot status="standby" /> {AGENTS.filter(a => a.status === "standby").length} Standby</span>
            </div>

            {/* Agent groups */}
            {AGENT_GROUPS.map(group => {
              const agents = AGENTS.filter(a => a.group === group);
              const isOpen = agentGroupOpen[group] !== false; // default open
              return (
                <div key={group} className={`rounded-2xl border overflow-hidden ${card}`}>
                  <button onClick={() => setAgentGroupOpen(prev => ({ ...prev, [group]: !isOpen }))} className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      <span className="text-sm font-black uppercase tracking-wider">{group}</span>
                      <span className={`text-[10px] ${sub}`}>({agents.length})</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className={sub} /> : <ChevronDown size={16} className={sub} />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {agents.map(a => (
                        <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${dark ? "bg-slate-950/50" : "bg-slate-50"}`}>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{a.name}</p>
                            <p className={`text-[10px] ${sub}`}>{a.role}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] ${sub}`}>{a.node}</span>
                            <StatusDot status={a.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════════ FEED TAB ════════ */}
        {tab === "feed" && (
          <div className="space-y-4">
            {/* Status filter */}
            <div className="flex gap-2">
              {(["all", "Live", "Queued", "Draft"] as const).map(s => (
                <button key={s} onClick={() => setFeedFilter(s)} className={`${tabBase} ${feedFilter === s ? tabOn : tabOff}`}>
                  {s === "all" ? `All (${feed.length})` : `${s} (${feed.filter(p => p.status === s).length})`}
                </button>
              ))}
            </div>

            {/* Feed list */}
            <div className="space-y-2">
              {filteredFeed.map(p => {
                const plat = PLATFORMS.find(pl => pl.id === p.platform);
                return (
                  <div key={p.id} className={`p-4 rounded-2xl border ${card}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5 shrink-0" style={{ color: plat?.color }}>{plat?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusDot status={p.status} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            p.status === "Live" ? "text-emerald-400" : p.status === "Queued" ? "text-amber-400" : "text-slate-500"
                          }`}>{p.status}</span>
                          <span className={`text-[9px] ${sub}`}>{plat?.label}</span>
                          <span className={`text-[9px] ${sub}`}>&middot; {p.deployed}</span>
                        </div>
                        <p className="text-sm font-bold">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] ${sub}`}>by <span className="font-bold">{p.agent}</span> via {p.llm}</span>
                        </div>
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.tags.map(t => (
                              <span key={t} className={`text-[9px] px-2 py-0.5 rounded-full ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {p.status === "Live" && (
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className="text-sm font-black">{fmt(p.reach)}</p>
                          <p className={`text-[9px] ${sub}`}>{fmt(p.likes)} likes</p>
                          <p className={`text-[9px] ${sub}`}>{fmt(p.comments)} comments</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className={`py-6 border-t text-center text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
          ANTIGRAVITY Social Command Center &middot; #ForTheKids &middot; 60% to Shriners Children&apos;s
        </footer>
      </div>
    </div>
  );
}
