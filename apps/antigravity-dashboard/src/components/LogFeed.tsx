import { useStore } from "@/store";
import clsx from "@/lib/clsx";

const PUBLIC_LOGS = [
  { t: "LIVE", who: "SYS", msg: "Paperclip online · localhost:3100" },
  { t: "LIVE", who: "HER", msg: "Hermes routing engaged" },
  { t: "LIVE", who: "OCL", msg: "OpenClaw dashboard linked" },
  { t: "LIVE", who: "AIM", msg: "AI for society mission active" },
];

export function LogFeed({ limit = 14, streamMode = false }: { limit?: number; streamMode?: boolean }) {
  const rawLog = useStore((s) => s.log).slice(0, limit);
  const log = streamMode ? PUBLIC_LOGS.slice(0, limit) : rawLog;

  return (
    <div data-testid="log-feed" className="font-data">
      {log.map((r, i) => (
        <div key={`${r.t}-${r.who}-${i}`} className={clsx("log-row", streamMode && "log-row--public")}>
          <span className="ts">{r.t}</span>
          <span className={`who ${streamMode ? "system" : r.who}`}>{r.who.toUpperCase()}</span>
          <span className="msg text-ink-muted flex-1 min-w-0">
            {r.msg}
          </span>
        </div>
      ))}
    </div>
  );
}
