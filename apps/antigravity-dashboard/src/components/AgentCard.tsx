import type { Agent } from "@/types";
import { Icon } from "@/lib/icons";
import clsx from "@/lib/clsx";

const KIND_GLYPH: Record<string, { Glyph: React.ComponentType<{ size?: number }>; tint: string }> = {
  nous:      { Glyph: Icon.Brain,     tint: "from-[#FF6B35] to-[#2a1235]" },
  gemini:    { Glyph: Icon.Sparkles,  tint: "from-[#58A8E0] to-[#1a3658]" },
  hermes:    { Glyph: Icon.Workflow,  tint: "from-[#B3A2BF] to-[#3a2a45]" },
  codex:     { Glyph: Icon.Terminal,  tint: "from-[#10B981] to-[#0d3a25]" },
  gemma:     { Glyph: Icon.Cpu,       tint: "from-[#8A7D75] to-[#2a2420]" },
  grok:    { Glyph: Icon.Brain,     tint: "from-[#E36A76] to-[#3a1a22]" },
  cupid:     { Glyph: Icon.Heart,     tint: "from-[#EF4444] to-[#3a1418]" },
  perplexity:{ Glyph: Icon.Search,    tint: "from-[#3B82F6] to-[#102a55]" },
};

const HB_CLASS: Record<string, string> = {
  live: "",
  busy: "heartbeat--busy",
  idle: "heartbeat--idle",
  offline: "heartbeat--offline",
};

export function AgentCard({ agent }: { agent: Agent }) {
  const meta = KIND_GLYPH[agent.kind] ?? KIND_GLYPH.gemma;
  const Glyph = meta.Glyph;
  return (
    <article
      className="agent-card"
      data-testid={`agent-${agent.id}`}
      data-status={agent.status}
    >
      {/* tier badge */}
      <span className="tier-badge" data-testid={`tier-${agent.id}`}>
        {agent.tier} · {agent.role}
      </span>

      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "w-9 h-9 rounded-md bg-gradient-to-br grid place-items-center border border-ag-elevated shrink-0",
            meta.tint,
          )}
        >
          <Glyph size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-data text-sm font-bold text-ink truncate">{agent.name}</h3>
            <span className={clsx("heartbeat", HB_CLASS[agent.status])} />
          </div>
          <div className="text-[10px] font-label uppercase tracking-wider text-ink-dim mt-0.5 truncate">
            {agent.vendor}
          </div>
        </div>
      </div>

      <p className="text-xs font-data text-ink-muted line-clamp-2 min-h-[2.5rem]">
        {agent.body}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {agent.tags.map((tag) => (
          <span
            key={tag}
            className={clsx(
              "text-[9px] font-label uppercase tracking-wider px-1.5 py-0.5 rounded-sharp border",
              tag === "LIVE" || tag === "live" || tag === "9020" || tag === "OPENCLAW"
                ? "border-signal-success/40 text-signal-success bg-signal-success/10"
                : tag === "IDLE" || tag === "idle"
                ? "border-signal-warning/40 text-signal-warning bg-signal-warning/10"
                : tag === "BUSY" || tag === "RUN"
                ? "border-brand/40 text-brand bg-brand/10"
                : "border-ink-dim/30 text-ink-muted",
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between text-[10px] font-label uppercase tracking-wider text-ink-dim">
          <span>Task load</span>
          <span className="font-data tabular-nums text-ink-muted">
            {agent.taskLoad}/25
          </span>
        </div>
        <div className="task-bar" aria-hidden>
          <div
            className="task-bar-fill"
            style={{ width: `${Math.min(100, (agent.taskLoad / 25) * 100)}%` }}
          />
        </div>
      </div>

      <div className="text-[10px] font-label uppercase tracking-wider text-ink-dim flex items-center gap-1.5">
        <Icon.Activity size={10} className="text-brand" />
        <span className="truncate">{agent.state}</span>
      </div>
    </article>
  );
}
