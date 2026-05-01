import React, { useState } from 'react';
import { ChevronDown, Check, Globe, Cpu } from 'lucide-react';

const PROVIDERS = [
  { id: 'claude', name: 'Claude 3.5 Sonnet', icon: Globe },
  { id: 'gemini-pro', name: 'Gemini 1.5 Pro', icon: Globe },
  { id: 'gemini-flash', name: 'Gemini 1.5 Flash', icon: Globe },
  { id: 'gpt4', name: 'GPT-4o', icon: Globe },
  { id: 'ollama', name: 'Local Ollama', icon: Cpu },
];

export function ProviderDropdown({ defaultProvider }: { defaultProvider: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultProvider);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#1a2332] border border-[#2a3a52] rounded-md text-[10px] font-bold uppercase tracking-wider text-[#e8f0ff] hover:border-[#00d4ff] transition-all min-w-[140px] justify-between"
      >
        <span className="truncate">{selected}</span>
        <ChevronDown size={12} className={`text-[#6b82a6] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-[#111827] border border-[#2a3a52] rounded-lg shadow-2xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${selected === p.name ? 'text-[#00d4ff] bg-[#1a2332]' : 'text-[#6b82a6] hover:text-[#e8f0ff] hover:bg-[#1a2332]'}`}
              >
                <p.icon size={12} />
                <span className="flex-1 text-left truncate">{p.name}</span>
                {selected === p.name && <Check size={12} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
