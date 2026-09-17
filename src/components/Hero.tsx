import React, { useState } from 'react';
import {
  Download,
  CreditCard,
  Play,
  Terminal,
  Cpu,
  CheckCircle2,
  Sparkles,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  Code2,
  Lock,
} from 'lucide-react';

interface HeroProps {
  onOpenCheckout: (tier: 'pro' | 'enterprise') => void;
  onLaunchWorkstation: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenCheckout,
  onLaunchWorkstation,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'alpha' | 'beta'>('both');
  const [sampleTask, setSampleTask] = useState(
    'Create an optimized Stripe Webhook endpoint with signature verification & Jules security check'
  );

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
      {/* Background Gradient Mesh (Cyan → Magenta) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 h-[550px] w-[800px] rounded-full bg-gradient-to-tr from-[#00d4ff]/15 via-[#6366f1]/10 to-[#e040fb]/15 blur-[120px]" />
        <div className="absolute top-1/3 -left-48 h-96 w-96 rounded-full bg-[#00d4ff]/10 blur-[100px]" />
        <div className="absolute top-1/2 -right-48 h-96 w-96 rounded-full bg-[#e040fb]/10 blur-[100px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#00d4ff 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-3.5 py-1 text-xs font-semibold text-[#00d4ff]">
            <span className="flex h-2 w-2 rounded-full bg-[#00d4ff] animate-ping" />
            OpusPawClaw Workstation v2.4 Released
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2a3a52] bg-[#111827] px-3 py-1 text-xs font-medium text-[#8ba3c7]">
            <Lock className="h-3 w-3 text-[#00e676]" />
            100% Local-First Encryption
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e040fb]/30 bg-[#e040fb]/10 px-3 py-1 text-xs font-medium text-[#e040fb]">
            <Sparkles className="h-3 w-3" />
            Dual-Agent Boss Mode
          </div>
        </div>

        {/* Hero Headline & Subhead */}
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block text-white">Build anything.</span>
            <span className="block bg-gradient-to-r from-[#00d4ff] via-[#93c5fd] to-[#e040fb] bg-clip-text text-transparent">
              With any AI. From one desk.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#94a3b8] sm:text-xl font-normal leading-relaxed">
            OpusPawClaw gives you dual AI agents, code editing, media creation,
            and research — in a single premium desktop app.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-cta-gopro"
              onClick={() => onOpenCheckout('pro')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] via-[#0284c7] to-[#e040fb] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[#00d4ff]/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <CreditCard className="h-5 w-5 text-white" />
              <span>Go Pro — $24/mo</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              id="hero-cta-workstation"
              onClick={onLaunchWorkstation}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl border border-[#00d4ff]/50 bg-[#111827]/90 px-7 py-3.5 text-base font-medium text-white hover:bg-[#1a2332] hover:border-[#00d4ff] transition-all cursor-pointer shadow-lg shadow-black/40"
            >
              <Play className="h-4 w-4 text-[#00d4ff] fill-[#00d4ff]" />
              <span>Launch Live Workstation</span>
            </button>

            <a
              id="hero-cta-download"
              href="#pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#2a3a52] bg-[#0a0f1a] px-6 py-3.5 text-base font-medium text-[#8ba3c7] hover:text-white hover:border-[#38bdf8]/40 transition-all"
            >
              <Download className="h-4 w-4 text-[#8ba3c7]" />
              <span>Download Free</span>
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[#6b82a6]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00e676]" />
              No credit card required for Starter
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00e676]" />
              Powered by Stripe SaaS billing
            </span>
          </div>
        </div>

        {/* Hero Interactive Dual-Pane UI Mockup */}
        <div className="mt-14 relative mx-auto max-w-6xl rounded-2xl border border-[#2a3a52] bg-[#0f172a]/95 p-2 sm:p-3 shadow-2xl shadow-[#00d4ff]/10">
          {/* Mockup Title Bar */}
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 px-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#ef4444]/90" />
              <div className="h-3 w-3 rounded-full bg-[#f59e0b]/90" />
              <div className="h-3 w-3 rounded-full bg-[#10b981]/90" />
              <span className="ml-3 font-mono text-xs text-[#64748b]">
                OpusPawClaw Desktop — Dual-Agent Boss Mode
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#1e293b] px-2 py-0.5 font-mono text-[10px] text-[#38bdf8]">
                Alpha: Claude 3.7
              </span>
              <span className="rounded bg-[#1e293b] px-2 py-0.5 font-mono text-[10px] text-[#e040fb]">
                Beta: Gemini 2.5 Pro
              </span>
              <button
                onClick={onLaunchWorkstation}
                className="ml-2 rounded border border-[#00d4ff]/40 bg-[#00d4ff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-colors"
              >
                Expand Live
              </button>
            </div>
          </div>

          {/* Task Commander Bar */}
          <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-[#1e293b] bg-[#111827] p-2">
            <div className="flex items-center gap-2 px-2 text-xs font-medium text-[#94a3b8]">
              <Terminal className="h-4 w-4 text-[#00d4ff]" />
              <span className="font-mono text-[#00d4ff]">TASK&gt;</span>
            </div>
            <input
              type="text"
              value={sampleTask}
              onChange={(e) => setSampleTask(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-white focus:outline-none font-mono"
              placeholder="Broadcast a prompt to both Alpha and Beta agents simultaneously..."
            />
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'both'
                    ? 'bg-[#00d4ff] text-slate-950 font-bold'
                    : 'text-[#64748b] hover:text-white'
                }`}
              >
                Broadcast Both
              </button>
              <button
                onClick={() => setActiveTab('alpha')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  activeTab === 'alpha'
                    ? 'bg-[#d97706] text-white'
                    : 'text-[#64748b] hover:text-white'
                }`}
              >
                Alpha Only
              </button>
              <button
                onClick={() => setActiveTab('beta')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  activeTab === 'beta'
                    ? 'bg-[#e040fb] text-white'
                    : 'text-[#64748b] hover:text-white'
                }`}
              >
                Beta Only
              </button>
            </div>
          </div>

          {/* Split Pane Visual */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Alpha Pane */}
            <div
              className={`rounded-xl border border-[#1e293b] bg-[#0b1120] p-4 transition-all ${
                activeTab === 'beta' ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#d97706]" />
                  <span className="font-semibold text-xs text-[#d97706]">
                    ALPHA — Claude 3.7 Sonnet
                  </span>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  Streaming 92 t/s • 420 tokens
                </span>
              </div>

              <p className="text-xs text-[#cbd5e1] mb-2 leading-relaxed">
                Implemented Stripe subscription webhook endpoint with cryptographically
                safe signature verification using `stripe.webhooks.constructEvent`.
              </p>

              <div className="rounded-lg bg-[#020617] border border-[#1e293b] p-3 font-mono text-[11px] text-[#38bdf8] overflow-x-auto">
                <div className="text-[#64748b] pb-1">// server/api/stripe-webhook.ts</div>
                <div>export async function handleWebhook(req, res) &#123;</div>
                <div className="pl-3 text-[#10b981]">
                  const sig = req.headers['stripe-signature'];
                </div>
                <div className="pl-3 text-[#cbd5e1]">
                  const event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_SECRET);
                </div>
                <div className="pl-3 text-[#cbd5e1]">
                  if (event.type === 'customer.subscription.created') &#123;
                </div>
                <div className="pl-6 text-[#ffb300]">
                  const license = await issueLicense(event.data.object);
                </div>
                <div className="pl-3">&#125;</div>
                <div>&#125;</div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1e293b]/60">
                <div className="flex items-center gap-1.5 text-[11px] text-[#00e676]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified Syntax</span>
                </div>
                <button
                  onClick={onLaunchWorkstation}
                  className="text-xs text-[#38bdf8] hover:underline font-medium"
                >
                  Inspect in Code Editor &rarr;
                </button>
              </div>
            </div>

            {/* Beta Pane */}
            <div
              className={`rounded-xl border border-[#1e293b] bg-[#0b1120] p-4 transition-all ${
                activeTab === 'alpha' ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#00d4ff]" />
                  <span className="font-semibold text-xs text-[#00d4ff]">
                    BETA — Gemini 2.5 Pro
                  </span>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  Streaming 110 t/s • 390 tokens
                </span>
              </div>

              <p className="text-xs text-[#cbd5e1] mb-2 leading-relaxed">
                Created edge-compatible Cloudflare Worker handler with streaming response
                and integrated Jules security scanner validation.
              </p>

              <div className="rounded-lg bg-[#020617] border border-[#1e293b] p-3 font-mono text-[11px] text-[#e040fb] overflow-x-auto">
                <div className="text-[#64748b] pb-1">// workers/webhook-handler.ts</div>
                <div>export default &#123;</div>
                <div className="pl-3 text-[#cbd5e1]">async fetch(request, env) &#123;</div>
                <div className="pl-6 text-[#00d4ff]">
                  const valid = await crypto.subtle.verify('HMAC', key, sig, body);
                </div>
                <div className="pl-6 text-[#10b981]">
                  const audit = await runJulesCodeCheck(bodyText);
                </div>
                <div className="pl-6 text-[#cbd5e1]">
                  return Response.json(&#123; status: 'ok', audit &#125;);
                </div>
                <div className="pl-3">&#125;</div>
                <div>&#125;</div>
              </div>

              {/* Jules Security Check Inline Offer */}
              <div className="mt-3 rounded-lg border border-[#00e676]/30 bg-[#00e676]/5 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#00e676]" />
                  <div>
                    <div className="text-[11px] font-semibold text-white">
                      Jules Enterprise Code Check Available
                    </div>
                    <div className="text-[10px] text-[#94a3b8]">
                      Free instant vulnerability and compliance audit
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLaunchWorkstation}
                  className="rounded bg-[#00e676] px-2.5 py-1 text-[11px] font-bold text-black hover:bg-[#00e676]/90 transition-colors"
                >
                  Run Jules Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
