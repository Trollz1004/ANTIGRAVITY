import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Github, Cloud, Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceStatus {
  name: string;
  id: string;
  status: 'green' | 'red';
  info: string;
}

export function SystemStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { id: 'opencode', name: 'OPENCODE', status: 'green', info: 'Ollama Active' },
    { id: 'hermes', name: 'Hermes Agent', status: 'green', info: 'Neural Linked' },
    { id: 'copilot', name: 'GH Copilot', status: 'green', info: 'Sync Active' },
    { id: 'gcr', name: 'GCR', status: 'green', info: 'Registry Ready' },
    { id: 'cloud', name: 'Aollama Cloud', status: 'red', info: 'Auth Required' },
  ]);

  const resolveIssue = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'green', info: 'Resolved' } : s));
  };

  return (
    <div className="bg-[#111827] border-t border-[#2a3a52] p-4 mt-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#00d4ff]" />
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Stack Integrity</span>
        </div>
        <RefreshCw size={10} className="text-[#4a5568] animate-spin-slow cursor-pointer hover:text-[#00d4ff]" />
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${service.status === 'green' ? 'bg-[#00e676] shadow-[0_0_5px_#00e676]' : 'bg-[#ff1744] shadow-[0_0_5px_#ff1744] animate-pulse'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#e8f0ff] tracking-tight">{service.name}</span>
                <span className="text-[8px] text-[#6b82a6] font-medium uppercase font-mono">{service.info}</span>
              </div>
            </div>
            {service.status === 'red' && (
              <button 
                onClick={() => resolveIssue(service.id)}
                className="px-2 py-0.5 rounded bg-[#ff1744]/10 border border-[#ff1744]/30 text-[#ff1744] text-[8px] font-bold uppercase hover:bg-[#ff1744]/20 transition-all active:scale-95"
              >
                Resolve
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
