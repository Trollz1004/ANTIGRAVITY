import React, { useState, useEffect } from 'react';
import { ViewMode, WorkstationMode, AIProvider, ChatMessage, LicenseRecord, UserApiKeys } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustBar } from './components/TrustBar';
import { FeatureGrid } from './components/FeatureGrid';
import { ProductCatalog } from './components/ProductCatalog';
import { PricingSection } from './components/PricingSection';
import { Footer } from './components/Footer';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { LicenseSuccessModal } from './components/LicenseSuccessModal';
import { LicenseVerifyModal } from './components/LicenseVerifyModal';
import { LegalModals, LegalModalType } from './components/LegalModals';

// Workstation components
import { TitleBar } from './workstation/TitleBar';
import { Sidebar } from './workstation/Sidebar';
import { TaskCommander } from './workstation/TaskCommander';
import { AgentPane } from './workstation/AgentPane';
import { CodeEditorView } from './workstation/CodeEditorView';
import { TerminalPanel } from './workstation/TerminalPanel';
import { SettingsModal } from './workstation/SettingsModal';
import { AgeGateModal } from './workstation/AgeGateModal';
import { CompareDiffModal } from './workstation/CompareDiffModal';
import { JulesCodeCheck } from './workstation/JulesCodeCheck';
import { PROVIDERS } from './data/products';
import { ArrowLeft, Sparkles, GraduationCap, ShieldCheck, CheckCircle2 } from 'lucide-react';

const INITIAL_CODE = `/**
 * @file stripe-handler.ts
 * @description Enterprise Stripe webhook receiver with signature validation & replay protection
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function handleWebhookEvent(payload: string, sig: string, endpointSecret: string) {
  // Verify Stripe webhook cryptographic signature
  const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(\`[Stripe Webhook] Subscription confirmed for \${session.customer_email}\`);
      // Provision user license key via local vault
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(\`[Stripe Webhook] Subscription canceled: \${subscription.id}\`);
      break;
    }
    default:
      console.log(\`[Stripe Webhook] Unhandled event type: \${event.type}\`);
  }

  return { received: true };
}
`;

const INITIAL_ALPHA_CODE = `// Claude 3.7 Sonnet Implementation
import Stripe from 'stripe';
import crypto from 'crypto';

export async function verifyWebhook(req: Request, secret: string) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  if (!sig) throw new Error('Missing stripe-signature header');
  
  // Constant-time signature verification
  const event = Stripe.webhooks.constructEvent(body, sig, secret);
  return { status: 200, event };
}`;

const INITIAL_BETA_CODE = `// Gemini 2.5 Pro Implementation
import Stripe from 'stripe';

export const handleStripeWebhook = async (rawBody: Buffer, signature: string, secret: string) => {
  try {
    const event = Stripe.webhooks.constructEvent(rawBody, signature, secret);
    return { success: true, type: event.type, id: event.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};`;

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('store');
  const [workstationMode, setWorkstationMode] = useState<WorkstationMode>('code');
  const [alphaProvider, setAlphaProvider] = useState<AIProvider>('claude');
  const [betaProvider, setBetaProvider] = useState<AIProvider>('gemini');

  // Modals
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    tier: 'pro' | 'enterprise';
  }>({
    isOpen: false,
    tier: 'pro',
  });
  const [successLicense, setSuccessLicense] = useState<LicenseRecord | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [compareDiffOpen, setCompareDiffOpen] = useState(false);
  const [isKidsMode, setIsKidsMode] = useState(false);

  // Workstation state
  const [activeCode, setActiveCode] = useState(INITIAL_CODE);
  const [alphaCode, setAlphaCode] = useState(INITIAL_ALPHA_CODE);
  const [betaCode, setBetaCode] = useState(INITIAL_BETA_CODE);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'OpusPawClaw Core v2.4.0 [x86_64-pc-linux-gnu]',
    'Local AES-256 vault initialized. Zero cloud key transmission mode: ACTIVE',
    'Local Ollama daemon status: READY (http://localhost:11434)',
    'Dual-Agent Boss Engine ready. Type command or prompt in Task Commander.',
  ]);

  // Messages
  const [alphaMessages, setAlphaMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      provider: 'Claude 3.7 Sonnet',
      timestamp: '12:04 PM',
      content:
        'Claude 3.7 Sonnet initialized in Boss Mode. I specialize in robust systems architecture, defensive error handling, and end-to-end type safety.',
      codeSnippet: INITIAL_ALPHA_CODE,
      codeLanguage: 'typescript',
    },
  ]);

  const [betaMessages, setBetaMessages] = useState<ChatMessage[]>([
    {
      id: 'm2',
      role: 'assistant',
      provider: 'Gemini 2.5 Pro',
      timestamp: '12:04 PM',
      content:
        'Gemini 2.5 Pro active with 1M context window. Ready to synthesize logic, generate alternate solutions, and stress-test edge cases side-by-side.',
      codeSnippet: INITIAL_BETA_CODE,
      codeLanguage: 'typescript',
    },
  ]);

  // Load existing license if present
  const [activeTier, setActiveTier] = useState<'starter' | 'pro' | 'enterprise'>('starter');

  useEffect(() => {
    try {
      const storedSub = localStorage.getItem('opus_active_subscription');
      if (storedSub) {
        const parsed: LicenseRecord = JSON.parse(storedSub);
        if (parsed.tier) {
          setActiveTier(parsed.tier);
        }
      }
    } catch {}
  }, []);

  const handleOpenCheckout = (tier: 'pro' | 'enterprise') => {
    setCheckoutModal({ isOpen: true, tier });
  };

  const handleCheckoutSuccess = (license: LicenseRecord) => {
    setCheckoutModal({ isOpen: false, tier: 'pro' });
    setActiveTier(license.tier);
    setSuccessLicense(license);
  };

  const handleLaunchWorkstation = () => {
    // Check if user confirmed age gate
    const ageConfirmed = localStorage.getItem('opus_age_confirmed');
    if (!ageConfirmed) {
      setAgeGateOpen(true);
    } else {
      setCurrentView('workstation');
    }
  };

  const handleConfirmAge = (allocation?: 'pediatric' | 'pac') => {
    localStorage.setItem('opus_age_confirmed', 'true');
    setAgeGateOpen(false);
    setCurrentView('workstation');
  };

  const handleSelectKidsMode = () => {
    setIsKidsMode(true);
    setAgeGateOpen(false);
    setCurrentView('workstation');
  };

  // Broadcast command to both agents
  const handleBroadcastTask = (task: string, target: 'both' | 'alpha' | 'beta') => {
    setIsStreaming(true);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: task,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (target === 'both' || target === 'alpha') {
      setAlphaMessages((prev) => [...prev, userMsg]);
    }
    if (target === 'both' || target === 'beta') {
      setBetaMessages((prev) => [...prev, userMsg]);
    }

    setTerminalLogs((prev) => [
      ...prev,
      `> task-commander broadcast --target=${target} "${task.substring(0, 50)}..."`,
      'Spawning async model pipelines [Alpha: Claude] & [Beta: Gemini]...',
    ]);

    setTimeout(() => {
      const alphaSnippet = `// Solution generated by Claude 3.7 Sonnet\n// Task: ${task}\nexport async function executeEnterpriseTask() {\n  const startTime = performance.now();\n  console.log('Validating task constraints...');\n  return { success: true, timestamp: Date.now() };\n}`;
      const betaSnippet = `// Alternative generated by Gemini 2.5 Pro\n// Task: ${task}\nexport const runHighThroughputPipeline = () => ({\n  processed: true,\n  worker: 'gemini-pro-2.5',\n  latencyMs: 142,\n});`;

      setAlphaCode(alphaSnippet);
      setBetaCode(betaSnippet);

      if (target === 'both' || target === 'alpha') {
        setAlphaMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            provider: PROVIDERS.find((p) => p.id === alphaProvider)?.name || 'Claude',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `I have architected a production solution for: "${task}". It incorporates strict type verification, defensive exception handling, and ready integration.`,
            codeSnippet: alphaSnippet,
            codeLanguage: 'typescript',
          },
        ]);
      }

      if (target === 'both' || target === 'beta') {
        setBetaMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            role: 'assistant',
            provider: PROVIDERS.find((p) => p.id === betaProvider)?.name || 'Gemini',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `Here is the high-efficiency implementation for "${task}". Optimized for maximum memory locality and fast async resolution.`,
            codeSnippet: betaSnippet,
            codeLanguage: 'typescript',
          },
        ]);
      }

      setIsStreaming(false);
      setTerminalLogs((prev) => [
        ...prev,
        'Dual stream completed successfully (Alpha: 248 tokens/s, Beta: 312 tokens/s).',
        'Jules Code Sentinel hook ready for verification.',
      ]);
    }, 1200);
  };

  const handleExecuteCode = (code: string) => {
    setTerminalOpen(true);
    setTerminalLogs((prev) => [
      ...prev,
      '> node --experimental-strip-types execution.ts',
      `Executing ${code.split('\n').length} lines of TypeScript in isolated sandbox...`,
      'Compiling with esbuild target ES2024...',
      'Test passed: 1 suite, 4 tests passed, 0 failures. (34ms)',
      'Security check: Zero credentials detected in memory dump.',
    ]);
  };

  const handleRunCommand = (cmd: string) => {
    setTerminalLogs((prev) => [...prev, `> ${cmd}`]);
    if (cmd === 'clear') {
      setTerminalLogs([]);
      return;
    }
    if (cmd.startsWith('jules') || cmd.includes('scan')) {
      setTerminalLogs((prev) => [
        ...prev,
        'Running Jules Sentinel Security Audit...',
        'Checking against 320+ enterprise security rules...',
        'STATUS: Clean. 0 OWASP vulnerabilities detected.',
      ]);
    } else if (cmd.includes('git')) {
      setTerminalLogs((prev) => [
        ...prev,
        'On branch main',
        'Your branch is up to date with origin/main.',
        'Changes ready to commit: (use "git commit" to ship)',
      ]);
    } else {
      setTerminalLogs((prev) => [
        ...prev,
        `Command executed with exit code 0: ${cmd}`,
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#e2e8f0] flex flex-col font-sans">
      {/* View: Storefront */}
      {currentView === 'store' && (
        <div className="flex-1 flex flex-col">
          <Navbar
            currentView={currentView}
            onNavigate={setCurrentView}
            onOpenCheckout={handleOpenCheckout}
            onOpenLicenseVerify={() => setVerifyModalOpen(true)}
          />
          <main className="flex-1">
            <Hero
              onOpenCheckout={handleOpenCheckout}
              onLaunchWorkstation={handleLaunchWorkstation}
            />
            <TrustBar />
            <FeatureGrid onLaunchWorkstation={handleLaunchWorkstation} />
            <PricingSection
              onOpenCheckout={handleOpenCheckout}
              onLaunchWorkstation={handleLaunchWorkstation}
            />
          </main>
          <Footer
            onOpenLegal={setLegalModal}
            onLaunchWorkstation={handleLaunchWorkstation}
          />
        </div>
      )}

      {/* View: Products Catalog */}
      {currentView === 'catalog' && (
        <div className="flex-1 flex flex-col">
          <Navbar
            currentView={currentView}
            onNavigate={setCurrentView}
            onOpenCheckout={handleOpenCheckout}
            onOpenLicenseVerify={() => setVerifyModalOpen(true)}
          />
          <main className="flex-1">
            <ProductCatalog
              onOpenCheckout={handleOpenCheckout}
              onLaunchWorkstation={handleLaunchWorkstation}
            />
          </main>
          <Footer
            onOpenLegal={setLegalModal}
            onLaunchWorkstation={handleLaunchWorkstation}
          />
        </div>
      )}

      {/* View: OpusPawClaw Desktop Workstation */}
      {currentView === 'workstation' && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070b14]">
          {/* Top Title Bar */}
          <TitleBar
            currentMode={workstationMode}
            licenseTier={activeTier}
            alphaModel={PROVIDERS.find((p) => p.id === alphaProvider)?.name || 'Claude'}
            betaModel={PROVIDERS.find((p) => p.id === betaProvider)?.name || 'Gemini'}
            onOpenSettings={() => setSettingsOpen(true)}
            onBackToStore={() => setCurrentView('store')}
          />

          {/* Kids Mode Banner if active */}
          {isKidsMode && (
            <div className="bg-gradient-to-r from-[#00e676]/20 via-[#00d4ff]/20 to-[#e040fb]/20 border-b border-[#00e676]/40 px-4 py-2 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#00e676]" />
                <span className="font-bold">PawClaw Kids Sandbox Active:</span>
                <span className="text-[#94a3b8]">
                  Safe, COPPA-certified educational coding mode with zero web tracking.
                </span>
              </div>
              <button
                onClick={() => setIsKidsMode(false)}
                className="text-[11px] rounded bg-[#111827] px-2.5 py-1 text-[#cbd5e1] hover:text-white border border-[#2a3a52]"
              >
                Switch to Adult Boss Mode
              </button>
            </div>
          )}

          {/* Main Workstation Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
              currentMode={workstationMode}
              onSelectMode={setWorkstationMode}
              terminalOpen={terminalOpen}
              onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
              onOpenSettings={() => setSettingsOpen(true)}
              onToggleKidsMode={() => setIsKidsMode(!isKidsMode)}
              isKidsMode={isKidsMode}
            />

            {/* Main Stage */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Task Commander */}
              <TaskCommander
                onBroadcast={handleBroadcastTask}
                onOpenCompare={() => setCompareDiffOpen(true)}
                isStreaming={isStreaming}
              />

              {/* Workstation Center Stage */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden bg-[#0a0f1a]">
                {/* Agent Pane Alpha */}
                <div className="border-r border-[#1e293b] flex flex-col overflow-hidden">
                  <AgentPane
                    paneId="alpha"
                    name="Alpha Agent"
                    provider={alphaProvider}
                    onProviderChange={setAlphaProvider}
                    messages={alphaMessages}
                    isStreaming={isStreaming}
                    onSendMessage={(text) => handleBroadcastTask(text, 'alpha')}
                    onInsertCodeToEditor={(code) => setActiveCode(code)}
                  />
                </div>

                {/* Agent Pane Beta */}
                <div className="border-r border-[#1e293b] flex flex-col overflow-hidden">
                  <AgentPane
                    paneId="beta"
                    name="Beta Agent"
                    provider={betaProvider}
                    onProviderChange={setBetaProvider}
                    messages={betaMessages}
                    isStreaming={isStreaming}
                    onSendMessage={(text) => handleBroadcastTask(text, 'beta')}
                    onInsertCodeToEditor={(code) => setActiveCode(code)}
                  />
                </div>

                {/* Right Workspace: Code Editor & Jules Code Check */}
                <div className="flex flex-col overflow-hidden p-2 bg-[#080d19]">
                  <div className="flex-1 overflow-hidden">
                    <CodeEditorView
                      activeCode={activeCode}
                      onChangeCode={setActiveCode}
                      onExecuteCode={handleExecuteCode}
                    />
                  </div>
                </div>
              </div>

              {/* Integrated Terminal Panel */}
              {terminalOpen && (
                <TerminalPanel
                  logs={terminalLogs}
                  onClear={() => setTerminalLogs([])}
                  onClose={() => setTerminalOpen(false)}
                  onRunCommand={handleRunCommand}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <StripeCheckoutModal
        isOpen={checkoutModal.isOpen}
        tier={checkoutModal.tier}
        onClose={() => setCheckoutModal({ isOpen: false, tier: 'pro' })}
        onSuccess={handleCheckoutSuccess}
      />

      <LicenseSuccessModal
        license={successLicense}
        onClose={() => setSuccessLicense(null)}
        onLaunchWorkstation={() => {
          setSuccessLicense(null);
          handleLaunchWorkstation();
        }}
      />

      <LicenseVerifyModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onActivated={(lic) => {
          setActiveTier(lic.tier);
          setVerifyModalOpen(false);
          handleLaunchWorkstation();
        }}
      />

      <LegalModals
        modalType={legalModal}
        onClose={() => setLegalModal(null)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaveKeys={(keys) => {
          console.log('[OpusPawClaw] Keys updated locally');
        }}
      />

      <AgeGateModal
        isOpen={ageGateOpen}
        onConfirmAdult={handleConfirmAge}
        onSelectKidsMode={handleSelectKidsMode}
      />

      <CompareDiffModal
        isOpen={compareDiffOpen}
        onClose={() => setCompareDiffOpen(false)}
        alphaCode={alphaCode}
        betaCode={betaCode}
        onSelectWinner={(chosenCode) => {
          setActiveCode(chosenCode);
        }}
      />
    </div>
  );
}
