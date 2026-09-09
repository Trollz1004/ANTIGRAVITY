import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function SystemStatus() {
  const [services, setServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await axios.get(`${API}/system/status`, { timeout: 4000 });
      setServices(r.data.services || []);
    } catch {
      setServices([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(() => {
      if (!document.hidden) load();
    }, 15_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div data-testid="system-status" className="bg-[#111827] border-t border-[#2a3a52] p-4 mt-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#00d4ff]" />
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Stack Integrity</span>
        </div>
        <button
          data-testid="system-status-refresh"
          onClick={load}
          className="text-[#4a5568] hover:text-[#00d4ff] transition-colors"
        >
          <RefreshCw size={10} className={refreshing ? 'animate-spin' : 'animate-spin-slow'} />
        </button>
      </div>

      <div className="space-y-3">
        {services.length === 0 && <div className="text-[10px] text-[#4a5568] italic">endpoint unreachable — retry</div>}
        {services.map((s) => (
          <div key={s.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  s.status === 'green'
                    ? 'bg-[#00e676] shadow-[0_0_5px_#00e676]'
                    : 'bg-[#ff1744] shadow-[0_0_5px_#ff1744] animate-pulse'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#e8f0ff] tracking-tight">{s.name}</span>
                <span className="mono text-[8px] text-[#6b82a6] font-medium uppercase">{s.info}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
