import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Icon } from "@/lib/icons";

function formatNum(n: number): string {
  return n.toLocaleString("en-US");
}

export function MissionTicker() {
  const amount = useStore((s) => s.revenueMonitored);
  const [pulse, setPulse] = useState(0);
  const prev = useState(() => ({ current: amount }))[0];

  useEffect(() => {
    if (amount !== prev.current) {
      prev.current = amount;
      setPulse((p) => p + 1);
    }
  }, [amount, prev]);

  return (
    <div className="ticker-bar" data-testid="ticker" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-[11px] font-label uppercase tracking-[0.18em]">
        <span className="flex items-center gap-1.5">
          <span className="heartbeat heartbeat--busy" />
          Operations Active
        </span>
        <span className="opacity-60">·</span>
        <span>Revenue monitored to date</span>
      </div>
      <div className="flex items-center gap-6 font-data text-sm md:text-base">
        <div className="flex items-center gap-2">
          <Icon.Heart size={14} />
          <span
            key={pulse}
            className="ticker-num tabular-nums"
            data-testid="revenue-monitored"
          >
            ${formatNum(amount)}
          </span>
        </div>
        <span className="hidden md:flex items-center gap-1.5 opacity-90">
          <Icon.ChevronsRight size={12} />
          <span className="font-label uppercase tracking-[0.18em] text-[10px]">
            Production Control
          </span>
        </span>
      </div>
    </div>
  );
}
