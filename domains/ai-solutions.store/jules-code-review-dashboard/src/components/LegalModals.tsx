import React from 'react';
import { X, Shield, FileText, RefreshCw } from 'lucide-react';

export type LegalModalType = 'privacy' | 'terms' | 'refund' | null;

interface LegalModalsProps {
  modalType: LegalModalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ modalType, onClose }) => {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#2a3a52] bg-[#0f172a] p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748b] hover:bg-[#1e293b] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {modalType === 'privacy' && (
          <div>
            <div className="flex items-center gap-2.5 text-[#00d4ff] mb-2">
              <Shield className="h-6 w-6" />
              <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
            </div>
            <p className="text-xs text-[#64748b] font-mono mb-4">
              Operated by Trash Or Treasure Online Recycler LLC (FL) • Effective 2026
            </p>
            <div className="space-y-4 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
              <p>
                <strong>1. 100% Local-First Architecture:</strong> OpusPawClaw is engineered
                so that user API keys (Anthropic, OpenAI, Google Gemini, xAI, Perplexity, Ollama)
                are saved exclusively inside your encrypted local device storage. Your secret
                keys are never transmitted to, logged by, or retained on our central servers.
              </p>
              <p>
                <strong>2. Data Transmission:</strong> Prompts sent via Bring Your Own Key (BYOK)
                flow directly from your client machine to the designated model provider’s API.
                When utilizing the pooled Enterprise proxy, prompts are forwarded securely
                through isolated edge workers with zero persistent prompt logging.
              </p>
              <p>
                <strong>3. Children’s Privacy (COPPA):</strong> OpusPawClaw is an 18+ desktop
                workstation. We do not knowingly collect personal information from individuals
                under the age of 18. Younger learners are directed to PawClaw, our dedicated
                kid-safe educational platform with strict COPPA compliance and zero external data collection.
              </p>
              <p>
                <strong>4. Analytics & Payments:</strong> We utilize Stripe for secure subscription
                processing. Credit card details are handled directly by Stripe Elements and
                never touch our local application servers.
              </p>
            </div>
          </div>
        )}

        {modalType === 'terms' && (
          <div>
            <div className="flex items-center gap-2.5 text-[#e040fb] mb-2">
              <FileText className="h-6 w-6" />
              <h2 className="text-xl font-bold text-white">Terms of Service</h2>
            </div>
            <p className="text-xs text-[#64748b] font-mono mb-4">
              Trash Or Treasure Online Recycler LLC • aidoesitall.website
            </p>
            <div className="space-y-4 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
              <p>
                <strong>1. License Grant:</strong> Subscriptions grant a non-exclusive, revocable
                license to use OpusPawClaw on desktop and web environments. Each seat is intended
                for individual developer use according to the chosen tier.
              </p>
              <p>
                <strong>2. Acceptable Use:</strong> You agree not to utilize OpusPawClaw to generate
                harmful, malicious, or non-consensual software exploits. Security scanning via
                Jules Code Sentinel is intended for defensive verification and code hardening.
              </p>
              <p>
                <strong>3. Age Verification:</strong> You represent and warrant that you are at
                least 18 years of age. Users under 18 must use PawClaw.
              </p>
              <p>
                <strong>4. Disclaimer of Warranty:</strong> The software is provided "as is"
                without warranty of any kind. AI models can produce hallucinations; developers
                are solely responsible for testing and validating any code before production deployment.
              </p>
            </div>
          </div>
        )}

        {modalType === 'refund' && (
          <div>
            <div className="flex items-center gap-2.5 text-[#ffb300] mb-2">
              <RefreshCw className="h-6 w-6" />
              <h2 className="text-xl font-bold text-white">Refund Policy</h2>
            </div>
            <p className="text-xs text-[#64748b] font-mono mb-4">
              Trash Or Treasure Online Recycler LLC
            </p>
            <div className="space-y-4 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
              <p>
                <strong>14-Day Money-Back Guarantee:</strong> If OpusPawClaw Pro does not fit
                your engineering workflow, contact our support team within 14 days of your initial
                subscription charge for a full, hassle-free refund processed via Stripe.
              </p>
              <p>
                <strong>Cancellation:</strong> You may cancel your subscription at any time with
                one click. Your license remains active until the end of your paid billing period,
                with no automatic renewals after cancellation.
              </p>
              <p>
                <strong>Support Contact:</strong> Reach our team directly at{' '}
                <span className="text-[#00d4ff] font-mono">support@aidoesitall.website</span> or via
                Twitter <span className="text-[#00d4ff]">@youandinotai</span>.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-[#1e293b] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#1e293b] px-5 py-2 text-xs font-semibold text-white hover:bg-[#2a3a52] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
