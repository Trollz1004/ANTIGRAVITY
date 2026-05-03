import React from "react";
import { Compass, Code2, Image as ImageIcon, Search, MessageSquare, Settings, Plus, Rocket, Radio, ListTodo, BookOpen } from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { DAOMonitor } from "./DAOMonitor";
import { SystemStatus } from "./SystemStatus";

const MODES = [
  { id: "mission",    label: "Mission Control", Icon: Compass,       tone: "magenta" },
  { id: "ledger",     label: "Mission Ledger",  Icon: BookOpen,      tone: "magenta" },
  { id: "roundtable", label: "AI Roundtable",   Icon: Radio,         tone: "magenta" },
  { id: "tasks",      label: "Tasks",           Icon: ListTodo,      tone: "magenta" },
  { id: "code",       label: "Code Mode",       Icon: Code2,         tone: "cyan" },
  { id: "create",     label: "Create · Banana", Icon: ImageIcon,     tone: "cyan" },
  { id: "research",   label: "Research Mode",   Icon: Search,        tone: "cyan" },
  { id: "chat",       label: "Chat Mode",       Icon: MessageSquare, tone: "cyan" },
];

export function Sidebar({ activeMode = "mission", onModeChange }) {
  const { conversations, activeConversationId, selectConversation, createNewConversation } = useChat();

  const btnClass = (mode, tone) => {
    const active = activeMode === mode;
    const activeColor = tone === "magenta" ? "text-[#e040fb] bg-[#1a2332]" : "text-[#00d4ff] bg-[#1a2332]";
    return `p-2 rounded-lg transition-colors flex items-center gap-3 w-full text-left ${active ? activeColor : "text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]"}`;
  };

  return (
    <aside
      data-testid="sidebar"
      className="w-64 bg-[#111827] border-r border-[#2a3a52] flex flex-col py-4 overflow-hidden shrink-0"
    >
      <div className="px-4 mb-4 flex flex-col gap-1.5">
        {MODES.map(({ id, label, Icon, tone }) => (
          <button
            key={id}
            data-testid={`sidebar-${id}-btn`}
            onClick={() => onModeChange?.(id)}
            className={btnClass(id, tone)}
          >
            <Icon size={18} className={id === "mission" || id === "roundtable" || id === "tasks" || id === "ledger" ? "text-[#e040fb]" : ""} />
            <span className="text-sm font-medium">{label}</span>
            {(id === "mission" || id === "roundtable" || id === "tasks" || id === "ledger") && (
              <span className="ml-auto text-[8px] font-bold text-[#e040fb] uppercase tracking-widest opacity-80">
                NEW
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">History</span>
          <button
            data-testid="sidebar-new-chat"
            onClick={() => { createNewConversation("New Chat", activeMode); onModeChange?.("chat"); }}
            className="p-1 text-[#6b82a6] hover:text-[#00d4ff] transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              data-testid={`sidebar-conv-${conv.id}`}
              onClick={() => { selectConversation(conv.id); onModeChange?.("chat"); }}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all truncate border ${
                activeConversationId === conv.id
                  ? "bg-[#1a2332] border-[#00d4ff]/30 text-[#00d4ff]"
                  : "border-transparent text-[#6b82a6] hover:bg-[#1a2332] hover:text-[#e8f0ff]"
              }`}
            >
              {conv.title}
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="px-3 py-4 text-[10px] text-[#4a5568] text-center italic">No recent chats</div>
          )}
        </div>

        <DAOMonitor />
      </div>

      <SystemStatus />

      <div className="px-4 mt-4 pt-4 border-t border-[#2a3a52] flex flex-col gap-2">
        <button
          data-testid="sidebar-settings-btn"
          onClick={() => onModeChange?.("settings")}
          className={btnClass("settings", "cyan")}
        >
          <Settings size={18} /> <span className="text-sm font-medium">Settings</span>
        </button>
        <div className="flex items-center gap-2 px-2 text-[9px] uppercase tracking-widest text-[#4a5568]">
          <Rocket size={10} className="text-[#e040fb]" />
          <span>for the kids · #UntilNoKidInNeed</span>
        </div>
      </div>
    </aside>
  );
}
