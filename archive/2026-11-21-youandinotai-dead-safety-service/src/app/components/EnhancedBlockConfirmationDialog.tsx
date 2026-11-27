import { Shield, AlertTriangle, VolumeX, EyeOff } from 'lucide-react';

interface EnhancedBlockConfirmationDialogProps {
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  onMuteInstead?: () => void;
  onRestrictInstead?: () => void;
}

export function EnhancedBlockConfirmationDialog({
  targetName,
  onConfirm,
  onCancel,
  isLoading = false,
  onMuteInstead,
  onRestrictInstead,
}: EnhancedBlockConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="glass-strong glass-highlight w-full max-w-md rounded-[2rem] border-4 border-[#111111] p-6 shadow-[12px_12px_0_0_rgba(17,17,17,1)]">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h3 className="app-title mb-3 text-center">Block @{targetName}?</h3>

        <div className="mb-6">
          <div className="mb-4 rounded-xl bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-bold text-red-800">This prevents:</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-red-700">
                  <li>Direct messages</li>
                  <li>Profile viewing</li>
                  <li>Tagging in posts</li>
                  <li>Adding as a connection</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-sm text-red-700">
              They won't be notified you blocked them, but they may notice some
              interactions no longer work.
            </p>
          </div>

          <div className="mb-4">
            <p className="mb-2 font-bold text-gray-800">
              Consider these alternatives first:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onMuteInstead}
                disabled={isLoading}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                <VolumeX size={16} />
                Mute Instead
              </button>
              <button
                type="button"
                onClick={onRestrictInstead}
                disabled={isLoading}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                <EyeOff size={16} />
                Restrict
              </button>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm font-bold text-gray-800">
          Want to proceed with blocking?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="app-button-outline flex-1 justify-center px-5 py-3 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="app-button-accent flex-1 justify-center px-5 py-3 disabled:opacity-60"
          >
            {isLoading ? 'Blocking...' : 'Block Permanently'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Undo within 5 minutes:
            <button
              type="button"
              className="ml-1 text-xs font-bold text-[#ff4f00] hover:underline"
              onClick={onCancel}
            >
              Undo
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
