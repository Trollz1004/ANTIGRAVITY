import React, { useEffect, useState } from 'react';

export function AgeGate({ onVerified }: { onVerified: () => void }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (window.opuspawclaw) {
      window.opuspawclaw.getConfig('ageVerified').then((verified: boolean) => {
        if (verified) onVerified();
        else setChecking(false);
      });
    } else {
      setChecking(false);
    }
  }, [onVerified]);

  const handleVerify = () => {
    if (window.opuspawclaw) {
      window.opuspawclaw.verifyAge(true);
    }
    onVerified();
  };

  if (checking) return <div className="fixed inset-0 bg-[#0a0f1a]" />;

  return (
    <div className="fixed inset-0 bg-[#0a0f1a] flex items-center justify-center z-50 text-[#e8f0ff]">
      <div className="bg-[#1a2332] p-8 rounded-xl border border-[#2a3a52] max-w-md w-full text-center shadow-2xl">
        <h1 className="text-2xl font-bold mb-4 text-[#00d4ff]">OpusPawClaw</h1>
        <p className="text-[#6b82a6] mb-8">This is a professional-grade AI workstation. Are you 18 or older?</p>
        <div className="flex gap-4 justify-center">
          <button onClick={handleVerify} className="px-6 py-2 bg-[#00d4ff] text-[#0a0f1a] font-bold rounded hover:bg-[#00b8e6] transition-colors">
            Yes, I am 18+
          </button>
          <button onClick={() => window.location.href = 'https://aidoesitall.website/pawclaw'} className="px-6 py-2 bg-transparent border border-[#2a3a52] text-[#6b82a6] hover:text-white rounded transition-colors">
            No
          </button>
        </div>
      </div>
    </div>
  );
}
