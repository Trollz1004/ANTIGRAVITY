import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Icon } from "@/lib/icons";
import clsx from "@/lib/clsx";

const PROVIDERS = [
  { id: "claude",  label: "Claude Opus 4.5",     provider: "Anthropic" },
  { id: "gemini",  label: "Gemini 2.5 Pro",      provider: "Google" },
  { id: "gpt",     label: "GPT-5 Codex",         provider: "OpenAI" },
  { id: "grok",    label: "Grok 3",              provider: "xAI" },
  { id: "pplx",    label: "Sonar Pro",           provider: "Perplexity" },
  { id: "ollama",  label: "Ollama · gemma4:32b", provider: "Local" },
];

export function Header() {
  const toggleCmd = useStore((s) => s.toggleCmd);
  const hermesOn = useStore((s) => s.hermesOn);
  const toggleHermes = useStore((s) => s.toggleHermes);
  const pushToast = useStore((s) => s.pushToast);
  const agents = useStore((s) => s.agents);
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ESC closes selector
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const liveCount = agents.filter((a) => a.status === "live" || a.status === "busy").length;

  const stamp = now.toISOString().slice(0, 19).replace("T", " ") + "Z";

  return (
    <header
      data-testid="header"
      className="relative z-10 h-14 px-5 flex items-center gap-4 border-b border-ag-elevated bg-ag-base/70 backdrop-blur"
    >
      {/* Search / Cmd+K */}
      <button
        onClick={toggleCmd}
        data-testid="cmd-trigger"
        className="flex items-center gap-2 px-3 py-1.5 bg-ag-surface border border-ag-elevated rounded-md text-sm text-ink-dim hover:border-brand/40 focus-ring min-w-[280px] transition-colors"
      >
        <Icon.Search size={14} />
        <span className="font-data text-xs flex-1 text-left">Search the command center…</span>
        <span className="key-hint">⌘K</span>
      </button>

      {/* Model selector */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          data-testid="model-selector"
          className="flex items-center gap-2 px-3 py-1.5 bg-ag-surface border border-ag-elevated text-ink font-label text-xs uppercase tracking-wider rounded-md hover:border-brand/50 focus-ring transition-colors"
        >
          <Icon.Cpu size={12} className="text-brand" />
          <span>{provider.label}</span>
          <span className="text-ink-dim normal-case tracking-normal">· {provider.provider}</span>
          <Icon.ChevronsRight size={10} className={clsx("transition-transform", open && "rotate-90")} />
        </button>
        {open && (
          <div
            className="absolute top-full mt-2 left-0 w-72 panel-elevated rounded-md shadow-2xl z-30 overflow-hidden"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="px-3 py-2 label-cap border-b border-ag-elevated">Switch model</div>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProvider(p);
                  setOpen(false);
                  pushToast({
                    title: `Routed to ${p.label}`,
                    body: `X-Hermes-Provider: ${p.provider} · X-Hermes-Real-Model: ${p.label}`,
                    tone: "info",
                  });
                }}
                data-testid={`model-${p.id}`}
                className={clsx(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-ag-elevated/60 transition-colors",
                  provider.id === p.id && "bg-ag-elevated/40",
                )}
              >
                <div>
                  <div className="font-data text-sm">{p.label}</div>
                  <div className="font-label text-[10px] text-ink-dim uppercase tracking-wider">
                    {p.provider}
                  </div>
                </div>
                {provider.id === p.id && <Icon.CheckCircle2 size={14} className="text-brand" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Hermes toggle */}
      <button
        onClick={toggleHermes}
        data-testid="hermes-toggle"
        data-on={hermesOn}
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-label uppercase tracking-wider transition-colors",
          hermesOn
            ? "bg-brand/10 border-brand/40 text-brand"
            : "bg-ag-surface border-ag-elevated text-ink-dim",
        )}
        title="Engage / disengage Hermes routing (9020)"
      >
        <span className={clsx("heartbeat", !hermesOn && "heartbeat--offline")} />
        <span>Hermes · 9020</span>
        <span className="text-ink-dim normal-case tracking-normal">
          {hermesOn ? "engaged" : "isolated"}
        </span>
      </button>

      {/* Live agent count */}
      <div className="hidden md:flex items-center gap-2 text-xs font-data text-ink-dim">
        <span className="heartbeat heartbeat--busy" />
        <span><span className="text-ink font-bold">{liveCount}</span> / {agents.length} agents</span>
      </div>

      {/* Timestamp */}
      <div className="hidden md:flex items-center gap-2 text-[11px] font-data text-ink-dim tabular-nums">
        <Icon.Activity size={12} />
        <span>{stamp}</span>
      </div>

      {/* Notification bell */}
      <button
        onClick={() =>
          pushToast({
            title: "3 new agent events",
            body: "Codex completed 15/16 tests · Hermes routed 12 hops · Cupid published 4 creatives.",
            tone: "info",
          })
        }
        data-testid="notif-bell"
        className="relative p-2 rounded-md hover:bg-ag-elevated/60 focus-ring"
        title="Notifications"
      >
        <Icon.Bell size={16} className="text-ink-muted" />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand" />
      </button>
    </header>
  );
}
