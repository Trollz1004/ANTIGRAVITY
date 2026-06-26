import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast, type Toast as ToastType, type ToastVariant } from '../lib/useToast';

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-teal-400/40 bg-teal-400/10 text-teal-200',
  error: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  info: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  warning: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
};

const variantIcons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { dismiss } = useToast();
  const Icon = variantIcons[toast.variant];

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg backdrop-blur-sm min-w-[280px] max-w-[420px] animate-in fade-in slide-in-from-top-2 duration-200',
        variantStyles[toast.variant]
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1 text-sm leading-5">{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
