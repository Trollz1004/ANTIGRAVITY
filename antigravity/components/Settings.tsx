// components/Settings.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Lock, Save, ShieldCheck } from 'lucide-react';

export default function Settings({ isDarkMode }: { isDarkMode: boolean }) {
  const [dbUrl, setDbUrl] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: dbUrl, stripeSecret }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Settings updated successfully!');
        setDbUrl('');
        setStripeSecret('');
      } else {
        setStatus('Failed to update settings.');
      }
    } catch (err) {
      console.error(err);
      setStatus('An error occurred.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase italic">SYSTEM CONFIGURATION</h2>
        <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Secure Workspace Variables</p>
      </div>

      <div className={`max-w-2xl mx-auto p-8 rounded-[3rem] border backdrop-blur-xl relative overflow-hidden ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest mb-3">
              <Database size={14} className="text-blue-500" />
              DATABASE_URL (PostgreSQL)
            </label>
            <input 
              type="password"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="postgresql://user:password@localhost:5432/antigravity"
              className={`w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest mb-3">
              <Lock size={14} className="text-purple-500" />
              STRIPE_WEBHOOK_SECRET
            </label>
            <input 
              type="password"
              value={stripeSecret}
              onChange={(e) => setStripeSecret(e.target.value)}
              placeholder="whsec_..."
              className={`w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Configuration
          </button>

          {status && (
            <p className={`text-center text-xs font-bold uppercase tracking-widest mt-4 ${status.includes('successfully') ? 'text-emerald-500' : 'text-amber-500'}`}>
              {status}
            </p>
          )}
        </div>
      </div>

      <div className={`max-w-2xl mx-auto p-6 rounded-3xl border border-dashed flex items-start gap-4 ${isDarkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-200 bg-slate-50'}`}>
        <ShieldCheck size={24} className="text-emerald-500 flex-shrink-0 mt-1" />
        <div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Security Notice</p>
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
            Variables are saved directly to the server-side .env file. They are never exposed to the client-side browser unless explicitly prefixed with NEXT_PUBLIC_. Ensure your node server is behind a secure proxy.
          </p>
        </div>
      </div>
    </div>
  );
}
