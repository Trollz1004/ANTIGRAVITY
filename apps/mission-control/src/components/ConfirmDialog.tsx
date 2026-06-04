import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Focus the cancel button when dialog opens (safer default)
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
            <AlertTriangle size={20} className="text-rose-400" />
          </div>
          <h2
            id="confirm-dialog-title"
            className="text-base font-semibold text-slate-100"
          >
            {title}
          </h2>
        </div>
        <p
          id="confirm-dialog-message"
          className="mt-4 text-sm leading-6 text-slate-300"
        >
          {message}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={clsx(
              'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-4 text-xs font-semibold transition',
              'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700',
              'focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2'
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={clsx(
              'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-4 text-xs font-semibold transition',
              'border-rose-500/60 bg-rose-600 text-white hover:bg-rose-500',
              'focus-visible:outline-2 focus-visible:outline-rose-400 focus-visible:outline-offset-2'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
