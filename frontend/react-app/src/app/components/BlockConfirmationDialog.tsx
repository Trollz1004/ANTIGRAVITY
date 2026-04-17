import { Shield, AlertTriangle } from 'lucide-react';

interface BlockConfirmationDialogProps {
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BlockConfirmationDialog({
  targetName,
  onConfirm,
  onCancel,
  isLoading = false,
}: BlockConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="glass-strong glass-highlight w-full max-w-md rounded-[2rem] border-4 border-[#111111] p-6 shadow-[12px_12px_0_0_rgba(17,17,17,1)]">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h3 className="app-title mb-3 text-center">Block {targetName}?</h3>

        <div className="mb-6 space-y-4 rounded-xl bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-bold text-red-800">This action is permanent</p>
              <p className="text-sm text-red-700">
                {targetName} will be removed from your discover feed and
                conversation path. They won't be able to contact you or see your
                profile.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-gray-200"></div>
            <div>
              <p className="font-bold text-gray-800">Reversing this</p>
              <p className="text-sm text-gray-700">
                You can unblock {targetName} later in your privacy settings if
                you change your mind.
              </p>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
