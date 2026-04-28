import React, { useState } from 'react';
import { AgentPane } from './AgentPane';
import { Plus, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DualPane() {
  const [agents, setAgents] = useState([
    { id: 'alpha', title: 'Alpha', provider: 'Claude 3.5 Sonnet' },
    { id: 'beta', title: 'Beta', provider: 'Gemini 1.5 Pro' }
  ]);

  const addAgent = () => {
    if (agents.length >= 4) return; // Limit to 4 for sane UI
    const id = Math.random().toString(36).substring(7);
    const titles = ['Gamma', 'Delta', 'Sigma', 'Omega'];
    const title = titles[agents.length % titles.length] || `Agent ${agents.length + 1}`;
    setAgents([...agents, { id, title, provider: 'Gemini 1.5 Flash' }]);
  };

  const removeAgent = (id: string) => {
    if (agents.length <= 1) return;
    setAgents(agents.filter(a => a.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Top Elite Branding Header within the Pane */}
      <div className="absolute top-0 right-14 z-10 p-2">
        <button 
          onClick={addAgent}
          className="flex items-center gap-2 px-3 py-1 bg-[#1a2332]/50 hover:bg-[#00d4ff]/20 border border-[#2a3a52] rounded-full text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest transition-all backdrop-blur-sm shadow-xl"
        >
          <Plus size={12} /> Add Agent Pane
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {agents.map((agent, index) => (
            <React.Fragment key={agent.id}>
              {index > 0 && (
                <div className="w-px bg-[#2a3a52] relative">
                  <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize hover:bg-[#00d4ff]/20 transition-colors z-20" />
                </div>
              )}
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="flex-1 flex flex-col min-w-[300px]"
              >
                <AgentPane 
                  title={agent.title} 
                  defaultProvider={agent.provider} 
                  onRemove={() => removeAgent(agent.id)}
                  canRemove={agents.length > 1}
                />
              </motion.div>
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
