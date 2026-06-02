import React, { useState } from "react";
import { AgeGate } from "./components/AgeGate";
import { SignInGate } from "./components/SignInGate";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { TaskCommander } from "./components/TaskCommander";
import { FloatingGuide } from "./components/FloatingGuide";
import { CommandPalette } from "./components/CommandPalette";
import { ChatProvider } from "./contexts/ChatContext";
import { ChatMode } from "./modes/ChatMode";
import { CodeMode } from "./modes/CodeMode";
import { CreateMode } from "./modes/CreateMode";
import { ResearchMode } from "./modes/ResearchMode";
import { MissionMode } from "./modes/MissionMode";
import { RoundtableMode } from "./modes/RoundtableMode";
import { TasksMode } from "./modes/TasksMode";
import { LedgerMode } from "./modes/LedgerMode";
import { GraphifyMode } from "./modes/GraphifyMode";
import { SabretoothMode } from "./modes/SabretoothMode";
import { StorefrontMode } from "./modes/StorefrontMode";
import { SecurityMode } from "./modes/SecurityMode";
import { MissionRibbon } from "./components/MissionRibbon";
import { SettingsPanel } from "./components/SettingsPanel";

export default function App() {
  const [gated, setGated] = useState(false);
  const [activeMode, setActiveMode] = useState("mission");

  // TaskCommander dispatches an "opuspawclaw-mode" event so the input can flip
  // the user into Tasks mode while it also fires "opuspawclaw-task" for prefill.
  React.useEffect(() => {
    const onMode = (e) => { if (e.detail?.mode) setActiveMode(e.detail.mode); };
    window.addEventListener("opuspawclaw-mode", onMode);
    window.addEventListener("opuspawclaw-mode-change", onMode);
    return () => {
      window.removeEventListener("opuspawclaw-mode", onMode);
      window.removeEventListener("opuspawclaw-mode-change", onMode);
    };
  }, []);

  if (!gated) return <AgeGate onVerified={() => setGated(true)} />;

  const renderMode = () => {
    switch (activeMode) {
      case "code":       return <CodeMode />;
      case "chat":       return <ChatMode />;
      case "create":     return <CreateMode />;
      case "research":   return <ResearchMode />;
      case "mission":    return <MissionMode />;
      case "roundtable": return <RoundtableMode />;
      case "tasks":      return <TasksMode />;
      case "ledger":     return <LedgerMode />;
      case "graphify":   return <GraphifyMode />;
      case "sabretooth": return <SabretoothMode />;
      case "storefront": return <StorefrontMode />;
      case "security": return <SecurityMode />;
      case "settings":   return <SettingsPanel />;
      default:           return <MissionMode />;
    }
  };

  return (
    <SignInGate>
    <ChatProvider>
      <div className="grain h-screen flex flex-col bg-[#0a0f1a] text-[#e8f0ff] font-sans overflow-hidden relative">
        <TitleBar />
        <div className="flex-1 flex overflow-hidden relative z-10">
          <Sidebar activeMode={activeMode} onModeChange={setActiveMode} />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <MissionRibbon />
            <TaskCommander />
            <div className="flex-1 overflow-hidden">{renderMode()}</div>

            <footer
              data-testid="mc-footer"
              className="h-6 bg-[#111827] border-t border-[#2a3a52] flex items-center justify-between px-4 select-none z-10 relative"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-all">
                  <div className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_5px_#00d4ff]" />
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#6b82a6]">Mission Control Online</span>
                </div>
                <div className="h-2 w-px bg-[#2a3a52]" />
                <span className="text-[8px] font-medium text-[#4a5568] uppercase tracking-widest">
                  Press <span className="text-[#00d4ff]">⌘K</span> · roundtable across every AI platform
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-bold text-[#e040fb] uppercase tracking-widest opacity-80">#UntilNoKidInNeed</span>
                <span className="text-[8px] font-bold text-[#00d4ff] uppercase tracking-widest px-2 py-0.5 bg-[#00d4ff]/10 rounded-full border border-[#00d4ff]/20">PAWCLAW-ELITE-V1</span>
              </div>
            </footer>
          </div>
        </div>
        <FloatingGuide />
        <CommandPalette onModeChange={setActiveMode} />
      </div>
    </ChatProvider>
    </SignInGate>
  );
}
