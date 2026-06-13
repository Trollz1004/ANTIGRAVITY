import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { Icon } from "@/lib/icons";

function formatNum(n: number): string {
  return n.toLocaleString("en-US");
}

export function MissionTicker() {
  const kids = useStore((s) => s.kidsFunded);
  const [pulse, setPulse] = useState(0);
  const prev = useState(() => ({ current: kids }))[0];

  useEffect(() => {
    if (kids !== prev.current) {
      prev.current = kids;
      setPulse((p) => p + 1);
    }
  }, [kids, prev]);

  return (
    <div className="ticker-bar" data-testid="ticker" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-[11px] font-label uppercase tracking-[0.18em]">
        <span className="flex items-center gap-1.5">
          <span className="heartbeat heartbeat--busy" />
          Mission Active
        </span>
        <span className="opacity-60">·</span>
        <span>Kids funded to date</span>
      </div>
      <div className="flex items-center gap-6 font-data text-sm md:text-base">
        <div className="flex items-center gap-2">
          <Icon.Heart size={14} />
          <span
            key={pulse}
            className="ticker-num tabular-nums"
            data-testid="kids-funded"
          >
            ${formatNum(kids)}
          </span>
        </div>
        <span className="hidden md:flex items-center gap-1.5 opacity-90">
          <Icon.ChevronsRight size={12} />
          <span className="font-label uppercase tracking-[0.18em] text-[10px]">
            #UntilNoKidInNeed
          </span>
        </span>
      </div>
    </div>
  );
}
