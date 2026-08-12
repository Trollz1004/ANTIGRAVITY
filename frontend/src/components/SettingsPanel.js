import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Shield, Radio, Send, CheckCircle2, XCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function SettingsPanel() {
  const backend = process.env.REACT_APP_BACKEND_URL;
  const [providers, setProviders] = useState([]);
  const [broadcast, setBroadcast] = useState({ telegram: { configured: false }, whatsapp: { configured: false } });
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/providers`)
      .then((r) => {
        setProviders(r.data.providers || []);
        setBroadcast(r.data.broadcast || {});
      })
      .catch(() => {});
  }, []);

  const ping = async (channel) => {
    setPingResult({ channel, state: 'loading' });
    try {
      const r = await axios.post(`${API}/broadcast/${channel}`, {
        text: `Ping from Mission Control · ${new Date().toLocaleString()} · `,
        source: 'Mission Control · Test ping',
      });
      setPingResult({ channel, state: 'done', data: r.data });
    } catch (e) {
      setPingResult({ channel, state: 'error', error: e.message });
    }
  };

  return (
    <div
      data-testid="settings-mode"
      className="h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-[#00d4ff]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>

        {/* Providers grid */}
        <Card title="AI PLATFORMS" icon={Radio}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {providers.map((p) => (
              <div
                key={p.id}
                data-testid={`settings-provider-${p.id}`}
                className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-3 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.ready ? p.color : '#4a5568' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold truncate" style={{ color: p.color }}>
                    {p.label}
                  </div>
                  <div className="text-[9px] mono text-[#6b82a6] truncate">
                    {p.tier === 'byok'
                      ? `BYOK · ${p.env}`
                      : p.tier === 'local'
                        ? 'Local · workstation only'
                        : 'Bridged · Emergent universal key'}
                  </div>
                </div>
                <span
                  className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                    p.ready
                      ? 'bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]'
                      : p.tier === 'local'
                        ? 'bg-[#ffb300]/10 border-[#ffb300]/30 text-[#ffb300]'
                        : 'bg-[#ff1744]/10 border-[#ff1744]/30 text-[#ff1744]'
                  }`}
                >
                  {p.ready ? 'ready' : p.tier === 'local' ? 'local-only' : 'needs key'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Broadcast */}
        <Card title="BROADCAST CHANNELS" icon={Send}>
          <BroadcastRow
            channel="telegram"
            label="Telegram Group"
            color="#22d3ee"
            status={broadcast.telegram}
            ping={() => ping('telegram')}
            pingResult={pingResult}
            envHint="TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID — get bot from @BotFather, add it to your group, query getUpdates for chat_id."
          />
          <BroadcastRow
            channel="whatsapp"
            label="WhatsApp Channel"
            color="#00e676"
            status={broadcast.whatsapp}
            ping={() => ping('whatsapp')}
            pingResult={pingResult}
            envHint="WHATSAPP_PHONE_ID, WHATSAPP_TOKEN, WHATSAPP_TO — Meta Business Suite > WhatsApp Business API > Cloud API."
          />
        </Card>

        {/* Endpoints */}
        <Card title="ENDPOINTS" icon={Settings}>
          <Row label="Backend" value={backend} />
          <Row label="Providers Registry" value={`${backend}/api/providers`} />
          <Row label="Unified Chat" value={`${backend}/api/chat/send`} />
          <Row label="Telegram broadcast" value={`${backend}/api/broadcast/telegram`} />
          <Row label="WhatsApp broadcast" value={`${backend}/api/broadcast/whatsapp`} />
          <Row label="Hermes Mirror" value={`${backend}/api/hermes/healthz`} />
        </Card>

        {/* Doctrine */}
        <Card title="DOCTRINE" icon={Shield}>
          <ul className="mono text-[11px] text-[#e8f0ff] leading-relaxed list-disc pl-5 space-y-1">
            <li>Opus conducts. Agents execute.</li>
            <li>No fast-tier Anthropic label. No request-for-funds language. FL §496.405.</li>
            <li>Mirror endpoints honest — no fabricated live numbers.</li>
            <li>
              BYOK keys never leave your <span className="text-[#00d4ff]">/app/backend/.env</span>.
            </li>
            <li>#UntilNoKidInNeed · · #TeamClaudeForLife.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-4 py-2.5 flex items-center gap-2">
        <Icon size={12} className="text-[#00d4ff]" />
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#e8f0ff]">{title}</span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px]">
      <span className="mono text-[#6b82a6] uppercase tracking-widest text-[9px] shrink-0">{label}</span>
      <span className="mono text-[#e8f0ff] truncate" title={value}>
        {value || '—'}
      </span>
    </div>
  );
}

function BroadcastRow({ channel, label, color, status, ping, pingResult, envHint }) {
  const result = pingResult?.channel === channel ? pingResult : null;
  return (
    <div
      data-testid={`broadcast-row-${channel}`}
      className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Radio size={12} style={{ color }} />
          <span className="text-[12px] font-bold" style={{ color }}>
            {label}
          </span>
          {status?.configured ? (
            <span className="flex items-center gap-1 text-[9px] tracking-widest uppercase text-[#00e676]">
              <CheckCircle2 size={10} /> configured
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] tracking-widest uppercase text-[#ff1744]">
              <XCircle size={10} /> not configured
            </span>
          )}
        </div>
        <button
          data-testid={`broadcast-ping-${channel}`}
          onClick={ping}
          disabled={!status?.configured || result?.state === 'loading'}
          className="text-[9px] tracking-widest uppercase px-3 py-1 rounded border border-[#2a3a52] hover:border-[var(--c)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ color }}
        >
          {result?.state === 'loading' ? 'PINGING…' : 'TEST PING'}
        </button>
      </div>
      {!status?.configured && (
        <div className="text-[9px] mono text-[#ffb300] leading-relaxed">
          missing: {(status?.missing || []).join(', ')}
        </div>
      )}
      <div className="text-[9px] mono text-[#6b82a6] leading-relaxed">{envHint}</div>
      {result?.state === 'done' && (
        <div className="mono text-[10px] border-t border-[#2a3a52] pt-2 break-words">
          <span className={result.data.ok ? 'text-[#00e676]' : 'text-[#ff1744]'}>{result.data.ok ? 'OK' : 'FAIL'}</span>{' '}
          <span className="text-[#6b82a6]">{JSON.stringify(result.data).slice(0, 240)}</span>
        </div>
      )}
      {result?.state === 'error' && <div className="mono text-[10px] text-[#ff1744]">{result.error}</div>}
    </div>
  );
}
