import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, X, Send, ListTodo, Activity, CheckCircle2, AlertTriangle, Archive, Heart, Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLUMNS = [
  { id: "open",        label: "Open",        Icon: ListTodo,         tone: "#6b82a6" },
  { id: "in_progress", label: "In Progress", Icon: Activity,         tone: "#00d4ff" },
  { id: "blocked",     label: "Blocked",     Icon: AlertTriangle,    tone: "#ff1744" },
  { id: "done",        label: "Done",        Icon: CheckCircle2,     tone: "#00e676" },
];

const PRIORITY_COLOR = { p0: "#ff1744", p1: "#ffb300", p2: "#6b82a6" };

export function TasksMode() {
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = async () => {
    const [t, a, s] = await Promise.all([
      axios.get(`${API}/tasks?limit=200`).then((r) => r.data.tasks),
      axios.get(`${API}/tasks/agents`).then((r) => r.data.agents),
      axios.get(`${API}/tasks/stats`).then((r) => r.data),
    ]);
    setTasks(t || []); setAgents(a || []); setStats(s || null);
  };

  useEffect(() => {
    refresh();
    const onTask = (e) => setShowDispatch({ prefill: e.detail?.task || "" });
    window.addEventListener("opuspawclaw-task", onTask);
    const iv = setInterval(() => { if (!document.hidden) refresh(); }, 8000);
    return () => { window.removeEventListener("opuspawclaw-task", onTask); clearInterval(iv); };
  }, []);

  const grouped = useMemo(() => {
    const g = { open: [], in_progress: [], blocked: [], done: [] };
    tasks.forEach((t) => { if (g[t.status]) g[t.status].push(t); });
    return g;
  }, [tasks]);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/tasks/${id}`, { status });
    refresh();
  };
  const remove = async (id) => {
    if (!window.confirm("Archive this task permanently?")) return;
    await axios.delete(`${API}/tasks/${id}`);
    refresh();
  };

  return (
    <div data-testid="tasks-mode" className="h-full flex flex-col bg-[#0a0f1a] text-[#e8f0ff] overflow-hidden">
      <div className="px-6 py-3 border-b border-[#2a3a52] bg-[#111827]/60 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ListTodo size={16} className="text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-wide">TASKS · INTERNAL DISPATCH</span>
          {stats && (
            <span className="text-[8px] tracking-widest uppercase text-[#6b82a6]">
              {stats.active} active · p0:{stats.by_priority.p0} · p1:{stats.by_priority.p1} · p2:{stats.by_priority.p2}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="tasks-dispatch-btn"
            onClick={() => setShowDispatch({ prefill: "" })}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded bg-[#e040fb]/15 border border-[#e040fb]/40 text-[#e040fb] hover:bg-[#e040fb]/25 transition-all"
          >
            <Send size={12} /> Dispatch
          </button>
          <button
            data-testid="tasks-new-btn"
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded bg-[#00d4ff] text-[#0a0f1a] font-bold hover:bg-[#33ddff] transition-all"
          >
            <Plus size={12} /> New Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-12">
        {/* AGENT SIDE */}
        <aside className="col-span-3 lg:col-span-2 border-r border-[#2a3a52] bg-[#0a0f1a] overflow-y-auto custom-scrollbar p-3 space-y-2">
          <div className="text-[8px] tracking-[0.3em] uppercase text-[#4a5568] mb-2">Agent fleet</div>
          {agents.map((a) => {
            const pct = Math.min(100, Math.round((a.active_tasks / a.task_cap) * 100));
            return (
              <div
                key={a.id}
                data-testid={`agent-card-${a.id}`}
                className="bg-[#1a2332] border border-[#2a3a52] rounded p-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="text-[10px] font-bold truncate" style={{ color: a.color }}>{a.label}</span>
                  </div>
                  <span className="mono text-[9px] text-[#6b82a6] shrink-0">{a.active_tasks}/{a.task_cap}</span>
                </div>
                <div className="h-1 w-full bg-[#0a0f1a] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                </div>
                <div className="text-[8px] mono text-[#6b82a6] truncate">{a.role}</div>
                {a.heartbeat && (
                  <div className="text-[8px] mono text-[#00e676] flex items-center gap-1">
                    <Heart size={8} className="animate-pulse" /> {new Date(a.heartbeat.at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* KANBAN */}
        <main className="col-span-9 lg:col-span-10 overflow-hidden p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 h-full">
            {STATUS_COLUMNS.map((col) => (
              <div key={col.id} data-testid={`column-${col.id}`} className="bg-[#1a2332] border border-[#2a3a52] rounded-md flex flex-col overflow-hidden">
                <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <col.Icon size={12} style={{ color: col.tone }} />
                    <span className="text-[11px] font-bold tracking-wide" style={{ color: col.tone }}>{col.label}</span>
                  </div>
                  <span className="mono text-[9px] text-[#6b82a6]">{grouped[col.id].length}</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {grouped[col.id].length === 0 && (
                    <div className="text-[10px] text-[#4a5568] italic text-center py-4">empty</div>
                  )}
                  {grouped[col.id].map((t) => {
                    const owner = agents.find((a) => a.id === t.owner);
                    return (
                      <div
                        key={t.id}
                        data-testid={`task-${t.id}`}
                        className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-2 space-y-1.5 hover:border-[#00d4ff]/40 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[12px] font-bold leading-snug flex-1">{t.title}</div>
                          <span
                            className="mono text-[8px] tracking-widest uppercase px-1 py-0.5 rounded shrink-0"
                            style={{ background: `${PRIORITY_COLOR[t.priority]}20`, color: PRIORITY_COLOR[t.priority], border: `1px solid ${PRIORITY_COLOR[t.priority]}40` }}
                          >
                            {t.priority}
                          </span>
                        </div>
                        {t.body && <div className="text-[10px] text-[#6b82a6] line-clamp-3">{t.body}</div>}
                        <div className="flex items-center justify-between gap-2">
                          {owner ? (
                            <span className="flex items-center gap-1 text-[9px] mono">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: owner.color }} />
                              <span style={{ color: owner.color }}>{owner.label}</span>
                            </span>
                          ) : <span className="text-[9px] mono text-[#4a5568]">—</span>}
                          {t.bucket && (
                            <span className="mono text-[8px] tracking-widest uppercase text-[#ffb300]">B{String(t.bucket).padStart(2,"0")}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity pt-1 border-t border-[#2a3a52]">
                          <select
                            data-testid={`task-status-${t.id}`}
                            value={t.status}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                            className="mono text-[9px] flex-1 bg-[#1a2332] border border-[#2a3a52] rounded px-1 py-0.5 text-[#e8f0ff] outline-none"
                          >
                            {STATUS_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            <option value="archived">Archive</option>
                          </select>
                          <button
                            data-testid={`task-edit-${t.id}`}
                            onClick={() => setEditing(t)}
                            className="text-[8px] tracking-widest uppercase text-[#00d4ff] hover:text-[#33ddff] px-1"
                          >
                            edit
                          </button>
                          <button
                            data-testid={`task-delete-${t.id}`}
                            onClick={() => remove(t.id)}
                            className="text-[#6b82a6] hover:text-[#ff1744]"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showNew && <TaskForm agents={agents} onClose={() => setShowNew(false)} onSaved={refresh} />}
      {editing && <TaskForm task={editing} agents={agents} onClose={() => setEditing(null)} onSaved={refresh} />}
      {showDispatch && <DispatchForm prefill={showDispatch.prefill} agents={agents} onClose={() => setShowDispatch(false)} onSaved={refresh} />}
    </div>
  );
}

function TaskForm({ task, agents, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    body: task?.body || "",
    owner: task?.owner || "ceo",
    priority: task?.priority || "p1",
    bucket: task?.bucket || "",
    status: task?.status || "open",
  });
  const [busy, setBusy] = useState(false);
  const editing = !!task;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, bucket: form.bucket ? Number(form.bucket) : null };
      if (editing) await axios.patch(`${API}/tasks/${task.id}`, payload);
      else await axios.post(`${API}/tasks`, payload);
      onSaved(); onClose();
    } finally { setBusy(false); }
  };

  return (
    <Modal title={editing ? "Edit Task" : "New Task"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3" data-testid="task-form">
        <Field label="Title">
          <input data-testid="task-form-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Body">
          <textarea data-testid="task-form-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Owner">
            <select data-testid="task-form-owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={inputCls}>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select data-testid="task-form-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls}>
              <option value="p0">P0</option><option value="p1">P1</option><option value="p2">P2</option>
            </select>
          </Field>
          <Field label="Bucket (1-10)">
            <input data-testid="task-form-bucket" type="number" min="1" max="10" value={form.bucket} onChange={(e) => setForm({ ...form, bucket: e.target.value })} className={inputCls} />
          </Field>
        </div>
        {editing && (
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
              {STATUS_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value="archived">Archived</option>
            </select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-[10px] tracking-widest uppercase px-3 py-1.5 text-[#6b82a6] hover:text-[#e8f0ff]">cancel</button>
          <button data-testid="task-form-submit" type="submit" disabled={busy || !form.title.trim()} className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#00d4ff] text-[#0a0f1a] font-bold disabled:opacity-30 hover:bg-[#33ddff]">{busy ? "saving…" : editing ? "Save" : "Create"}</button>
        </div>
      </form>
    </Modal>
  );
}

function DispatchForm({ prefill, agents, onClose, onSaved }) {
  const [title, setTitle] = useState(prefill || "");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("p1");
  const [bucket, setBucket] = useState("");
  const [owners, setOwners] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggle = (id) => setOwners((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post(`${API}/tasks/dispatch`, {
        title, body, priority, bucket: bucket ? Number(bucket) : null, owners,
        source: "Mission Control · TaskCommander",
      });
      onSaved(); onClose();
    } finally { setBusy(false); }
  };

  return (
    <Modal title="Dispatch Task to Multiple Agents" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3" data-testid="dispatch-form">
        <Field label="Title">
          <input data-testid="dispatch-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Body">
          <textarea data-testid="dispatch-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              <option value="p0">P0 · drop everything</option>
              <option value="p1">P1 · normal</option>
              <option value="p2">P2 · whenever</option>
            </select>
          </Field>
          <Field label="Bucket (1-10)">
            <input type="number" min="1" max="10" value={bucket} onChange={(e) => setBucket(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label={`Agents · ${owners.length} selected`}>
          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1 border border-[#2a3a52] rounded">
            {agents.map((a) => {
              const on = owners.includes(a.id);
              return (
                <button
                  key={a.id} type="button"
                  data-testid={`dispatch-toggle-${a.id}`}
                  onClick={() => toggle(a.id)}
                  className={`text-[10px] mono px-2 py-1 rounded border transition-all ${on ? "border-[var(--c)] bg-[var(--c)]/15" : "border-[#2a3a52] bg-[#0a0f1a] hover:border-[var(--c)]"}`}
                  style={{ "--c": a.color, color: on ? a.color : "#6b82a6" }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-[10px] tracking-widest uppercase px-3 py-1.5 text-[#6b82a6] hover:text-[#e8f0ff]">cancel</button>
          <button data-testid="dispatch-submit" type="submit" disabled={busy || !title.trim() || owners.length === 0} className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#e040fb] text-[#0a0f1a] font-bold disabled:opacity-30 hover:bg-[#f070fe]">
            {busy ? "dispatching…" : `Dispatch to ${owners.length}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-[#0a0f1a]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#1a2332] border border-[#2a3a52] rounded-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#111827] border-b border-[#2a3a52] px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide">{title}</span>
          <button onClick={onClose} className="text-[#6b82a6] hover:text-[#ff1744]"><X size={14} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-[#0a0f1a] border border-[#2a3a52] rounded px-2.5 py-1.5 text-sm text-[#e8f0ff] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none mono";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[8px] tracking-[0.25em] uppercase text-[#6b82a6] mb-1 block">{label}</span>
      {children}
    </label>
  );
}
