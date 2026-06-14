import { create } from "zustand";
import {
  AGENTS,
  MISSIONS,
  REVENUE_BUCKETS,
  SEED_LOG,
  TOKENS,
} from "./data";
import type {
  Agent,
  AgentStatus,
  FeedRow,
  Mission,
  PageId,
  RevenueBucket,
  Token,
} from "./types";

interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: "success" | "warning" | "danger" | "info";
  ts: number;
}

interface State {
  page: PageId;
  setPage: (p: PageId) => void;

  agents: Agent[];
  setAgentStatus: (id: string, status: AgentStatus) => void;

  tokens: Token[];
  buckets: RevenueBucket[];
  missions: Mission[];
  log: FeedRow[];

  // Mission ticker (revenue-monitored counter)
  revenueMonitored: number;
  bumpRevenueMonitored: (n: number) => void;

  // Command palette
  cmdOpen: boolean;
  setCmdOpen: (b: boolean) => void;
  toggleCmd: () => void;

  // Toasts
  toasts: Toast[];
  pushToast: (t: Omit<Toast, "id" | "ts">) => void;
  dismissToast: (id: number) => void;

  // Hermes routing toggle
  hermesOn: boolean;
  toggleHermes: () => void;

  // Sidebar collapse
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Live activity synthesis
  synthTick: () => void;
  pushLog: (row: FeedRow) => void;
}

let _toastId = 1;
let _logId = 1;

const SYNTH_AGENTS: Array<{
  who: FeedRow["who"];
  msgs: string[];
}> = [
  {
    who: "hermes",
    msgs: [
      "GET /ollama/healthz · 200 · 12ms",
      "Routed prompt → grok-nous-4-5 (cloud)",
      "BRIDGE telegram://chat/joshua → 1 inbound",
      "POST /api/paperweight · 200 OK",
      "Dispatched task PAPA-241 → codex",
    ],
  },
  {
    who: "hermes",
    msgs: [
      "Reviewed sticky · PAPA-238 · approved for dispatch",
      "Memory: working → semantic promotion · 3 entries",
      "Delegated → Codex: implement retry backoff",
      "Snapshot persisted → ~/memory/episodic.json",
    ],
  },
  {
    who: "gemini",
    msgs: [
      "Indexed conversation buffer · 1.2k tokens",
      "Generated 4 ad headline variants",
      "Cross-referenced Q3 OKR · 2 gaps closed",
    ],
  },
  {
    who: "codex",
    msgs: [
      "pnpm test --filter paperclip-runtime · 15/16 pass",
      "Linted 23 files · 0 errors",
      "Built hermes-bridge · 412kb",
    ],
  },
  {
    who: "gemma",
    msgs: [
      "Local inference · gemma4 · GPU queue ready",
      "Standby — awaiting moderation overflow",
    ],
  },
  {
    who: "system",
    msgs: [
      "Self-Improving Agent loop · iteration +1",
      "Memory: episodic rotation · 14 days purged",
      "Cron: daily-briefing scheduled · 09:00 UTC",
    ],
  },
];

function pickSynth(): FeedRow {
  const a = SYNTH_AGENTS[Math.floor(Math.random() * SYNTH_AGENTS.length)];
  const msg = a.msgs[Math.floor(Math.random() * a.msgs.length)];
  return {
    t: stamp(),
    who: a.who,
    msg,
  };
}

function stamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export const useStore = create<State>((set, get) => ({
  page: "dashboard",
  setPage: (p) => set({ page: p }),

  agents: AGENTS,
  setAgentStatus: (id, status) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, status, busy: status !== "idle" && status !== "offline" } : a,
      ),
    })),

  tokens: TOKENS,
  buckets: REVENUE_BUCKETS,
  missions: MISSIONS,
  log: SEED_LOG,

  revenueMonitored: 10_482,
  bumpRevenueMonitored: (n) => set((s) => ({ revenueMonitored: s.revenueMonitored + n })),

  cmdOpen: false,
  setCmdOpen: (b) => set({ cmdOpen: b }),
  toggleCmd: () => set((s) => ({ cmdOpen: !s.cmdOpen })),

  toasts: [],
  pushToast: (t) => {
    const id = _toastId++;
    const toast: Toast = { id, ts: Date.now(), ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    // auto-dismiss in 4s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4500);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  hermesOn: true,
  toggleHermes: () => {
    const next = !get().hermesOn;
    set({ hermesOn: next });
    get().pushToast({
      title: next ? "Hermes routing engaged" : "Hermes routing disengaged",
      body: next
        ? "OpenClaw · 9020 forwarding restored."
        : "Local fleet isolated. Cloud-only mode active.",
      tone: next ? "success" : "warning",
    });
  },

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  synthTick: () => {
    const row = pickSynth();
    set((s) => ({ log: [{ ...row, t: stamp() }, ...s.log].slice(0, 30) }));
    // Randomly bump revenue-monitored
    if (Math.random() < 0.4) {
      set((s) => ({ revenueMonitored: s.revenueMonitored + (Math.random() < 0.85 ? 1 : 2) }));
    }
  },

  pushLog: (row) => {
    set((s) => ({ log: [{ ...row, t: stamp() }, ...s.log].slice(0, 30) }));
    _logId++;
  },
}));

// Allow other modules to know the stamp fn (used by ChatPane etc.)
export { stamp };
