import type { ReactNode } from "react";
import clsx from "@/lib/clsx";

interface StatProps {
  label: string;
  value: string | number;
  delta?: number; // -100..100
  icon?: ReactNode;
  hint?: string;
  spark?: ReactNode;
  tone?: "default" | "brand" | "success" | "info";
}

const TONE: Record<string, string> = {
  default: "text-ink",
  brand:   "text-brand",
  success: "text-signal-success",
  info:    "text-signal-info",
};

export function Stat({ label, value, delta, icon, hint, spark, tone = "default" }: StatProps) {
  return (
    <div
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="panel rounded-md p-4 flex flex-col gap-2 card-hover"
    >
      <div className="flex items-center justify-between">
        <span className="label-cap">{label}</span>
        {icon && <span className="text-ink-dim">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={clsx("font-heading text-2xl md:text-3xl tabular-nums", TONE[tone])}>
          {value}
        </span>
        {typeof delta === "number" && (
          <span
            className={clsx(
              "text-xs font-data tabular-nums",
              delta >= 0 ? "text-signal-success" : "text-signal-danger",
            )}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {hint && <div className="text-[11px] font-data text-ink-dim">{hint}</div>}
      {spark && <div className="mt-1 -mx-1">{spark}</div>}
    </div>
  );
}
