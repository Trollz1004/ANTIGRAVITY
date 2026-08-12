import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  Radio,
  MessageSquare,
  Send,
  AlertCircle,
  Loader2,
  Check,
  X as XIcon,
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * SecurityMode — "Boris & Dario" zero-trust posture readout.
 *
 * Surfaces the actual security posture of Mission Control in one panel:
 *  - admin gate config + IP allowlist + Cloudflare/HTTPS detection
 *  - channel bindings (Manus → Telegram, Hermes → WhatsApp, OpenClaw → Discord)
 *  - actionable recommendations
 *
 * Honest report: never claims a shield is up unless the env actually has the
 * creds wired. Boris&Dario stand down only when posture_score = 7/7.
 */
export function SecurityMode() {
  const [posture, setPosture] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/security/posture`);
      setPosture(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || 'load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div data-testid="security-mode" className="h-full overflow-y-auto bg-[#0a0f1a] text-[#e8f0ff]">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <header className="flex items-start gap-4 flex-wrap mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-[#e040fb]" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#e040fb] font-bold">
                Boris&Dario · Zero-trust ledger guard
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Mission Security Posture</h1>
            <p className="text-sm text-[#6b82a6] mt-1">
              {posture?.tagline || 'Zero-trust ledger guard · #UntilNoKidInNeed protection layer'}
            </p>
          </div>
          {posture && <GradeBadge grade={posture.grade} score={posture.posture_score} />}
        </header>

        {err && (
          <div className="mb-6 px-4 py-3 rounded-md border border-[#ff1744]/40 bg-[#ff1744]/10 text-[#ff5572] text-xs flex items-center gap-2">
            <AlertCircle size={14} /> {err}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-[#6b82a6] text-xs">
            <Loader2 size={14} className="animate-spin" /> probing posture…
          </div>
        ) : (
          posture && (
            <div className="space-y-6">
              <Section title="Caller fingerprint" Icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Cell label="your ip" value={posture.client.ip} mono />
                  <Cell
                    label="behind cloudflare"
                    value={posture.client.behind_cloudflare ? 'yes' : 'no'}
                    tone={posture.client.behind_cloudflare ? 'green' : 'amber'}
                  />
                  <Cell
                    label="https enforced"
                    value={posture.client.https_enforced ? 'yes' : 'no'}
                    tone={posture.client.https_enforced ? 'green' : 'red'}
                  />
                </div>
              </Section>

              <Section title="Admin sign-in gate" Icon={Lock}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Cell
                    label="password set"
                    value={posture.admin_gate.password_set ? 'yes' : 'no'}
                    tone={posture.admin_gate.password_set ? 'green' : 'red'}
                  />
                  <Cell
                    label="session secret"
                    value={posture.admin_gate.session_secret_set ? 'yes' : 'no'}
                    tone={posture.admin_gate.session_secret_set ? 'green' : 'red'}
                  />
                  <Cell label="ttl" value={`${posture.admin_gate.session_ttl_hours}h`} mono />
                </div>
              </Section>

              <Section title="IP allowlist · zero-trust gate" Icon={ShieldCheck}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <Cell
                    label="active"
                    value={posture.ip_allowlist.active ? 'yes' : 'no'}
                    tone={posture.ip_allowlist.active ? 'green' : 'amber'}
                  />
                  <Cell label="entries" value={posture.ip_allowlist.entries.length || '—'} mono />
                  <Cell
                    label="your ip allowed"
                    value={posture.ip_allowlist.current_ip_allowed ? 'yes' : 'blocked'}
                    tone={posture.ip_allowlist.current_ip_allowed ? 'green' : 'red'}
                  />
                </div>
                {posture.ip_allowlist.entries.length > 0 && (
                  <div className="text-[10px] mono text-[#6b82a6] bg-[#0a0f1a] border border-[#2a3a52] rounded p-2 max-h-24 overflow-y-auto">
                    {posture.ip_allowlist.entries.map((e) => (
                      <div key={e}>{e}</div>
                    ))}
                  </div>
                )}
                <p className="text-[9px] mt-2 text-[#4a5568] italic">{posture.ip_allowlist.configure_via}</p>
              </Section>

              <Section title="Channel bindings · who broadcasts where" Icon={Radio}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(posture.channel_bindings).map(([key, b]) => (
                    <ChannelCard key={key} binding={b} />
                  ))}
                </div>
              </Section>

              <Section title="Boris&Dario recommendations" Icon={ShieldAlert}>
                <ul className="space-y-2">
                  {posture.recommendations.map((r) => (
                    <li key={r} className="text-xs text-[#e8f0ff] flex items-start gap-2">
                      {r.startsWith('All seven') ? (
                        <Check size={14} className="text-[#00e676] shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 bg-[#ffb300] rounded-full mt-1.5 shrink-0" />
                      )}
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )
        )}

        <footer className="mt-12 pt-6 border-t border-[#2a3a52] text-[10px] text-[#4a5568] tracking-widest uppercase">
          Boris&Dario protect the kids fund · #UntilNoKidInNeed · no trust-me-bro
        </footer>
      </div>
    </div>
  );
}

function GradeBadge({ grade, score }) {
  const tone = grade === 'A' ? '#00e676' : grade === 'B' ? '#00d4ff' : grade === 'C' ? '#ffb300' : '#ff1744';
  return (
    <div
      data-testid="security-grade-badge"
      className="bg-[#111827] border-2 rounded-lg px-5 py-3 min-w-[140px] text-center"
      style={{ borderColor: tone, boxShadow: `0 0 24px ${tone}40` }}
    >
      <div className="text-[8px] tracking-[0.3em] uppercase text-[#6b82a6] mb-1">posture grade</div>
      <div className="text-4xl font-black mono" style={{ color: tone }}>
        {grade}
      </div>
      <div className="text-[10px] mono text-[#6b82a6] mt-1">{score}</div>
    </div>
  );
}

function Section({ title, Icon, children }) {
  return (
    <div className="bg-[#111827] border border-[#2a3a52] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={13} className="text-[#00d4ff]" />
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#00d4ff]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Cell({ label, value, tone, mono }) {
  const color = tone === 'green' ? '#00e676' : tone === 'red' ? '#ff5572' : tone === 'amber' ? '#ffb300' : '#e8f0ff';
  return (
    <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-3">
      <div className="text-[8px] tracking-[0.3em] uppercase text-[#4a5568]">{label}</div>
      <div className={`${mono ? 'mono' : ''} text-sm font-bold`} style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function ChannelCard({ binding }) {
  const Icon = binding.channel === 'Telegram' ? Send : binding.channel === 'WhatsApp' ? MessageSquare : Radio;
  const wired = binding.wired;
  return (
    <div
      data-testid={`channel-${binding.channel.toLowerCase()}`}
      className="bg-[#0a0f1a] border rounded p-3 flex flex-col gap-1.5"
      style={{ borderColor: wired ? '#00e67640' : '#2a3a5280' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={12} style={{ color: wired ? '#00e676' : '#6b82a6' }} />
          <span className="text-xs font-bold" style={{ color: wired ? '#00e676' : '#6b82a6' }}>
            {binding.agent}
          </span>
        </div>
        {wired ? <Check size={12} className="text-[#00e676]" /> : <XIcon size={12} className="text-[#ff5572]" />}
      </div>
      <div className="text-[9px] tracking-widest uppercase text-[#6b82a6]">{binding.role}</div>
      <div className="text-[10px] mono text-[#e8f0ff]">→ {binding.channel}</div>
      <div className="text-[8px] mono text-[#4a5568]">
        {binding.destination_env}: {binding.destination_set ? 'set' : 'missing'}
      </div>
    </div>
  );
}
