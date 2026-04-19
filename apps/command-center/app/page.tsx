"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Inbox, CheckCircle, XCircle, Send, ExternalLink, Trash2,
  Sun, Moon, Terminal, ChevronDown, ChevronUp, Plus, Image,
  ArrowRight, RotateCcw, Play, Pause, SkipForward, SkipBack,
  Maximize2, Minimize2, Video, Globe, ShoppingCart, Cpu,
  Server, Radio as RadioIcon, Link, Volume2, Upload, X,
} from "lucide-react";
import {
  AI_SOURCES, PLATFORMS, TARGET_PLATFORMS,
  type ContentItem, type ContentStatus, type PlatformType, createItem,
} from "@/lib/data";

type Tab = "hq" | "inbox" | "approved" | "sent" | "rejected" | "add";

const STORAGE_KEY = "cc-items-v2";
const now = () => new Date().toISOString().split("T")[0];

// ── MEDIA PLAYER (floating, from revenue-core) ──────────────
function MediaPlayer({
  url, type, title, isPlaying, onPlayPause, minimized, onToggleMinimize, onClose,
}: {
  url: string; type: "video" | "audio" | "image"; title: string;
  isPlaying: boolean; onPlayPause: () => void;
  minimized: boolean; onToggleMinimize: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    if (isPlaying) ref.current.play().catch(() => {});
    else ref.current.pause();
  }, [isPlaying, url]);

  if (type === "image") {
    return (
      <div className={`fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden transition-all ${minimized ? "w-20 h-20" : "w-80"}`}>
        {!minimized && <img src={url} alt={title} className="w-full max-h-64 object-contain bg-black" />}
        <div className="flex items-center justify-between p-2">
          <p className="text-[10px] text-white font-bold truncate flex-1">{title}</p>
          <div className="flex gap-1">
            <button onClick={onToggleMinimize} className="text-slate-400 hover:text-white p-1">
              {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-red-400 p-1"><X size={12} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden transition-all ${minimized ? "w-64 h-16" : "w-80"}`}>
      {!minimized && (
        <div className="relative h-48 bg-black group">
          <video
            ref={ref}
            src={url}
            className="w-full h-full object-cover opacity-80"
            onTimeUpdate={() => {
              if (ref.current) setProgress((ref.current.currentTime / ref.current.duration) * 100);
            }}
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            {type === "video" ? <Video className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />}
          </div>
        </div>
      )}
      <div className="p-3">
        {!minimized && (
          <div className="w-full h-1 bg-slate-700 rounded-full mb-2 cursor-pointer">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white font-bold truncate flex-1 pr-2">{title}</p>
          <div className="flex items-center gap-1">
            <button onClick={onPlayPause} className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500">
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button onClick={onToggleMinimize} className="text-slate-400 hover:text-white p-1">
              {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-red-400 p-1"><X size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STATUS BADGE ─────────────────────────────────────────────
function StatusBadge({ status }: { status: ContentStatus }) {
  const map: Record<ContentStatus, { bg: string; text: string; label: string }> = {
    inbox: { bg: "bg-blue-500/20", text: "text-blue-400", label: "INBOX" },
    approved: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "APPROVED" },
    rejected: { bg: "bg-red-500/20", text: "text-red-400", label: "REJECTED" },
    sent: { bg: "bg-violet-500/20", text: "text-violet-400", label: "SENT" },
  };
  const s = map[status];
  return <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

// ── PLATFORM TYPE ICONS ──────────────────────────────────────
const TYPE_META: Record<PlatformType, { label: string; Icon: typeof Globe }> = {
  social: { label: "Social", Icon: Globe },
  commerce: { label: "Commerce", Icon: ShoppingCart },
  llm: { label: "AI / LLM", Icon: Cpu },
  dispatch: { label: "Dispatch", Icon: Send },
  infra: { label: "Infra", Icon: Server },
};

// ── MAIN ─────────────────────────────────────────────────────
export default function CommandCenter() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<Tab>("hq");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [platFilter, setPlatFilter] = useState<PlatformType | "all">("all");

  // Media player state
  const [playerMedia, setPlayerMedia] = useState<{ url: string; type: "image" | "video" | "audio"; title: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMinimized, setPlayerMinimized] = useState(false);

  // Add form
  const [addTitle, setAddTitle] = useState("");
  const [addBody, setAddBody] = useState("");
  const [addSource, setAddSource] = useState("");
  const [addMediaUrl, setAddMediaUrl] = useState("");
  const [addMediaType, setAddMediaType] = useState<"image" | "video" | "audio" | "">("");
  const [addCustomUrl, setAddCustomUrl] = useState("");
  const [addTags, setAddTags] = useState("");
  const [addTargets, setAddTargets] = useState<string[]>(TARGET_PLATFORMS.map(p => p.id));

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const update = (id: string, changes: Partial<ContentItem>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));

  const approve = (id: string) => update(id, { status: "approved", approvedAt: now() });
  const reject = (id: string) => update(id, { status: "rejected" });
  const markSent = (id: string) => update(id, { status: "sent", sentAt: now() });
  const backToInbox = (id: string) => update(id, { status: "inbox", approvedAt: "", sentAt: "" });
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const openMedia = (item: ContentItem) => {
    if (!item.mediaUrl) return;
    setPlayerMedia({ url: item.mediaUrl, type: item.mediaType || "image", title: item.title });
    if (item.mediaType === "video" || item.mediaType === "audio") setIsPlaying(true);
    setPlayerMinimized(false);
  };

  const toggleTarget = (id: string) => {
    setAddTargets(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const addItem = () => {
    if (!addTitle.trim() || !addSource) return;
    const item = createItem({
      title: addTitle.trim(),
      body: addBody.trim(),
      source: addSource,
      mediaUrl: addMediaUrl.trim(),
      mediaType: addMediaType || "",
      customUrl: addCustomUrl.trim(),
      targets: addTargets,
      tags: addTags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setItems(prev => [item, ...prev]);
    setAddTitle(""); setAddBody(""); setAddSource(""); setAddMediaUrl("");
    setAddMediaType(""); setAddCustomUrl(""); setAddTags("");
    setAddTargets(TARGET_PLATFORMS.map(p => p.id));
    setTab("inbox");
  };

  const filtered = items.filter(i => {
    if (tab === "add" || tab === "hq") return false;
    return i.status === tab;
  });

  const counts: Record<string, number> = {
    inbox: items.filter(i => i.status === "inbox").length,
    approved: items.filter(i => i.status === "approved").length,
    sent: items.filter(i => i.status === "sent").length,
    rejected: items.filter(i => i.status === "rejected").length,
  };

  const filteredPlatforms = platFilter === "all" ? PLATFORMS : PLATFORMS.filter(p => p.type === platFilter);

  // Styles
  const bg = dark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900";
  const card = dark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const input = dark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-600" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";
  const tabBase = "px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap";
  const tabOn = "bg-blue-600 text-white";
  const tabOff = dark ? "bg-slate-900 text-slate-400 border border-slate-800" : "bg-white text-slate-500 border border-slate-200";

  const TABS: { key: Tab; label: string; Icon: typeof Inbox; count?: number }[] = [
    { key: "hq", label: "HQ", Icon: RadioIcon },
    { key: "inbox", label: "Inbox", Icon: Inbox, count: counts.inbox },
    { key: "approved", label: "Ready", Icon: CheckCircle, count: counts.approved },
    { key: "sent", label: "Sent", Icon: Send, count: counts.sent },
    { key: "rejected", label: "Rejected", Icon: XCircle, count: counts.rejected },
    { key: "add", label: "Add", Icon: Plus },
  ];

  return (
    <div className={`min-h-screen font-sans transition-all duration-500 ${bg} selection:bg-blue-500/30`}>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-3 rounded-2xl shrink-0 ${dark ? "bg-blue-600/20 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}>
              <Terminal size={22} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tighter uppercase">Command Center</h1>
              <p className={`text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase ${sub}`}>
                {counts.inbox} pending &middot; {counts.approved} ready &middot; {items.length} total &middot; #ForTheKids
              </p>
            </div>
          </div>
          <button onClick={() => setDark(!dark)} className={`p-2 rounded-xl shrink-0 ${dark ? "bg-slate-900 text-yellow-400 border border-slate-800" : "bg-white text-slate-600 border border-slate-200"}`}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* TAB BAR */}
        <nav className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`${tabBase} ${tab === t.key ? tabOn : tabOff}`}>
              <t.Icon size={14} /> {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] ${tab === t.key ? "bg-white/20" : "bg-blue-500/20 text-blue-400"}`}>{t.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ════════ HQ TAB ════════ */}
        {tab === "hq" && (
          <div className="space-y-4">
            {/* Platform type filter */}
            <div className="flex gap-1.5 overflow-x-auto">
              <button onClick={() => setPlatFilter("all")} className={`${tabBase} ${platFilter === "all" ? tabOn : tabOff}`}>All</button>
              {(Object.keys(TYPE_META) as PlatformType[]).map(key => {
                const m = TYPE_META[key];
                return (
                  <button key={key} onClick={() => setPlatFilter(key)} className={`${tabBase} ${platFilter === key ? tabOn : tabOff}`}>
                    <m.Icon size={12} /> {m.label}
                  </button>
                );
              })}
            </div>

            {/* Platform grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredPlatforms.map(p => (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 ${card}`}>
                  <span className="text-2xl" style={{ color: p.color }}>{p.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight">{p.label}</span>
                  <span className={`text-[8px] ${sub} text-center leading-tight`}>{p.claw}</span>
                </a>
              ))}
            </div>

            {/* Quick stats + recent */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${card}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black uppercase tracking-wider">Recent Content</h3>
                <button onClick={() => setTab("add")} className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400">
                  <Plus size={14} /> Add
                </button>
              </div>
              {items.length === 0 ? (
                <div className={`text-center py-8 ${sub}`}>
                  <Inbox size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-bold">No content yet</p>
                  <p className="text-[10px] mt-1">Add content from your AI team</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.slice(0, 6).map(item => {
                    const source = AI_SOURCES.find(s => s.id === item.source);
                    return (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${card}`}>
                        <span className="text-lg shrink-0" style={{ color: source?.color }}>{source?.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{item.title}</p>
                          <p className={`text-[10px] ${sub}`}>{source?.label} &middot; {item.created}</p>
                        </div>
                        <StatusBadge status={item.status} />
                        {item.mediaUrl && (
                          <button onClick={() => openMedia(item)} className="text-blue-500 hover:text-blue-400 p-1 shrink-0">
                            {item.mediaType === "video" ? <Video size={14} /> : item.mediaType === "audio" ? <Volume2 size={14} /> : <Image size={14} />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {items.length > 6 && (
                    <button onClick={() => setTab("inbox")} className={`text-xs font-bold ${sub} hover:text-blue-500`}>
                      View all {items.length} items &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ ADD CONTENT ════════ */}
        {tab === "add" && (
          <div className={`p-5 rounded-2xl border ${card}`}>
            <h3 className="text-sm font-black uppercase tracking-wider mb-4">Add AI-Generated Content</h3>
            <div className="space-y-3">
              {/* AI Source picker */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>AI Source</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {AI_SOURCES.map(s => (
                    <button key={s.id} onClick={() => setAddSource(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        addSource === s.id ? "border-blue-500 bg-blue-500/10 text-blue-400" : card
                      }`}>
                      <span style={{ color: s.color }}>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Title / Headline</label>
                <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Post title..."
                  className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${input}`} />
              </div>

              {/* Body */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Content</label>
                <textarea value={addBody} onChange={e => setAddBody(e.target.value)} placeholder="Paste the full post content..."
                  rows={6} className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm resize-y ${input}`} />
              </div>

              {/* Media URL + type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Media URL (image/video/audio)</label>
                  <input value={addMediaUrl} onChange={e => setAddMediaUrl(e.target.value)} placeholder="https://... or local file path"
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${input}`} />
                </div>
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Media Type</label>
                  <select value={addMediaType} onChange={e => setAddMediaType(e.target.value as typeof addMediaType)}
                    className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${input}`}>
                    <option value="">Auto / None</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
              </div>

              {/* Custom URL (paste any URL to post to) */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>
                  <Link size={10} className="inline mr-1" />Custom Post URL (specific thread, page, or landing)
                </label>
                <input value={addCustomUrl} onChange={e => setAddCustomUrl(e.target.value)}
                  placeholder="Paste any URL — specific thread, subreddit, FB group, eBay listing page..."
                  className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${input}`} />
                <p className={`text-[9px] mt-1 ${sub}`}>
                  Opens this exact URL when you hit &quot;Post Here&quot; — use for specific threads, groups, or pages
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Tags (comma separated)</label>
                <input value={addTags} onChange={e => setAddTags(e.target.value)} placeholder="#forthekids, #youandinotai"
                  className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-sm ${input}`} />
              </div>

              {/* Target platform toggles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Post To ({addTargets.length} selected)</label>
                  <div className="flex gap-2">
                    <button onClick={() => setAddTargets(TARGET_PLATFORMS.map(p => p.id))} className="text-[9px] font-bold text-blue-500">All</button>
                    <button onClick={() => setAddTargets([])} className="text-[9px] font-bold text-slate-500">None</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => toggleTarget(p.id)}
                      className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                        addTargets.includes(p.id)
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : dark ? "border-slate-700 text-slate-500" : "border-slate-300 text-slate-400"
                      }`}>
                      <span style={{ color: p.color }}>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={addItem} disabled={!addTitle.trim() || !addSource}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold transition-all active:scale-[0.98]">
                Add to Inbox
              </button>
            </div>
          </div>
        )}

        {/* ════════ CONTENT LIST (inbox/approved/sent/rejected) ════════ */}
        {(tab === "inbox" || tab === "approved" || tab === "sent" || tab === "rejected") && (
          <>
            {filtered.length === 0 ? (
              <div className={`text-center py-16 ${sub}`}>
                <Inbox size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold">
                  {tab === "inbox" ? "Inbox empty" : tab === "approved" ? "Nothing approved yet" : tab === "sent" ? "Nothing sent yet" : "Nothing rejected"}
                </p>
                {tab === "inbox" && (
                  <button onClick={() => setTab("add")} className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500">
                    <Plus size={14} className="inline mr-1" /> Add Content
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(item => {
                  const source = AI_SOURCES.find(s => s.id === item.source);
                  const isExpanded = expandedId === item.id;

                  return (
                    <div key={item.id} className={`rounded-2xl border overflow-hidden ${card}`}>
                      {/* Header row */}
                      <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="w-full p-4 text-left">
                        <div className="flex items-start gap-3">
                          <span className="text-xl shrink-0 mt-0.5" style={{ color: source?.color }}>{source?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <StatusBadge status={item.status} />
                              <span className={`text-[9px] ${sub}`}>{source?.label} &middot; {item.created}</span>
                            </div>
                            <p className="text-sm font-bold">{item.title}</p>
                            {!isExpanded && item.body && (
                              <p className={`text-xs mt-1 ${sub} line-clamp-1`}>{item.body}</p>
                            )}
                          </div>
                          {item.mediaUrl && (
                            <button onClick={(e) => { e.stopPropagation(); openMedia(item); }}
                              className="text-blue-500 hover:text-blue-400 p-1 shrink-0">
                              {item.mediaType === "video" ? <Video size={16} /> : item.mediaType === "audio" ? <Volume2 size={16} /> : <Image size={16} />}
                            </button>
                          )}
                          {isExpanded ? <ChevronUp size={16} className={sub} /> : <ChevronDown size={16} className={sub} />}
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* Body */}
                          {item.body && (
                            <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${dark ? "bg-slate-950" : "bg-slate-50"}`}>
                              {item.body}
                            </div>
                          )}

                          {/* Inline media preview */}
                          {item.mediaUrl && (
                            <div className={`rounded-xl overflow-hidden border ${dark ? "border-slate-700 bg-black" : "border-slate-200 bg-slate-100"}`}>
                              {(item.mediaType === "image" || !item.mediaType) && (
                                <img src={item.mediaUrl} alt={item.title} className="w-full max-h-80 object-contain" />
                              )}
                              {item.mediaType === "video" && (
                                <video src={item.mediaUrl} controls playsInline className="w-full max-h-80" />
                              )}
                              {item.mediaType === "audio" && (
                                <div className="p-4">
                                  <audio src={item.mediaUrl} controls className="w-full" />
                                </div>
                              )}
                              <div className="flex items-center justify-between p-2">
                                <p className={`text-[9px] font-bold ${sub} truncate`}>{item.mediaUrl}</p>
                                <button onClick={() => openMedia(item)}
                                  className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 shrink-0">
                                  <Maximize2 size={10} /> Float
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map(t => (
                                <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>{t}</span>
                              ))}
                            </div>
                          )}

                          {/* Custom URL */}
                          {item.customUrl && (
                            <a href={item.customUrl} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-3 rounded-xl border transition-all hover:border-blue-500 ${card}`}>
                              <Link size={14} className="text-blue-500 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-blue-500 uppercase">Custom Post URL</p>
                                <p className={`text-xs truncate ${sub}`}>{item.customUrl}</p>
                              </div>
                              <ExternalLink size={12} className="text-blue-500 shrink-0" />
                            </a>
                          )}

                          {/* Target platforms */}
                          <div>
                            <p className={`text-[10px] font-bold uppercase ${sub} mb-1.5`}>Posts to:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.targets.map(tid => {
                                const p = TARGET_PLATFORMS.find(tp => tp.id === tid);
                                if (!p) return null;
                                return (
                                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all hover:scale-105 ${card}`}>
                                    <span style={{ color: p.color }}>{p.icon}</span>
                                    <span className="font-bold">{p.label}</span>
                                    <ExternalLink size={9} className={sub} />
                                  </a>
                                );
                              })}
                            </div>
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <div className={`p-3 rounded-xl border-l-2 border-amber-500 ${dark ? "bg-amber-500/5" : "bg-amber-50"}`}>
                              <p className="text-[10px] font-bold text-amber-500 mb-1">YOUR NOTES</p>
                              <p className="text-xs">{item.notes}</p>
                            </div>
                          )}

                          {/* ACTION BUTTONS */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                            {item.status === "inbox" && (
                              <>
                                <button onClick={() => approve(item.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95">
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => reject(item.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold active:scale-95">
                                  <XCircle size={14} /> Reject
                                </button>
                              </>
                            )}
                            {item.status === "approved" && (
                              <>
                                <button onClick={() => markSent(item.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold active:scale-95">
                                  <Send size={14} /> Mark Sent
                                </button>
                                {item.customUrl && (
                                  <a href={item.customUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold active:scale-95">
                                    <Link size={14} /> Post Here
                                  </a>
                                )}
                                <button onClick={() => item.targets.forEach(tid => {
                                  const p = TARGET_PLATFORMS.find(tp => tp.id === tid);
                                  if (p) window.open(p.url, "_blank");
                                })} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold active:scale-95">
                                  <ArrowRight size={14} /> Open All Platforms
                                </button>
                              </>
                            )}
                            {(item.status === "rejected" || item.status === "sent") && (
                              <button onClick={() => backToInbox(item.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                                <RotateCcw size={14} /> Back to Inbox
                              </button>
                            )}
                            <button onClick={() => remove(item.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500/60 hover:text-red-500 ml-auto active:scale-95">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* FOOTER */}
        <footer className={`py-6 border-t text-center text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
          ANTIGRAVITY Command Center &middot; Private Admin &middot; #ForTheKids
        </footer>
      </div>

      {/* FLOATING MEDIA PLAYER */}
      {playerMedia && (
        <MediaPlayer
          url={playerMedia.url}
          type={playerMedia.type}
          title={playerMedia.title}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          minimized={playerMinimized}
          onToggleMinimize={() => setPlayerMinimized(!playerMinimized)}
          onClose={() => { setPlayerMedia(null); setIsPlaying(false); }}
        />
      )}
    </div>
  );
}
