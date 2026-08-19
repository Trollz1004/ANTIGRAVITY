import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Shield, Radio } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function SettingsPanel() {
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    axios.get(`${API}/providers`).then((response) => setProviders(response.data.providers || [])).catch(() => {});
  }, []);

  return (
    <div data-testid="settings-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-[#00d4ff]" />
          <div><div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">workspace</div><h1 className="text-2xl font-bold tracking-tight">Settings</h1></div>
        </div>
        <Card title="AI PLATFORM STATUS" icon={Radio}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {providers.map((provider) => (
              <div key={provider.id} data-testid={`settings-provider-${provider.id}`} className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: provider.ready ? provider.color : '#4a5568' }} />
                <div className="flex-1 min-w-0"><div className="text-[12px] font-bold truncate" style={{ color: provider.color }}>{provider.label}</div><div className="text-[9px] mono text-[#6b82a6] truncate">Configuration remains private</div></div>
                <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${provider.ready ? 'bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]' : 'bg-[#ffb300]/10 border-[#ffb300]/30 text-[#ffb300]'}`}>{provider.ready ? 'available' : 'unavailable'}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="PUBLIC-SAFE POSTURE" icon={Shield}>
          <ul className="mono text-[11px] text-[#e8f0ff] leading-relaxed list-disc pl-5 space-y-1">
            <li>Provider credentials, internal endpoints, and account details remain server-side.</li>
            <li>Operational status uses verified states rather than invented availability.</li>
            <li>External messages and infrastructure changes require explicit authorization.</li>
            <li>Product-first operations · #TeamClaudeForLife.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md"><div className="bg-[#111827] border-b border-[#2a3a52] px-4 py-2.5 flex items-center gap-2"><Icon size={12} className="text-[#00d4ff]" /><span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#e8f0ff]">{title}</span></div><div className="p-4 space-y-3">{children}</div></div>;
}
