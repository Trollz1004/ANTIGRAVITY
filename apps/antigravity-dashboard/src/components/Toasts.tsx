import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store";
import { Icon } from "@/lib/icons";
import clsx from "@/lib/clsx";

const TONE_CLASS: Record<string, string> = {
  success: "border-signal-success/40 bg-signal-success/10 text-signal-success",
  warning: "border-signal-warning/40 bg-signal-warning/10 text-signal-warning",
  danger:  "border-signal-danger/40 bg-signal-danger/10 text-signal-danger",
  info:    "border-brand/40 bg-brand/10 text-brand",
};

const TONE_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  success: Icon.CheckCircle2,
  warning: Icon.AlertTriangle,
  danger:  Icon.AlertTriangle,
  info:    Icon.Sparkles,
};

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="fixed top-16 right-4 z-[55] flex flex-col gap-2 w-[320px]" data-testid="toasts">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Ic = TONE_ICON[t.tone] ?? Icon.Sparkles;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className={clsx(
                "border rounded-md bg-ag-base/90 backdrop-blur p-3 flex items-start gap-2 shadow-xl",
                TONE_CLASS[t.tone],
              )}
              data-testid={`toast-${t.tone}`}
            >
              <Ic size={14} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-data text-sm text-ink">{t.title}</div>
                {t.body && (
                  <div className="text-xs text-ink-dim font-data mt-0.5">{t.body}</div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-ink-dim hover:text-ink shrink-0"
                aria-label="Dismiss"
              >
                <Icon.X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
