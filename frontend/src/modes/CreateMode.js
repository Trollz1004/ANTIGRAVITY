import React, { useEffect, useState } from "react";
import axios from "axios";
import { Image as ImageIcon, Sparkles, Download, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PRESETS = [
  "An orange origami rocket gently lifting a small kid above a cyan grid; warm cream sky; minimal, hopeful, mission-control vibes",
  "A tiny constellation labeled '#UntilNoKidInNeed' over a soft midnight skyline; magenta highlights; quiet, optimistic",
  "An OpusPawClaw mission patch: paw + claw + crescent moon; cyan/magenta/gold on dark navy; embroidered look",
];

export function CreateMode() {
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);

  const loadRecent = () => axios.get(`${API}/images?limit=12`).then((r) => setRecent(r.data.images || [])).catch(() => {});
  useEffect(() => { loadRecent(); }, []);

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await axios.post(`${API}/images/generate`, { prompt }, { timeout: 90_000 });
      setResult(r.data); loadRecent();
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally { setBusy(false); }
  };

  const download = (uri, id) => {
    const a = document.createElement("a");
    a.href = uri; a.download = `opuspawclaw-${id}.png`; a.click();
  };

  return (
    <div data-testid="create-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ImageIcon size={22} className="text-[#fb923c]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Create · Nano Banana</h1>
          </div>
          <span className="ml-auto text-[8px] tracking-widest uppercase bg-[#fb923c]/10 border border-[#fb923c]/30 rounded-full px-2 py-0.5 text-[#fb923c]">
            ai-solutions.store · bucket 5
          </span>
        </div>

        <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-4 space-y-3">
          <textarea
            data-testid="create-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded p-3 text-sm text-[#e8f0ff] focus:border-[#fb923c] focus:ring-1 focus:ring-[#fb923c]/20 outline-none resize-none mono"
            placeholder="Describe the image…"
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={p}
                data-testid={`create-preset-${i}`}
                onClick={() => setPrompt(p)}
                className="text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-[#0a0f1a] border border-[#2a3a52] text-[#6b82a6] hover:border-[#fb923c] hover:text-[#fb923c] transition-all"
              >
                preset {i + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] mono text-[#6b82a6]">model · gemini-3.1-flash-image-preview</span>
            <button
              data-testid="create-generate"
              onClick={generate}
              disabled={busy || !prompt.trim()}
              className="flex items-center gap-1.5 bg-[#fb923c] text-[#0a0f1a] text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded disabled:opacity-30 hover:bg-[#fbb05a] transition-all"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {busy ? "generating…" : "generate"}
            </button>
          </div>
        </div>

        {error && (
          <div data-testid="create-error" className="bg-[#ff1744]/10 border border-[#ff1744]/30 rounded p-3 mono text-xs text-[#ff1744]">
            {error}
          </div>
        )}

        {result && (
          <div data-testid="create-result" className="bg-[#1a2332] border border-[#fb923c]/30 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-widest uppercase text-[#6b82a6]">latest · {new Date(result.created_at).toLocaleString()}</span>
              <button
                data-testid="create-download"
                onClick={() => download(result.data_uri, result.id)}
                className="flex items-center gap-1 text-[9px] tracking-widest uppercase text-[#fb923c] hover:text-[#fbb05a]"
              >
                <Download size={10} /> download
              </button>
            </div>
            <img src={result.data_uri} alt={result.prompt} className="w-full rounded border border-[#2a3a52] bg-[#0a0f1a]" />
            <div className="mono text-[10px] text-[#6b82a6] line-clamp-3">{result.prompt}</div>
          </div>
        )}

        {recent.length > 0 && (
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <ImageIcon size={12} className="text-[#fb923c]" />
              <span className="text-xs font-bold tracking-wide">RECENT</span>
              <span className="text-[8px] tracking-widest uppercase text-[#6b82a6]">{recent.length}</span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {recent.map((r) => (
                <div key={r.id} className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-2 space-y-1">
                  <div className="text-[9px] mono text-[#6b82a6] truncate" title={r.prompt}>{r.prompt}</div>
                  <div className="text-[8px] tracking-widest uppercase text-[#4a5568]">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
