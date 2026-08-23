import { Database, GitCommit, Search, Server, Shield, Terminal } from "lucide-react";
import React from "react";

export default function MissionControlPipeline() {
  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-slate-700 pb-4 mb-8">
          <h1 className="text-3xl font-serif tracking-tight text-white flex items-center gap-3">
            <Shield className="text-emerald-400" />
            Mission Control: Harness, Judge, and Push Doctrine
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Authority: Joshua Coleman, sole owner. Immutable engineering contract for ANTIGRAVITY repository writes.
          </p>
        </div>

        {/* The One-Sentence Rule */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-3">The One-Sentence Rule</h2>
          <p className="text-lg text-emerald-400 font-medium">
            Harnesses do the work and never push it; judges review the work and are the only actors that push, merge, or delete a branch, and only after tests pass.
          </p>
        </div>

        {/* Roles and Architecture */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Harnesses */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="text-amber-400" />
              <h3 className="text-lg font-bold text-white">Harness Workers</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> Hermes</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> OpenClaw</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> OpenCode</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm">
              <span className="text-amber-400/80 font-bold block mb-1">Constraints:</span>
              Plan, write code, run tests, fix findings, prepare review packet. <br/>
              <span className="text-rose-400 font-bold">NO push rights. NO merge rights. NO branch deletion. NO judging.</span><br/>
              Must use OmniRoute endpoints (Cloud Models). 
              <span className="text-rose-400 font-bold ml-1">Local Models are STRICTLY FORBIDDEN on Sabretooth.</span>
            </div>
          </div>

          {/* Local Auxiliary Models */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Database className="text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Authorized Local Sandbox Models (Ollama)</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-slate-900 p-4 border border-cyan-900 rounded">
                <div className="text-sm font-mono text-cyan-400 font-bold mb-2">joshlcoleman/CFO-Until-No-Kid-In-Need:latest</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div><span className="text-slate-500">Base:</span> Llama 3.2 (3.2B, Q4_K_M)</div>
                  <div><span className="text-slate-500">Role:</span> Architecture-Recovery, Config-Optimization, Deployment-Control</div>
                  <div><span className="text-slate-500">Directives:</span> Financial Compliance (10% floor), Direct Execution, No mock data.</div>
                </div>
              </div>
              <div className="flex-1 text-sm text-slate-300">
                <span className="text-cyan-400/80 font-bold block mb-1">Local Model Constraints:</span>
                Local Ollama inference is <strong className="text-emerald-400">PERMITTED</strong> exclusively on auxiliary or sandbox nodes (e.g., 9020 Node, T5500). <br/><br/>
                They act in a support/recovery capacity only. They have <strong className="text-rose-400">ZERO</strong> authority to act as Judges, and <strong className="text-rose-400">CANNOT</strong> be deployed on the Sabretooth primary command post.
              </div>
            </div>
          </div>

          {/* Judges */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Search className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white">The Judges</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Claude (claude.ai MCP / Max CLI)</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Gemini (Max-reasoning CLI / Pro plan)</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Grok (Account Auth)</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> GitHub Copilot (Capable Model)</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> OpenAI / Codex (Account Auth)</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm">
              <span className="text-emerald-400/80 font-bold block mb-1">Constraints:</span>
              Official, first-party platforms via authenticated account sign-in. <br/>
              Highest reasoning tier CLI bridge. <br/>
              Reviews packet, edits/cleans, approves/denies. 
              <span className="text-emerald-400 font-bold ml-1">ONLY Judges push.</span>
            </div>
          </div>
        </div>

        {/* The Pipeline */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <GitCommit className="text-blue-400" /> 
            Execution Pipeline
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
              <div className="font-mono text-slate-500 font-bold">01</div>
              <div className="text-sm">Josh tasks all three harnesses (Hermes, OpenClaw, OpenCode) with the same objective.</div>
            </div>
            <div className="flex gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
              <div className="font-mono text-slate-500 font-bold">02</div>
              <div className="text-sm">Each harness assigns its subagents a minimum of five skills (test-driven-development, writing-plans, verification-before-completion, requesting-code-review, systematic-debugging).</div>
            </div>
            <div className="flex gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
              <div className="font-mono text-slate-500 font-bold">03</div>
              <div className="text-sm">Harness checks subagents' output internally. Fixes, edits, re-prompts until it stands alone. Prepares review packet.</div>
            </div>
            <div className="flex gap-4 p-3 bg-slate-900/50 rounded border border-slate-700/50">
              <div className="font-mono text-slate-500 font-bold">04</div>
              <div className="text-sm">Judge performs independent validation. Approves or denies. Denials return to harness with reasons.</div>
            </div>
            <div className="flex gap-4 p-3 bg-slate-900/50 rounded border border-emerald-900/50">
              <div className="font-mono text-emerald-500 font-bold">05</div>
              <div className="text-sm text-emerald-200">If Judge approves and test suite passes, Judge pushes, merges, and deletes branch.</div>
            </div>
          </div>
        </div>

        {/* VS Code Token Aliases & Endpoints */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Server className="text-purple-400" />
            VS Code Token Aliases & Active Endpoints
          </h2>
          <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-4">
              <div>
                <div className="text-slate-400 mb-1">VS Code Base Alias</div>
                <div className="bg-slate-900 p-2 rounded border border-slate-700 text-purple-300 overflow-x-auto whitespace-nowrap">
                  http://localhost:20128/api/v1/vscode/REDACTED_OMNIROUTE_VSCODE_TOKEN7911f3/
                </div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">VS Code Models Alias</div>
                <div className="bg-slate-900 p-2 rounded border border-slate-700 text-purple-300 overflow-x-auto whitespace-nowrap">
                  http://localhost:20128/api/v1/vscode/REDACTED_OMNIROUTE_VSCODE_TOKEN7911f3/models
                </div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">VS Code Chat Alias</div>
                <div className="bg-slate-900 p-2 rounded border border-slate-700 text-purple-300 overflow-x-auto whitespace-nowrap">
                  http://localhost:20128/api/v1/vscode/REDACTED_OMNIROUTE_VSCODE_TOKEN7911f3/chat/completions
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-slate-400 mb-1">Local Server (Running)</div>
                <div className="bg-slate-900 p-2 rounded border border-slate-700 text-emerald-300 flex flex-col gap-1">
                  <span>http://localhost:20129/v1</span>
                  <span>192.168.0.8:20129/v1</span>
                  <span>172.30.32.1:20129/v1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
