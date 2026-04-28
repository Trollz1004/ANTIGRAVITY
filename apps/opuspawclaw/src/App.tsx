/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AgeGate } from './components/AgeGate';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { TaskCommander } from './components/TaskCommander';
import { DualPane } from './components/DualPane';
import CodeMode from './modes/CodeMode';
import { ChatMode } from './modes/ChatMode';
import { CreateMode } from './modes/CreateMode';
import { ResearchMode } from './modes/ResearchMode';
import { SettingsPanel } from './components/SettingsPanel';
import { ChatProvider } from './contexts/ChatContext';
import { FloatingGuide } from './components/FloatingGuide';
import { MarsLaunch } from './components/MarsLaunch';
import { SocialCommandCenter } from './components/SocialCommandCenter';
import MissionMode from './modes/MissionMode';

export default function App() {
  const [is18Plus, setIs18Plus] = useState(false);
  const [activeMode, setActiveMode] = useState<'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars' | 'social' | 'mission'>('code');

  if (!is18Plus) {
    return <AgeGate onVerified={() => setIs18Plus(true)} />;
  }

  const renderMode = () => {
    switch (activeMode) {
      case 'code': return <CodeMode />;
      case 'chat': return <ChatMode />;
      case 'create': return <CreateMode />;
      case 'research': return <ResearchMode />;
      case 'settings': return <SettingsPanel />;
      case 'mars': return <MarsLaunch />;
      case 'social': return <SocialCommandCenter />;
      case 'mission': return <MissionMode />;
      default: return <DualPane />;
    }
  };

  return (
    <ChatProvider>
      <div className="h-screen flex flex-col bg-[#0a0f1a] text-[#e8f0ff] font-sans overflow-hidden">
        <TitleBar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeMode={activeMode} onModeChange={setActiveMode} />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <TaskCommander />
            <div className="flex-1 overflow-hidden">
              {renderMode()}
            </div>
            
            {/* Elite Branding Footer */}
            <footer className="h-6 bg-[#111827] border-t border-[#2a3a52] flex items-center justify-between px-4 select-none z-10 relative">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                  <div className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_5px_#00d4ff]" />
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#6b82a6]">Built with AI Studio Elite</span>
                </div>
                <div className="h-2 w-px bg-[#2a3a52]" />
                <span className="text-[8px] font-medium text-[#4a5568] uppercase tracking-widest cursor-default">
                   This Flagship model was built By AI Studio With Opus 4.6 & Claude Code™
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-bold text-[#e040fb] uppercase tracking-widest mr-1 opacity-80">#UntilNoKidInNeed</span>
                <span className="text-[8px] font-bold text-[#00d4ff] uppercase tracking-widest px-2 py-0.5 bg-[#00d4ff]/10 rounded-full border border-[#00d4ff]/20">
                  PAWCLAW-ELITE-V1
                </span>
              </div>
            </footer>
          </div>
        </div>
        <FloatingGuide />
      </div>
    </ChatProvider>
  );
}
