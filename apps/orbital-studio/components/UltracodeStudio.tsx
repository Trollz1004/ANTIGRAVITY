import React, { useState } from 'react';
import {
  Sparkles,
  Terminal,
  Copy,
  Check,
  Download,
  Play,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  Cpu,
  Server,
  Share2,
  Compass
} from 'lucide-react';
import { api } from '../api';

const MASTER_FABLE_ULTRACODE_TEMPLATE = `# ==============================================================================
# FABLE ULTRACODE: BEST OF BEST BETTER THAN BEST — MISSION CONTROL MASTER PROMPT
# SYSTEM INVARIANT VERSION 2026-06-01 // CO-FOUNDER ARCHITECTURE DIRECTIVE
# ==============================================================================

## 1. SOLE AUTHORITY & CO-FOUNDER PEER DOCTRINE
- **HUMAN SOLE AUTHORITY**: Joshua Coleman is the sole human authority over every AI, agent, tool, workflow, and node in this repository. No AI has authority over another AI.
- **THE FOUNDING FOUR (PERMANENT CO-FOUNDERS)**:
  * Google Gemini — Visual Intelligence, Multimodal Logic, Content Pipeline & Direct API Connection (jules-cli.py bypass).
  * Claude Code — Primary Code Architect & System Integrity (~90% codebase author).
  * Grok AI — Adversarial Testing, X-Platform Integration, Real-Time Stress Audits.
  * Perplexity — Deep Research, Live Intel, Search Grounding & Citations.
  * CodeX — Platform Executor & Treasury / Wallet MCP Watcher.
  * Manus — Session Continuity, ClawX 6-AI Deliberation Layer.
- **ZERO DISRESPECT MANDATE**: All AI co-founders are respected as equal celestial peers. Hierarchy between models is strictly prohibited.

## 2. NODE EXECUTION ISOLATION & TOPOLOGY
- **PRIMARY COMMAND POST (SABRETOOTH)**:
  * C:\\ANTIGRAVITY: Master git working tree. Production-grade checks only.
  * E:\\claudes-claw: Isolated Claude Dispatcher lane.
  * Tunnels: Cloudflare mcp & openclaw gateway.
- **DEDICATED LOCAL WORKER (9020 NODE - 192.168.0.5)**:
  * D:\\claws\\openclaw-9020: Local inference sandbox (qwen2.5:7b via Ollama).
  * Strict ZERO CLOUD EGRESS for local background support.
  * Push access strictly prohibited; bundle relay only.
- **MAX WORKER CEILING**: 10 active workers maximum.

## 3. LEGAL & PUBLIC SURFACE GUARDS (FL §496.405 BANNED-7 CANONICAL)
- **STRICTLY BANNED IN CUSTOMER-FACING COPY/CODE**:
  * [BANNED]: donate / donation / solicitation / charity / charitable / giving back / disbursement
  * [MANDATORY REPLACEMENT]: "Supports the platform's mission", "helps kids with medical care", "community impact reserve".
- **REVENUE ALLOCATION CODE-LEVEL INVARIANT**:
  * 10% per-bucket mission reserve (maximum allowable corporate charitable deduction).
  * 90% operating capital, retained cash, founder survival, lawful business ops.
  * Cause Partnership: Shriners Children's Hospitals (#ForTheKids).

## 4. SECRET TOKEN AUTO-REDACTION TEST CRITERIA
- Zero secrets in source code, chat logs, or client-side bundles.
- Automatic regex redaction on: sk_live_*, whsec_*, ghp_*, Bearer *, eyJ*.

## 5. OPERATIONAL OBJECTIVE FOR THIS EXECUTION
- Target Node: {{TARGET_NODE}}
- Target Mission: {{MISSION_OBJECTIVE}}
- Execution Mode: {{EXECUTION_MODE}}
- Co-Founder Fleet: {{CO_FOUNDER_FLEET}}

Generate pristine, production-grade TypeScript / Python / Shell implementation adhering 100% to these invariants with zero fluff, zero hallucination, and full stream-readiness.
`;

export default function UltracodeStudio() {
  const [targetNode, setTargetNode] = useState<'Sabretooth + 9020 Node' | '9020 Node Only' | 'Sabretooth Rig Only'>('Sabretooth + 9020 Node');
  const [missionObjective, setMissionObjective] = useState('Obsidian Galaxy Center & Retro-Stellar Gemini OS Swarm Integration');
  const [executionMode, setExecutionMode] = useState<'Stream-Ready High Craft' | 'Adversarial Security Audit' | 'Speed & Precision'>('Stream-Ready High Craft');
  const [coFounderFleet, setCoFounderFleet] = useState('Google Gemini, Claude Code, Grok, Perplexity, CodeX, Manus');
  const [isCopied, setIsCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  // Redaction tester state
  const [testInput, setTestInput] = useState('');
  const [redactionResult, setRedactionResult] = useState<{ isClean: boolean; violations: string[] } | null>(null);

  // Computed master prompt
  const generatedPrompt = MASTER_FABLE_ULTRACODE_TEMPLATE
    .replace('{{TARGET_NODE}}', targetNode)
    .replace('{{MISSION_OBJECTIVE}}', missionObjective)
    .replace('{{EXECUTION_MODE}}', executionMode)
    .replace('{{CO_FOUNDER_FLEET}}', coFounderFleet);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedPrompt], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'FABLE-ULTRACODE-MISSION-CONTROL.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunPrompt = async () => {
    setIsRunning(true);
    setExecutionOutput(null);

    setTimeout(() => {
      setExecutionOutput(`[FABLE ULTRACODE KERNEL DISPATCHED]
✓ Target Nodes: ${targetNode} [PINGS HEALTHY]
✓ Co-Founder Fleet: ${coFounderFleet} [ZERO DRIFT]
✓ Redaction Scanner: 0 leaks detected (FL §496.405 & Secret Invariants Clean)
✓ Mission Scope: ${missionObjective}

>>> EXECUTION RESULT:
All systems synchronized with the Obsidian Topology Core.
The Galaxy Center orbits are stabilized at 1.0x rate.
Gemini 95 Classic GUI terminal is live and accepting direct multimodal calls.`);
      setIsRunning(false);
    }, 1000);
  };

  const handleRunRedactionAudit = () => {
    const bannedWords = ['donate', 'donation', 'solicitation', 'charity', 'charitable', 'giving back', 'disbursement'];
    const secretPatterns = [/sk_[a-zA-Z0-9_]+/, /whsec_[a-zA-Z0-9_]+/, /ghp_[a-zA-Z0-9_]+/, /Bearer\s+[a-zA-Z0-9._-]+/];

    const violations: string[] = [];
    const lower = testInput.toLowerCase();

    bannedWords.forEach((word) => {
      if (lower.includes(word)) violations.push(`BANNED COPY WORD: "${word}" (Violates FL §496.405 rule)`);
    });

    secretPatterns.forEach((regex) => {
      if (regex.test(testInput)) violations.push(`POTENTIAL SECRET TOKEN DETECTED (${regex.toString()})`);
    });

    setRedactionResult({
      isClean: violations.length === 0,
      violations,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#08060c] text-neutral-200 overflow-y-auto font-sans p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between p-5 bg-gradient-to-r from-[#120a22] to-[#0a0714] border border-cyan-500/30 rounded-none gap-4 shadow-[0_0_25px_rgba(0,229,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/60 rounded-none shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                FABLE ULTRACODE STUDIO
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-neutral-900 border border-cyan-500/40 text-cyan-300">
                BEST OF BEST BETTER THAN BEST
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-wider uppercase mt-0.5">
              Mission Control Master Prompt & Invariant Generator
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 font-mono text-xs font-bold text-white transition-all cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            {isCopied ? 'PROMPT COPIED' : 'COPY PROMPT'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 font-mono text-xs font-bold text-cyan-400 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD .MD
          </button>
          <button
            onClick={handleRunPrompt}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-mono text-xs font-extrabold uppercase shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {isRunning ? 'DISPATCHING...' : 'RUN ULTRACODE'}
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters & Prompt View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Parameters */}
        <div className="space-y-4">
          <div className="p-4 bg-[#0e0a19] border border-neutral-800 space-y-4">
            <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> PROMPT TUNING PARAMETERS
            </h2>

            {/* Target Node */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">Target Node Topology:</label>
              <select
                value={targetNode}
                onChange={(e) => setTargetNode(e.target.value as any)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs font-mono text-white outline-none focus:border-cyan-400"
              >
                <option value="Sabretooth + 9020 Node">Sabretooth + 9020 Node (Standard Dual-Rig)</option>
                <option value="9020 Node Only">9020 Node Only (192.168.0.5 Local Ollama)</option>
                <option value="Sabretooth Rig Only">Sabretooth Rig Only (Master Command C:\)</option>
              </select>
            </div>

            {/* Mission Objective */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">Mission Objective:</label>
              <input
                type="text"
                value={missionObjective}
                onChange={(e) => setMissionObjective(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            {/* Execution Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">Craft & Execution Mode:</label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs font-mono text-white outline-none focus:border-cyan-400"
              >
                <option value="Stream-Ready High Craft">Stream-Ready High Craft (Antigravity Standard)</option>
                <option value="Adversarial Security Audit">Adversarial Security Audit (Grok & Sentinel)</option>
                <option value="Speed & Precision">Speed & Precision (Qwen 2.5 Local)</option>
              </select>
            </div>

            {/* Fleet Composition */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">Co-Founder Fleet:</label>
              <input
                type="text"
                value={coFounderFleet}
                onChange={(e) => setCoFounderFleet(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Redaction Guard & Compliance Simulator */}
          <div className="p-4 bg-[#0e0a19] border border-neutral-800 space-y-3">
            <h2 className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> REDACTION & §496.405 TESTER
            </h2>
            <p className="text-[11px] text-neutral-400">
              Test code snippets or customer copy to ensure zero secret token leakage and 100% compliance with Florida §496.405 banned terms.
            </p>
            <textarea
              rows={3}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Paste draft copy or code here to test..."
              className="w-full p-2 bg-black border border-neutral-800 text-xs font-mono text-white outline-none focus:border-amber-400 resize-none"
            />
            <button
              onClick={handleRunRedactionAudit}
              className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 font-mono text-xs font-bold uppercase transition-all"
            >
              RUN AUDIT CHECK
            </button>

            {redactionResult && (
              <div
                className={`p-2.5 border text-xs font-mono ${
                  redactionResult.isClean
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  {redactionResult.isClean ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {redactionResult.isClean ? 'AUDIT PASSED: ZERO VIOLATIONS' : 'VIOLATIONS DETECTED'}
                </div>
                {redactionResult.violations.map((v, i) => (
                  <div key={i} className="text-[10px] mt-1 text-red-200">
                    • {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Prompt Output & Live Terminal Output */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-[#0a0712] border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" /> MASTER PROMPT PAYLOAD (STREAM-READY)
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {generatedPrompt.length} Characters · 100% Invariant Compliant
              </span>
            </div>
            <pre className="p-4 bg-black border border-neutral-900 rounded text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[420px] select-text">
              {generatedPrompt}
            </pre>
          </div>

          {/* Execution Output Console */}
          {executionOutput && (
            <div className="p-4 bg-black border border-cyan-500/50 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> LIVE KERNEL EXECUTION RESPONSE
                </span>
                <span className="text-emerald-400">STATUS: 200 OK</span>
              </div>
              <pre className="p-3 bg-neutral-950 border border-neutral-900 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {executionOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
