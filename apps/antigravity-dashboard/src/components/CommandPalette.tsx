import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Icon } from "@/lib/icons";
import clsx from "@/lib/clsx";

const PROVIDERS = [
  { id: "nous", label: "GPT-5.5 Pro", provider: "Nous Portal" },
  { id: "gemini", label: "Gemini 2.5 Pro", provider: "Google" },
  { id: "gpt", label: "GPT-5 Codex", provider: "OpenAI" },
  { id: "grok", label: "Grok 4.3", provider: "xAI" },
  { id: "perplexity", label: "Sonar Pro", provider: "Perplexity" },
  { id: "ollama", label: "Ollama · gemma4:32b", provider: "Local" },
];

const PAGES: Array<{ id: string; label: string; group: string }> = [
  { id: "dashboard",   label: "Mission Control",   group: "Pages" },
  { id: "fleet",       label: "Agent Fleet",       group: "Pages" },
  { id: "revenue",     label: "Revenue Engine",    group: "Pages" },
  { id: "tokens",      label: "Tokenomics",        group: "Pages" },
  { id: "comms",       label: "Comms Gateway",     group: "Pages" },
  { id: "paperweight", label: "Paperweight",       group: "Pages" },
  { id: "hermes",      label: "Hermes Node",       group: "Pages" },
  { id: "settings",    label: "Settings",          group: "Pages" },
];

const COMMANDS: Array<{ id: string; label: string; group: string; run: () => void }> = [
  { id: "engage-hermes", label: "Engage Hermes (9020)",  group: "Actions", run: () => useStore.getState().toggleHermes() },
  { id: "open-tokens",   label: "Open Tokenomics",       group: "Actions", run: () => useStore.getState().setPage("tokens") },
  { id: "open-revenue",  label: "Open Revenue Engine",   group: "Actions", run: () => useStore.getState().setPage("revenue") },
  { id: "new-mission",   label: "Create new mission",    group: "Actions", run: () => useStore.getState().pushToast({ title: "Mission created", body: "PAPA-242 drafted in Paperweight.", tone: "success" }) },
];

export function CommandPalette() {
  const open = useStore((s) => s.cmdOpen);
  const setOpen = useStore((s) => s.setCmdOpen);
  const setPage = useStore((s) => s.setPage);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // reset on open
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  if (!open) return null;

  const allItems = [
    ...PAGES.map((p) => ({ ...p, run: () => setPage(p.id as never) })),
    ...COMMANDS,
    ...PROVIDERS.map((p) => ({
      id: `provider-${p.id}`,
      label: p.label,
      group: `Providers · ${p.provider}`,
      run: () =>
        useStore.getState().pushToast({
          title: `Switched to ${p.label}`,
          body: `Provider pinned: ${p.provider}`,
          tone: "info",
        }),
    })),
  ];

  const filtered = q.trim()
    ? allItems.filter((it) => it.label.toLowerCase().includes(q.toLowerCase()))
    : allItems;

  const grouped: Record<string, typeof filtered> = {};
  for (const it of filtered) {
    grouped[it.group] = grouped[it.group] || [];
    grouped[it.group].push(it);
  }

  const flat = filtered;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = flat[active];
      if (sel) {
        sel.run();
        setOpen(false);
      }
    }
  };

  return (
    <div
      className="cmd-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
      data-testid="cmd-palette"
    >
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4">
          <Icon.Search size={16} className="text-ink-dim" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, agents, tokens, actions…"
            className="cmd-input"
            data-testid="cmd-input"
          />
          <span className="key-hint">ESC</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {Object.keys(grouped).length === 0 && (
            <div className="text-ink-dim text-sm font-data p-6 text-center">
              No results for &ldquo;{q}&rdquo;
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-2">
              <div className="px-3 py-1.5 label-cap">{group}</div>
              <div className="flex flex-col">
                {items.map((it) => {
                  const flatIdx = flat.indexOf(it);
                  const isActive = flatIdx === active;
                  return (
                    <button
                      key={it.id}
                      onMouseEnter={() => setActive(flatIdx)}
                      onClick={() => {
                        it.run();
                        setOpen(false);
                      }}
                      data-testid={`cmd-item-${it.id}`}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-sm text-left text-sm font-data",
                        isActive ? "bg-ag-elevated text-ink" : "text-ink-muted hover:bg-ag-elevated/50",
                      )}
                    >
                      <Icon.ChevronsRight size={12} className="text-ink-dim" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {isActive && <span className="key-hint">↵</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-ag-elevated px-3 py-2 flex items-center justify-between text-[10px] font-label tracking-wider uppercase text-ink-dim">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="key-hint">↑↓</span> navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="key-hint">↵</span> run
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="heartbeat" /> 9020 · connected
          </div>
        </div>
      </div>
    </div>
  );
}
