import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Send, Bot, User, Zap, Radio, Bell, BellOff, Plus, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * RoundtableMode — every AI platform Joshua named, all on one screen.
 * Pick 1+ platforms · type once · responses fan in side-by-side.
 * Optional Telegram + WhatsApp broadcast on the response you choose.
 */
export function RoundtableMode() {
  const [providers, setProviders] = useState([]);
  const [broadcastStatus, setBroadcastStatus] = useState({ telegram: { configured: false }, whatsapp: { configured: false } });
  const [active, setActive] = useState({}); // { providerId: model }
  const [prompt, setPrompt] = useState("Mission Control roundtable — every model say one short line on building tools that fund kids' medical care.");
  const [responses, setResponses] = useState({}); // { providerId: { state, reply, real_model, latency_ms, error } }
  const [broadcastOn, setBroadcastOn] = useState({ telegram: false, whatsapp: false });
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    axios.get(`${API}/providers`).then((r) => {
      setProviders(r.data.providers || []);
      setBroadcastStatus(r.data.broadcast || {});
      // pre-select E1 + the 4 main platforms so Joshua sees the build agent at the table
      const init = {};
      ["e1", "claude", "openai", "gemini", "hermes"].forEach((id) => {
        const p = (r.data.providers || []).find((x) => x.id === id);
        if (p && p.ready) init[id] = p.models[0];
      });
      setActive(init);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if ("Notification" in window) setNotify(Notification.permission === "granted");
  }, []);

  const askNotify = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotify(p === "granted");
  };

  const toggleProvider = (p) => {
    setActive((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = p.models[0];
      return next;
    });
  };

  const setModel = (pid, m) => setActive((prev) => ({ ...prev, [pid]: m }));

  const send = async () => {
    if (!prompt.trim() || Object.keys(active).length === 0) return;
    const broadcastList = [];
    if (broadcastOn.telegram && broadcastStatus.telegram?.configured) broadcastList.push("telegram");
    if (broadcastOn.whatsapp && broadcastStatus.whatsapp?.configured) broadcastList.push("whatsapp");

    // Mark all selected as in-flight
    setResponses(Object.fromEntries(Object.keys(active).map((id) => [id, { state: "loading" }])));

    await Promise.all(Object.entries(active).map(async ([providerId, model]) => {
      try {
        const res = await fetch(`${API}/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: providerId, model,
            messages: [{ role: "user", content: prompt }],
            broadcast: broadcastList,
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          setResponses((prev) => ({ ...prev, [providerId]: { state: "error", error: body.detail || `HTTP ${res.status}` } }));
          return;
        }
        const reply = body?.choices?.[0]?.message?.content || "";
        setResponses((prev) => ({
          ...prev,
          [providerId]: {
            state: "done",
            reply,
            real_model: res.headers.get("x-hermes-real-model") || body.real_model,
            provider_label: body.platform_label,
            latency_ms: Number(res.headers.get("x-hermes-latency-ms") || body.latency_ms || 0),
            broadcast: body.broadcast || {},
          },
        }));
        if (notify && document.hidden) {
          new Notification(`${body.platform_label} replied`, { body: reply.slice(0, 120), icon: "/favicon.ico" });
        }
      } catch (e) {
        setResponses((prev) => ({ ...prev, [providerId]: { state: "error", error: e.message } }));
      }
    }));
  };

  // Group platforms by tier for the picker
  const byTier = useMemo(() => {
    const g = { emergent: [], byok: [], local: [] };
    providers.forEach((p) => g[p.tier]?.push(p));
    return g;
  }, [providers]);

  return (
    <div data-testid="roundtable-mode" className="h-full flex flex-col bg-[#0a0f1a] text-[#e8f0ff] overflow-hidden">
      <div className="px-6 py-3 border-b border-[#2a3a52] bg-[#111827]/60 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-[#e040fb]" />
          <span className="text-xs font-bold tracking-wide">AI ROUNDTABLE</span>
          <span className="text-[8px] tracking-widest uppercase text-[#6b82a6]">
            {Object.keys(active).length} active · {providers.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BroadcastChip
            label="Telegram"
            on={broadcastOn.telegram}
            configured={broadcastStatus.telegram?.configured}
            onToggle={() => setBroadcastOn((b) => ({ ...b, telegram: !b.telegram }))}
            color="#22d3ee"
            testid="bc-telegram"
          />
          <BroadcastChip
            label="WhatsApp"
            on={broadcastOn.whatsapp}
            configured={broadcastStatus.whatsapp?.configured}
            onToggle={() => setBroadcastOn((b) => ({ ...b, whatsapp: !b.whatsapp }))}
            color="#00e676"
            testid="bc-whatsapp"
          />
          <button
            data-testid="notify-toggle"
            onClick={askNotify}
            className={`flex items-center gap-1 text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border transition-all ${
              notify ? "bg-[#00e676]/10 border-[#00e676]/40 text-[#00e676]" : "bg-[#1a2332] border-[#2a3a52] text-[#6b82a6] hover:border-[#00d4ff]"
            }`}
            title={notify ? "Notifications on" : "Click to enable browser notifications"}
          >
            {notify ? <Bell size={10}/> : <BellOff size={10}/>} notify
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 flex-1 overflow-hidden">
        {/* LEFT — platform picker */}
        <aside className="col-span-3 border-r border-[#2a3a52] overflow-y-auto custom-scrollbar bg-[#0a0f1a] p-3 space-y-4">
          {[
            { tier: "emergent", label: "Bridged · Emergent Universal", note: "Live · no setup" },
            { tier: "byok", label: "BYOK · Direct API", note: "Set key in /app/backend/.env" },
            { tier: "local", label: "Local · Workstation", note: "localhost — Joshua's node only" },
          ].map((g) => (
            <div key={g.tier}>
              <div className="text-[8px] tracking-[0.25em] uppercase text-[#4a5568] mb-2">{g.label}</div>
              <div className="text-[8px] text-[#6b82a6] mb-2 italic">{g.note}</div>
              <div className="space-y-1.5">
                {byTier[g.tier]?.map((p) => {
                  const on = !!active[p.id];
                  return (
                    <div
                      key={p.id}
                      data-testid={`provider-${p.id}`}
                      className={`rounded-md border transition-all ${
                        on ? "border-[var(--c)] bg-[var(--c)]/10" : "border-[#2a3a52] bg-[#1a2332] hover:border-[#00d4ff]/40"
                      }`}
                      style={{ "--c": p.color }}
                    >
                      <button
                        onClick={() => toggleProvider(p)}
                        disabled={!p.ready && p.tier !== "local"}
                        className="w-full flex items-center justify-between p-2 disabled:opacity-50"
                        data-testid={`provider-toggle-${p.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.ready ? p.color : "#4a5568" }} />
                          <div className="text-left min-w-0">
                            <div className="text-[11px] font-bold truncate" style={{ color: p.color }}>{p.label}</div>
                            <div className="text-[9px] text-[#6b82a6] truncate">{p.description}</div>
                          </div>
                        </div>
                        {on ? <X size={12} className="text-[#ff1744] shrink-0" /> : <Plus size={12} className="text-[#6b82a6] shrink-0" />}
                      </button>
                      {on && (
                        <select
                          data-testid={`provider-model-${p.id}`}
                          value={active[p.id]}
                          onChange={(e) => setModel(p.id, e.target.value)}
                          className="mono text-[10px] w-full bg-[#0a0f1a] border-t border-[#2a3a52] px-2 py-1.5 text-[#e8f0ff] outline-none"
                        >
                          {p.models.map((m) => <option key={m} value={m} className="bg-[#0a0f1a]">{m}</option>)}
                        </select>
                      )}
                      {!p.ready && p.tier === "byok" && (
                        <div className="text-[8px] mono text-[#ffb300] px-2 py-1 border-t border-[#2a3a52]">
                          set <span className="text-[#e8f0ff]">{p.env}</span>
                        </div>
                      )}
                      {p.tier === "local" && (
                        <div className="text-[8px] mono text-[#6b82a6] px-2 py-1 border-t border-[#2a3a52]">
                          workstation only
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* RIGHT — conversation grid */}
        <main className="col-span-9 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-min gap-3">
            {Object.entries(active).length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-center py-16 gap-3">
                <Radio size={32} className="text-[#4a5568]" />
                <div className="text-xs tracking-widest uppercase text-[#6b82a6]">Pick one or more platforms on the left</div>
              </div>
            )}
            {Object.entries(active).map(([pid, model]) => {
              const p = providers.find((x) => x.id === pid);
              const r = responses[pid];
              return (
                <div
                  key={pid}
                  data-testid={`response-${pid}`}
                  className="bg-[#1a2332] border rounded-md flex flex-col overflow-hidden min-h-[120px]"
                  style={{ borderColor: `${p?.color || "#2a3a52"}60` }}
                >
                  <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p?.color || "#6b82a6" }} />
                      <span className="text-[11px] font-bold truncate" style={{ color: p?.color }}>{p?.label || pid}</span>
                      <span className="mono text-[9px] text-[#6b82a6] truncate">{model}</span>
                    </div>
                    {r?.latency_ms > 0 && (
                      <span className="mono text-[9px] text-[#ffb300] flex items-center gap-0.5 shrink-0"><Zap size={8}/>{r.latency_ms}ms</span>
                    )}
                  </div>
                  <div className="p-3 text-[12px] leading-relaxed flex-1">
                    {!r && <div className="text-[#4a5568] italic text-[10px]">awaiting prompt…</div>}
                    {r?.state === "loading" && (
                      <div className="flex gap-1 items-center text-[#6b82a6]">
                        <span className="w-1.5 h-1.5 bg-[var(--c,#00d4ff)] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[var(--c,#00d4ff)] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-1.5 h-1.5 bg-[var(--c,#00d4ff)] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    )}
                    {r?.state === "done" && (
                      <>
                        <div className="whitespace-pre-wrap">{r.reply}</div>
                        {r.real_model && (
                          <div className="mt-2 pt-2 border-t border-[#2a3a52] mono text-[8px] text-[#6b82a6] truncate">
                            real · {r.real_model}
                          </div>
                        )}
                        {(r.broadcast?.telegram || r.broadcast?.whatsapp) && (
                          <div className="mt-1 flex gap-2 text-[8px] tracking-widest uppercase">
                            {r.broadcast.telegram && (
                              <span className={r.broadcast.telegram.ok ? "text-[#22d3ee]" : "text-[#ff1744]"}>
                                tg · {r.broadcast.telegram.ok ? "sent" : "fail"}
                              </span>
                            )}
                            {r.broadcast.whatsapp && (
                              <span className={r.broadcast.whatsapp.ok ? "text-[#00e676]" : "text-[#ff1744]"}>
                                wa · {r.broadcast.whatsapp.ok ? "sent" : "fail"}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {r?.state === "error" && (
                      <div className="text-[#ff1744] text-[11px] mono break-words">{r.error}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-[#2a3a52] bg-[#111827]/50 p-4"
          >
            <div className="max-w-5xl mx-auto relative">
              <textarea
                data-testid="roundtable-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="Ask every selected platform at once…  (⌘/Ctrl + Enter to send)"
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send(); }}
                className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-3 pr-14 text-sm focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder:text-[#4a5568] resize-none"
              />
              <button
                data-testid="roundtable-send"
                type="submit"
                disabled={!prompt.trim() || Object.keys(active).length === 0}
                className="absolute right-2 top-2 bottom-2 w-12 bg-[#1a2332] hover:bg-[#2a3a52] disabled:opacity-50 text-[#00d4ff] rounded-lg flex items-center justify-center transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2 text-center text-[9px] tracking-widest uppercase text-[#4a5568]">
              fan-out across {Object.keys(active).length} platform{Object.keys(active).length === 1 ? "" : "s"} · Business-only product operations
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function BroadcastChip({ label, on, configured, onToggle, color, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onToggle}
      disabled={!configured}
      title={configured ? `Broadcast to ${label}` : `${label} not configured — see Settings`}
      className={`flex items-center gap-1 text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        on ? "border-[var(--c)] bg-[var(--c)]/15 text-[var(--c)]" : "bg-[#1a2332] border-[#2a3a52] text-[#6b82a6] hover:border-[var(--c)]"
      }`}
      style={{ "--c": color }}
    >
      <Radio size={10} /> {label}
    </button>
  );
}
