/**
 * THE FOUR ORCHESTRATORS — the only agents Mission Control ever needs.
 *
 * Agents are task harnesses, not authorities. Roles live in the canonical
 * C:\ANTIGRAVITY skill catalog and are loaded before planning or delegation.
 * Each harness may execute its assigned scope, preserve evidence, and keep its
 * own repository journal current. See ORCHESTRATOR_CONTRACT — the single
 * contract injected into every orchestrator phase by swarm.ts.
 */
import type { AgentDef, CategoryDef } from './types.js';

export const CATEGORIES: CategoryDef[] = [{ id: 'orchestrators', label: 'ORCHESTRATORS' }];

/**
 * The shared doctrine. One source ("one of everything"), injected verbatim
 * into every plan and validate phase.
 */
export const ORCHESTRATOR_CONTRACT = [
  'HARNESS CONTRACT — Joshua is the sole authority. You execute only the assigned task and do not command another independent agent.',
  '1. PREFLIGHT — read your own repository STATE journal, inspect the active source, then load every task-relevant skill before planning or assigning a subtask. Use i-have-adhd for concise token discipline; use brainstorming, Agent-Reach, browser-use, find-skills, TDD, and systematic debugging when their task conditions apply.',
  '2. PLAN — state the bounded outcome, acceptance evidence, and required skills. Do not delegate work the harness is not smart enough to frame or verify.',
  '3. EXECUTE — perform the assigned scope directly or use an internal subtask only when it improves the result. The harness remains responsible for evidence and does not gain authority over another lane.',
  '4. VALIDATE — judge the result against acceptance criteria by content, not by status. For a failure, investigate root cause before proposing a fix. State exactly what passed and what remains unverified.',
  '5. JOURNAL — your STATE journal is read when a task starts and written when it ends. Record task, skills loaded, evidence, blocker, and one next action.',
  '6. JUDGE GATE — only the designated judge lane may accept a delivery for push, merge, or deletion. If the judge is unavailable, report BLOCKED rather than self-authorizing.',
  '7. ROUTING — normal model work uses authenticated OmniRoute cloud routing. Ollama is explicit fail-safe only. Official-platform governance ballots use their official bridge and never route through OmniRoute.',
  'Claim nothing unverified. If a fact is unverified, label it unverified. Never fabricate data, metrics, or results.',
].join('\n');

export const AGENTS: AgentDef[] = [
  {
    id: 'hermes',
    name: 'HERMES',
    category: 'orchestrators',
    description:
      'Coordinates assigned operational work through its repository journal, the skill catalog, and authenticated OmniRoute. It plans, executes or delegates within scope, verifies by content, and records evidence without claiming authority over another lane.',
    harness:
      'Hermes skill hub · repository journal · Mission Control knowledge/Graphy · authenticated OmniRoute',
    platformId: 'hermes',
    brainExecutor: 'auto',
  },
  {
    id: 'openclaw',
    name: 'OPENCLAW',
    category: 'orchestrators',
    description:
      'Handles assigned engineering, verification, and support work through its repository journal, skill catalog, and authenticated OmniRoute. It verifies service identity rather than trusting a port alone.',
    harness: 'ClawHub registry · repository journal · service-identity verification · authenticated OmniRoute',
    platformId: 'openclaw',
    brainExecutor: 'auto',
  },
  {
    id: 'opencode',
    name: 'OPENCODE',
    category: 'orchestrators',
    description:
      'Handles assigned coding and verification work through its repository journal, the skill catalog, and authenticated OmniRoute cloud routing. It uses systematic debugging for failures and treats Ollama as an explicit fail-safe only.',
    harness: 'OpenCode toolset · repository journal · TDD and systematic debugging · authenticated OmniRoute',
    platformId: 'opencode',
    brainExecutor: 'auto',
  },
];

export const AGENT_INDEX = new Map(AGENTS.map((agent) => [agent.id, agent]));
export const CATEGORY_INDEX = new Map(CATEGORIES.map((c) => [c.id, c]));

// Exactly three active harness lanes. Roles are skills; adding a fourth lane
// without an explicit contract is drift.
if (AGENTS.length !== 3) {
  throw new Error(`Orchestrator roster must be exactly 3 — found ${AGENTS.length}.`);
}
