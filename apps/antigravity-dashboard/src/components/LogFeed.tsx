import { useStore } from "@/store";

export function LogFeed({ limit = 14 }: { limit?: number }) {
  const log = useStore((s) => s.log).slice(0, limit);

  return (
    <div data-testid="log-feed" className="font-data">
      {log.map((r, i) => (
        <div key={`${r.t}-${i}`} className="log-row">
          <span className="ts">{r.t}</span>
          <span className={`who ${r.who}`}>{r.who.toUpperCase()}</span>
          <span className="msg text-ink-muted flex-1 min-w-0">
            {r.msg}
            {r.accent && <span className="accent">{r.accent}</span>}
            {r.after && <span>{r.after}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
