/**
 * ErrorFallback — branded error page component for YouAndINotAI.
 * Displays a friendly message with retry and home navigation buttons.
 */

import { AlertTriangle, Home, RotateCcw, Send } from 'lucide-react';

interface ErrorFallbackProps {
  errorId: string;
  onRetry: () => void;
  onGoHome: () => void;
  onReport?: () => void;
}

export function ErrorFallback({
  errorId,
  onRetry,
  onGoHome,
  onReport,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12">
      <div className="glass-strong glass-highlight max-w-lg rounded-[2rem] p-8 text-center animate-scale-in">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border-4 border-[#111111] bg-[#111111] text-white shadow-[8px_8px_0_0_#ff4f00]">
          <AlertTriangle size={36} className="text-[#ff4f00]" />
        </div>

        {/* Kicker */}
        <div className="app-kicker mb-3">Something went wrong</div>

        {/* Title */}
        <h2 className="app-title mb-3">we hit a snag.</h2>

        {/* Description */}
        <p className="app-subtitle mx-auto max-w-sm">
          An unexpected error occurred. Our team has been notified. You can try
          again or head back to the main page.
        </p>

        {/* Error ID */}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a8478]">
          Error ID: {errorId.slice(0, 8)}
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="app-button-accent px-6 py-3 text-sm"
          >
            <RotateCcw size={16} /> Try Again
          </button>
          <button
            onClick={onGoHome}
            className="app-button-dark px-6 py-3 text-sm"
          >
            <Home size={16} /> Go Home
          </button>
        </div>

        {/* Report button */}
        {onReport && (
          <button
            onClick={onReport}
            className="mt-4 inline-flex items-center gap-2 border-4 border-[#111111] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#111111] shadow-[4px_4px_0_0_#111111] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <Send size={12} /> Report Issue
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorFallback;
