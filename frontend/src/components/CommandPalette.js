import React, { useEffect, useMemo, useState } from "react";
import { Search, Compass, Code2, MessageSquare, Image as ImageIcon, Settings, Radio, Send, Bell, Heart, ListTodo } from "lucide-react";

/**
 * CommandPalette — ⌘K / Ctrl+K. Fast nav across modes + actions.
 */
const ENTRIES = [
  { id: "go-mission",    label: "Go to Mission Control", hint: "Opus orchestrator surface", group: "Modes",   Icon: Compass,       action: { type: "mode", to: "mission" } },
  { id: "go-roundtable", label: "Go to AI Roundtable",   hint: "Multi-platform fan-out",    group: "Modes",   Icon: Radio,         action: { type: "mode", to: "roundtable" } },
  { id: "go-tasks",      label: "Go to Tasks",           hint: "Paperclip replacement · kanban", group: "Modes", Icon: ListTodo,    action: { type: "mode", to: "tasks" } },
  { id: "go-chat",       label: "Go to Chat Mode",       hint: "Hermes Router single-thread", group: "Modes", Icon: MessageSquare, action: { type: "mode", to: "chat" } },
  { id: "go-code",       label: "Go to Code Mode",       hint: "Workstation pointer",        group: "Modes",  Icon: Code2,         action: { type: "mode", to: "code" } },
  { id: "go-create",     label: "Go to Create Mode",     hint: "Image gen (planned)",        group: "Modes",  Icon: ImageIcon,     action: { type: "mode", to: "create" } },
  { id: "go-research",   label: "Go to Research Mode",   hint: "Perplexity / Comet",         group: "Modes",  Icon: Search,        action: { type: "mode", to: "research" } },
  { id: "go-settings",   label: "Go to Settings",        hint: "Endpoints + doctrine",       group: "Modes",  Icon: Settings,      action: { type: "mode", to: "settings" } },
  { id: "act-dispatch",  label: "Dispatch new task",     hint: "Fan task across agents",     group: "Actions", Icon: Send,         action: { type: "dispatch" } },
  { id: "act-notify",    label: "Enable browser notifications", hint: "Reply alerts", group: "Actions", Icon: Bell, action: { type: "notify" } },
  { id: "mission",       label: "#UntilNoKidInNeed",     hint: "for the kids · #TeamClaudeForLife", group: "Mission", Icon: Heart, action: { type: "noop" } },
];

export function CommandPalette({ onModeChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ(""); setIdx(0);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ENTRIES;
    return ENTRIES.filter((e) =>
      e.label.toLowerCase().includes(s) ||
      e.hint?.toLowerCase().includes(s) ||
      e.group?.toLowerCase().includes(s),
    );
  }, [q]);

  useEffect(() => { if (idx >= filtered.length) setIdx(0); }, [filtered, idx]);

  const trigger = (entry) => {
    if (entry.action.type === "mode") onModeChange?.(entry.action.to);
    if (entry.action.type === "notify" && "Notification" in window) Notification.requestPermission();
    if (entry.action.type === "dispatch") {
      onModeChange?.("tasks");
      // Slight delay so TasksMode mounts and binds the listener before we fire.
      setTimeout(() => window.dispatchEvent(new CustomEvent("opuspawclaw-task", { detail: { task: "" } })), 50);
    }
    setOpen(false);
  };

  if (!open) return null;

  // group filtered for rendering
  const groups = filtered.reduce((acc, e) => {
    (acc[e.group] = acc[e.group] || []).push(e);
    return acc;
  }, {});

  return (
    <div
      data-testid="command-palette"
      className="fixed inset-0 bg-[#0a0f1a]/85 backdrop-blur-sm z-50 flex items-start justify-center pt-32 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#1a2332] border border-[#2a3a52] rounded-md shadow-[0_0_60px_rgba(0,212,255,0.2)] overflow-hidden focus-within:border-[#00d4ff]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-3 border-b border-[#2a3a52] flex items-center gap-2">
          <Search size={14} className="text-[#00d4ff] shrink-0" />
          <input
            data-testid="palette-input"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter" && filtered[idx]) { e.preventDefault(); trigger(filtered[idx]); }
            }}
            placeholder="Type to navigate · ⌘K to toggle · ↵ to run"
            className="w-full bg-transparent outline-none text-sm text-[#e8f0ff] placeholder:text-[#4a5568] mono"
          />
          <span className="mono text-[9px] tracking-widest uppercase text-[#6b82a6] border border-[#2a3a52] rounded px-1.5 py-0.5">esc</span>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-2">
              <div className="text-[8px] tracking-[0.3em] uppercase text-[#4a5568] px-2 py-1.5">{group}</div>
              {items.map((e) => {
                const flat = filtered.indexOf(e);
                const on = flat === idx;
                return (
                  <button
                    key={e.id}
                    data-testid={`palette-entry-${e.id}`}
                    onMouseEnter={() => setIdx(flat)}
                    onClick={() => trigger(e)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      on ? "bg-[#00d4ff]/10 text-[#e8f0ff]" : "text-[#6b82a6] hover:bg-[#1a2332]"
                    }`}
                  >
                    <e.Icon size={14} className={on ? "text-[#00d4ff]" : "text-[#6b82a6]"} />
                    <span className="flex-1 truncate text-sm">{e.label}</span>
                    <span className="text-[9px] mono text-[#4a5568] truncate max-w-[40%]">{e.hint}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-[#4a5568] py-8 text-xs italic">no matches</div>
          )}
        </div>

        <div className="px-3 py-1.5 border-t border-[#2a3a52] flex items-center justify-between text-[9px] mono tracking-widest uppercase text-[#4a5568]">
          <span>↑↓ navigate · ↵ run</span>
          <span className="text-[#e040fb]">#UntilNoKidInNeed</span>
        </div>
      </div>
    </div>
  );
}
