import React from 'react';
import { Code2, Image as ImageIcon, Search, MessageSquare, Settings, Plus, Rocket, Ticket, Compass } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { DAOMonitor } from './DAOMonitor';
import { SystemStatus } from './SystemStatus';

interface SidebarProps {
  activeMode?: string;
  onModeChange?: (mode: 'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars' | 'social' | 'mission') => void;
}

export function Sidebar({ activeMode = 'code', onModeChange }: SidebarProps) {
  const { conversations, activeConversationId, selectConversation, createNewConversation } = useChat();

  const getBtnClass = (mode: string) => 
    `p-2 rounded-lg transition-colors flex items-center gap-3 w-full text-left ${activeMode === mode ? 'bg-[#1a2332] text-[#00d4ff]' : 'text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]'}`;

  return (
    <div className="w-64 bg-[#111827] border-r border-[#2a3a52] flex flex-col py-4 overflow-hidden">
      <div className="px-4 mb-6 flex flex-col gap-2">
        <button onClick={() => onModeChange?.('mission')} className={getBtnClass('mission')}><Compass size={20} className="text-[#00d4ff]" /> <span className="text-sm font-medium">Mission Control</span></button>
        <button onClick={() => onModeChange?.('code')} className={getBtnClass('code')}><Code2 size={20} /> <span className="text-sm font-medium">Code Mode</span></button>
        <button onClick={() => onModeChange?.('create')} className={getBtnClass('create')}><ImageIcon size={20} /> <span className="text-sm font-medium">Create Mode</span></button>
        <button onClick={() => onModeChange?.('research')} className={getBtnClass('research')}><Search size={20} /> <span className="text-sm font-medium">Research Mode</span></button>
        <button onClick={() => onModeChange?.('chat')} className={getBtnClass('chat')}><MessageSquare size={20} /> <span className="text-sm font-medium">Chat Mode</span></button>
        <button onClick={() => onModeChange?.('mars')} className={getBtnClass('mars')}><Rocket size={20} className="text-[#ff3d00]" /> <span className="text-sm font-medium">Mars Liftoff</span></button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">History</span>
          <button 
            onClick={() => createNewConversation('New Chat', activeMode)}
            className="p-1 text-[#6b82a6] hover:text-[#00d4ff] transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                selectConversation(conv.id);
                onModeChange?.('chat');
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all truncate border ${
                activeConversationId === conv.id 
                  ? 'bg-[#1a2332] border-[#00d4ff]/30 text-[#00d4ff]' 
                  : 'border-transparent text-[#6b82a6] hover:bg-[#1a2332] hover:text-[#e8f0ff]'
              }`}
            >
              {conv.title}
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="px-3 py-4 text-[10px] text-[#4a5568] text-center italic">
              No recent chats
            </div>
          )}
        </div>

        <DAOMonitor />
      </div>

      <SystemStatus />

      <div className="px-4 mt-4 pt-4 border-t border-[#2a3a52] flex flex-col gap-2">
        <button onClick={() => console.log('Support Ticket Open')} className="p-2 rounded-lg transition-colors flex items-center justify-between w-full text-left text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]">
          <div className="flex items-center gap-3">
            <Ticket size={20} /> <span className="text-sm font-medium">Support Tickets</span>
          </div>
          <span className="w-4 h-4 rounded-full bg-[#ff3d00] text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </button>
        <button onClick={() => onModeChange?.('settings')} className={getBtnClass('settings')}>
          <Settings size={20} /> <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
