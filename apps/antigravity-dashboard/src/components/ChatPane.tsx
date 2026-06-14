import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store";
import { Icon } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  body: string;
  ts: string;
  provider: string;
  model: string;
}

const SEED: ChatMsg[] = [
  {
    id: 1,
    role: "user",
    body: "Status on the paperclip-runtime handoff protocol?",
    ts: "11:38:14",
    provider: "Operator",
    model: "joshua@antigravity",
  },
  {
    id: 2,
    role: "assistant",
    body: "Codex is mid-implementation on handoff v2 (51% complete). Race-condition review pending. Want me to delegate Gemma4 to fuzz the worker queue while Codex finishes?",
    ts: "11:38:21",
    provider: "Nous Portal",
    model: "openai/gpt-5.5-pro",
  },
  {
    id: 3,
    role: "user",
    body: "Yes — and make sure it doesn't race with Cupid's ad refresh.",
    ts: "11:38:42",
    provider: "Operator",
    model: "joshua@antigravity",
  },
  {
    id: 4,
    role: "assistant",
    body: "Adding a soft lock on the ad-creative table while Gemma4 fuzzes. Will report back in ~4 minutes.",
    ts: "11:38:49",
    provider: "Nous Portal",
    model: "openai/gpt-5.5-pro",
  },
];

function stamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

let _cid = 100;

export function ChatPane() {
  const pushLog = useStore((s) => s.pushLog);
  const pushToast = useStore((s) => s.pushToast);
  const [msgs, setMsgs] = useState<ChatMsg[]>(SEED);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const send = () => {
    if (!draft.trim() || busy) return;
    const userMsg: ChatMsg = {
      id: ++_cid,
      role: "user",
      body: draft.trim(),
      ts: stamp(),
      provider: "Operator",
      model: "joshua@antigravity",
    };
    setMsgs((m) => [...m, userMsg]);
    setDraft("");
    pushLog({ t: stamp(), who: "user", msg: userMsg.body });
    setBusy(true);
    // simulate assistant response
    setTimeout(() => {
      const reply: ChatMsg = {
        id: ++_cid,
        role: "assistant",
        body: "Acknowledged. Routing through Hermes and updating the Paperweight board.",
        ts: stamp(),
        provider: "Nous Portal",
        model: "openai/gpt-5.5-pro",
      };
      setMsgs((m) => [...m, reply]);
      pushLog({ t: stamp(), who: "hermes", msg: "Acknowledged. Routing through Hermes and updating the Paperweight board." });
      setBusy(false);
      pushToast({
        title: "Routed via Hermes",
        body: "Reply delivered · 9020 hop · 84ms",
        tone: "info",
      });
    }, 800);
  };

  return (
    <div className="panel rounded-md flex flex-col h-full overflow-hidden" data-testid="chat-pane">
      <div className="px-4 py-3 border-b border-ag-elevated flex items-center gap-2">
        <span className="heartbeat" />
        <h3 className="font-data text-sm font-bold">Operator chat</h3>
        <span className="text-[10px] font-label uppercase tracking-wider text-ink-dim ml-auto">
          live · gpt-5.5-pro
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[80%] bg-ag-elevated text-ink font-data p-3 rounded-tl-md rounded-tr-md rounded-bl-md"
                  : "mr-auto max-w-[80%] bg-ag-base border border-ag-elevated text-ink font-data p-3 rounded-tr-md rounded-br-md rounded-bl-md"
              }
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</div>
              <div className="text-[10px] font-label uppercase tracking-wider text-ink-dim mt-2 flex items-center gap-2 border-t border-ag-elevated pt-2">
                <span>{m.ts}</span>
                <span>·</span>
                <span>X-Hermes-Provider: {m.provider}</span>
                <span>·</span>
                <span className="truncate">X-Hermes-Real-Model: {m.model}</span>
              </div>
            </motion.div>
          ))}
          {busy && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mr-auto max-w-[80%] bg-ag-base border border-ag-elevated px-3 py-2 rounded-md font-data text-xs text-ink-dim flex items-center gap-1.5"
            >
              <span className="heartbeat heartbeat--busy" />
              Nous Pro is thinking
              <span className="ml-1 inline-flex gap-0.5">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse [animation-delay:120ms]">.</span>
                <span className="animate-pulse [animation-delay:240ms]">.</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        className="border-t border-ag-elevated p-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the operator chat…"
          data-testid="chat-input"
          className="flex-1 bg-ag-base border border-ag-elevated rounded-sm px-3 py-2 text-sm font-data placeholder:text-ink-dim focus-ring outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="chat-send"
          className="px-3 py-2 bg-brand text-ag-base font-label uppercase tracking-wider text-xs rounded-sm hover:bg-brand/90 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Icon.Send size={12} />
          Send
        </button>
      </form>
    </div>
  );
}
