import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Activity, Send, Zap } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Virtual-model pill list — mirrors hermes-router config at localhost:11435.
const PILLS = ["hermes", "hermes-deep", "cfo", "code", "marketing", "kimi", "fast"];

/**
 * HermesRouterPanel — mirrors the spec from MISSION-CONTROL-GUI-PROMPT:
 *  - Polls /api/hermes/healthz every 5s (paused when document.hidden).
 *  - 4-second AbortController timeout on every fetch.
 *  - Header status dot (green=ok, red=down, gold=timeout) + "HERMES ROUTER".
 *  - Provider rows for real targets (Nous / Ollama-Cloud / Ollama-Local / OpenRouter).
 *  - Pill row: hermes, hermes-deep, cfo, code, marketing, kimi, fast.
 *  - Click a pill → inline tester: textarea + TEST. POSTs to
 *    /api/hermes/v1/chat/completions (mirror). Renders reply + X-Hermes-Provider
 *    + X-Hermes-Real-Model from response headers.
 */
export function HermesRouterPanel() {
  const [health, setHealth] = useState({ status: "loading", data: null });
  const [active, setActive] = useState(null);
  const [prompt, setPrompt] = useState("Hello from Mission Control — acknowledge in one short line.");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  const fetchHealth = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const r = await fetch(`${API}/hermes/healthz`, { signal: ctrl.signal });
      const data = await r.json();
      setHealth({ status: r.ok ? "ok" : "down", data });
    } catch (e) {
      setHealth({ status: e.name === "AbortError" ? "timeout" : "down", data: null });
    } finally {
      clearTimeout(timer);
    }
  };

  useEffect(() => {
    fetchHealth();
    const iv = setInterval(() => { if (!document.hidden) fetchHealth(); }, 5000);
    return () => { clearInterval(iv); abortRef.current?.abort(); };
  }, []);

  const test = async () => {
    if (!active || !prompt.trim()) return;
    setBusy(true);
    setResult(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // Chat completions can be slow — widen to 60s for bridge latency.
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(`${API}/hermes/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: active,
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
        signal: ctrl.signal,
      });
      const body = await res.json();
      setResult({
        ok: res.ok,
        provider: res.headers.get("x-hermes-provider") || body.provider,
        realModel: res.headers.get("x-hermes-real-model") || body.real_model,
        latencyMs: Number(res.headers.get("x-hermes-latency-ms") || body.latency_ms || 0),
        text: body?.choices?.[0]?.message?.content || body?.detail || "(empty)",
      });
    } catch (e) {
      setResult({ ok: false, text: e.name === "AbortError" ? "TIMEOUT — retry" : `ERROR: ${e.message}` });
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  };

  const dot =
    health.status === "ok"      ? "bg-[#00e676] shadow-[0_0_6px_#00e676]" :
    health.status === "timeout" ? "bg-[#ffb300] shadow-[0_0_6px_#ffb300]" :
    health.status === "loading" ? "bg-[#6b82a6]" :
                                  "bg-[#ff1744] shadow-[0_0_6px_#ff1744] animate-pulse";

  const providers = health.data?.providers || [];

  return (
    <div data-testid="hermes-panel" className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-xs font-bold tracking-wide">HERMES ROUTER</span>
          <span className="text-[8px] tracking-widest uppercase bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-full px-2 py-0.5 text-[#00d4ff]">
            :11435 mirror
          </span>
        </div>
        <button
          data-testid="hermes-refresh"
          onClick={fetchHealth}
          className="text-[8px] tracking-widest uppercase text-[#6b82a6] hover:text-[#00d4ff]"
        >
          refresh
        </button>
      </div>

      <div className="p-3 space-y-3">
        {providers.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {providers.map((p) => (
              <div key={p} className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-2 py-1.5">
                <div className="mono text-[9px] text-[#e8f0ff] truncate">{p}</div>
                <div className="text-[7px] tracking-widest uppercase text-[#6b82a6]">enabled</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-[#4a5568] italic">endpoint unreachable — retry</div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {PILLS.map((p) => (
            <button
              key={p}
              data-testid={`hermes-pill-${p}`}
              onClick={() => setActive(active === p ? null : p)}
              className={`mono text-[10px] px-2 py-1 rounded-full border transition-all ${
                active === p
                  ? "bg-[#00d4ff] text-[#0a0f1a] border-[#00d4ff] font-bold"
                  : "bg-[#0a0f1a] text-[#e8f0ff] border-[#2a3a52] hover:border-[#00d4ff]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {active && (
          <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Activity size={10} className="text-[#e040fb]" />
              <span className="text-[9px] tracking-widest uppercase text-[#6b82a6]">
                virtual model · {active}
              </span>
            </div>
            <textarea
              data-testid="hermes-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="w-full bg-[#111827] border border-[#2a3a52] rounded p-2 text-xs text-[#e8f0ff] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none mono"
              placeholder="Prompt…"
            />
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#6b82a6]">bridge → emergent llm key</span>
              <button
                data-testid="hermes-test"
                onClick={test}
                disabled={busy || !prompt.trim()}
                className="flex items-center gap-1.5 bg-[#00d4ff] text-[#0a0f1a] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded disabled:opacity-30 hover:bg-[#33ddff] transition-all"
              >
                <Send size={10} /> {busy ? "TESTING…" : "TEST"}
              </button>
            </div>

            {result && (
              <div className="mt-2 border-t border-[#2a3a52] pt-2 space-y-1" data-testid="hermes-result">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${
                    result.ok ? "bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]" : "bg-[#ff1744]/10 border-[#ff1744]/30 text-[#ff1744]"
                  }`}>
                    {result.ok ? "OK" : "FAIL"}
                  </span>
                  {result.provider && (
                    <span className="mono text-[9px] text-[#6b82a6]">X-Hermes-Provider: {result.provider}</span>
                  )}
                  {result.realModel && (
                    <span className="mono text-[9px] text-[#6b82a6]">Real: {result.realModel}</span>
                  )}
                  {result.latencyMs > 0 && (
                    <span className="mono text-[9px] text-[#ffb300] flex items-center gap-0.5"><Zap size={8}/> {result.latencyMs}ms</span>
                  )}
                </div>
                <pre className="mono text-[11px] text-[#e8f0ff] whitespace-pre-wrap bg-[#111827] border border-[#2a3a52] rounded p-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {result.text}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
