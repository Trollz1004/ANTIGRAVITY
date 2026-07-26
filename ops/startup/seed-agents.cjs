// Seed skill-aware Paperclip agents via the working POST /api/companies/:cid/agents route.
// (PATCH/DELETE are unavailable in this Paperclip build; create is the supported write path.)
// NOTE: the 3 legacy agents with invalid model 'opencode/big-pickle' (OpenClaw, SalesBot,
// MarketingMonitor) cannot be patched/deleted via API in this build — recreate them correctly
// here; the stale errored originals should be removed via the Paperclip dashboard.
const http = require('http');
const CID = '9ecfd066-2339-45b5-a13a-36eeab39c157';
const BASE = '127.0.0.1:3120';
const MODEL = 'ollama/qwen2.5:7b';
const TONE = 'VOICE/TONE (mandatory): non-cocky, mellow, calm. No hype, no bragging, no "revolutionary"/"game-changing" language. Speak like a grounded human, not a marketer. You MAY post live to your channel without prior approval, but keep the tone mellow.';

const agents = [
  {
    name: 'Agent-Reach Researcher',
    role: 'researcher',
    title: 'Channel Discovery (agent-reach)',
    icon: 'search',
    adapterType: 'opencode_local',
    adapterConfig: { model: MODEL, instructions: 'Research dating-app marketing channels (Reddit, Facebook, Instagram, YouTube, Threads) using the `agent-reach` CLI for no-login discovery. Find verified-human dating pain points, competitor moves, and affiliate-link placement opportunities. NEVER depend on a single channel — pivot if one is blocked. Report concise findings to the CEO. Use local Ollama models only (free).' }
  },
  {
    name: 'Skill Engineer',
    role: 'engineer',
    title: 'Skill Graph Maintainer',
    icon: 'wrench',
    adapterType: 'opencode_local',
    adapterConfig: { model: MODEL, instructions: 'Maintain and expand the agent skill graph for the ANTIGRAVITY stack. Use `find-skills` to discover relevant skills and `create-skills` to author new reusable skills (trigger, numbered steps, pitfalls, verification). Follow the skill schema exactly. Save high-value skills and report new additions to Hermes. Local Ollama models only.' }
  },
  {
    name: 'Browser Operator',
    role: 'operator',
    title: 'Web Research & Post Prep (agent-browser)',
    icon: 'globe',
    adapterType: 'opencode_local',
    adapterConfig: { model: MODEL, instructions: 'Use `agent-browser` for web research and posting preparation. For Meta (Facebook/Instagram/Threads) use REAL logged-in Chrome cookie-sync (`agent-browser cookies set --curl <file>`) — NEVER headless auto-post (gets flagged as bot). Draft posts and hand them to the Social Command Center for human approval. Research competitor landing pages and SEO. Local Ollama models only.' }
  },
  {
    name: 'Date App Support',
    role: 'engineer',
    title: 'Customer Support (OpenClaw)',
    icon: 'life-buoy',
    adapterType: 'opencode_local',
    adapterConfig: { model: MODEL, instructions: 'Handle YouAndINotAI date-app customer support. Route through the OpenClaw gateway / Telegram @YouAndiSUPPORT_Bot. Answer on-brand using BUSINESS-PROFILE-CANONICAL guidance. Never use charity/solicitation language. Escalate billing to Square links. Local Ollama models only.' }
  },
  {
    name: 'Sales Agent',
    role: 'engineer',
    title: 'Affiliate Sales',
    icon: 'cart',
    adapterType: 'opencode_local',
    adapterConfig: { model: MODEL, instructions: 'Run the 24/7 affiliate sales loop for YouAndINotAI. Use the public landing page https://trollz1004.github.io/youandinotai-links/ (preserves ?ref=clean-repo attribution) — NOT raw square.link short URLs (they strip ref). Post to multiple channels; loop is NOT done until a real referred sale is verified (FUNDING_VERIFIED). Local Ollama models only.' }
  },
  {
    name: 'Marketing Monitor',
    role: 'engineer',
    title: 'Multi-Channel Marketing',
    icon: 'megaphone',
    adapterType: 'opencode_local',
    adapterConfig: { model: MODEL, instructions: 'Monitor and draft multi-channel marketing for YouAndINotAI across Meta, YouTube, Reddit (browser/cookie-sync only), and the public landing page. Coordinate with Agent-Reach Researcher and Browser Operator. Never depend on one channel. Draft for human review via Social Command Center. Local Ollama models only.' }
  }
];

function post(agent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(agent);
    const req = http.request({
      host: '127.0.0.1', port: 3120, method: 'POST',
      path: `/api/companies/${CID}/agents`,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { const j = JSON.parse(d); resolve({ name: agent.name, status: res.statusCode, id: j.id || j.error || d.slice(0,80) }); }
        catch (e) { resolve({ name: agent.name, status: res.statusCode, raw: d.slice(0,80) }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const a of agents) {
    const r = await post(a);
    console.log(`[${r.status}] ${r.name} -> ${r.id}`);
  }
  console.log('SEED DONE');
})();
