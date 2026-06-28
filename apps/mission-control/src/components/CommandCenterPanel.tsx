import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type PlatformType = 'social' | 'commerce' | 'llm' | 'dispatch' | 'infra';
type PlatformMeta = { label: string; icon: string; color: string; type: PlatformType; claw: string; api: string };
type Agent = { id: string; name: string; role: string; status: 'active' | 'standby'; node: string; color: string; group: string };
type LlmKey = keyof typeof LLM_COLORS;
type PlatformKey = keyof typeof PLATFORMS;
type Post = { id: number; platform: PlatformKey; llm: LlmKey; agent: string; title: string; reach: number; likes: number; comments: number; shares: number; status: 'Live' | 'Queued' | 'Draft'; deployed: string; tags: string[] };

const PLATFORMS = {
  youtube: { label: 'YouTube', icon: '▶️', color: '#FF0000', type: 'social', claw: 'GeminiClaw', api: 'YouTube Data API v3' },
  instagram: { label: 'Instagram', icon: '◈', color: '#E1306C', type: 'social', claw: 'MetaClaw', api: 'Meta Graph API' },
  facebook: { label: 'Facebook', icon: 'ƒ', color: '#1877F2', type: 'social', claw: 'MetaClaw', api: 'Meta Graph API' },
  tiktok: { label: 'TikTok', icon: '♪', color: '#69C9D0', type: 'social', claw: 'GensparkClaw', api: 'TikTok Content API' },
  twitter: { label: 'X / Twitter', icon: '✕', color: '#1DA1F2', type: 'social', claw: 'ClaudeClaw', api: 'X API v2' },
  linkedin: { label: 'LinkedIn', icon: 'in', color: '#0A66C2', type: 'social', claw: 'ClaudeClaw', api: 'LinkedIn Marketing API' },
  reddit: { label: 'Reddit', icon: '🔴', color: '#FF4500', type: 'social', claw: 'OpenClaw', api: 'Reddit API v1' },
  pinterest: { label: 'Pinterest', icon: '📌', color: '#E60023', type: 'social', claw: 'GensparkClaw', api: 'Pinterest API v5' },
  ebay: { label: 'eBay', icon: '🛒', color: '#e53238', type: 'commerce', claw: 'HEMORzoid', api: 'eBay Browse API' },
  square: { label: 'Square', icon: '◼️', color: '#00B388', type: 'commerce', claw: 'HEMORzoid', api: 'Square Commerce API' },
  mercari: { label: 'Mercari', icon: '🏷', color: '#FF4655', type: 'commerce', claw: 'HEMORzoid', api: 'Mercari API' },
  fbmkt: { label: 'FB Marketplace', icon: '🏪', color: '#1877F2', type: 'commerce', claw: 'MetaClaw', api: 'Meta Graph API' },
  opus: { label: 'Opus (Claude)', icon: '⚡️', color: '#a78bfa', type: 'llm', claw: 'Orchestrator', api: 'Anthropic API' },
  gemini: { label: 'Gemini', icon: '✦', color: '#34d399', type: 'llm', claw: 'GeminiClaw', api: 'Google AI Studio' },
  perplexity: { label: 'Perplexity', icon: '◎', color: '#f59e0b', type: 'llm', claw: 'Comet', api: 'Perplexity Sonar Pro' },
  grok: { label: 'Grok', icon: '⬡', color: '#00ccff', type: 'llm', claw: 'Comet', api: 'xAI API' },
  kimi: { label: 'Kimi-K2.5', icon: '🌙', color: '#ff6b9d', type: 'llm', claw: 'Ollama', api: 'Ollama local' },
  qwen: { label: 'qwen2.5', icon: '🐉', color: '#fbbf24', type: 'llm', claw: 'Ollama', api: 'Ollama local' },
  telegram: { label: 'Telegram', icon: '✈️', color: '#2CA5E0', type: 'dispatch', claw: 'ClawdBot', api: 'Telegram Bot API' },
  whatsapp: { label: 'WhatsApp', icon: '💬', color: '#25D366', type: 'dispatch', claw: 'MetaClaw', api: 'WhatsApp Business API' },
  cloudflare: { label: 'Cloudflare', icon: '☁️', color: '#F6821F', type: 'infra', claw: 'Wrangler', api: 'CF Pages + Workers' },
  gcp: { label: 'GCP / GCR', icon: '🔷', color: '#4285F4', type: 'infra', claw: 'Codex', api: 'GCP Cloud Run' },
  qdrant: { label: 'Qdrant Memory', icon: '🧠', color: '#dc2626', type: 'infra', claw: 'Ollama', api: 'Qdrant REST API' },
  github: { label: 'GitHub', icon: '🐙', color: '#94a3b8', type: 'infra', claw: 'Codex', api: 'GitHub API v4' },
} satisfies Record<string, PlatformMeta>;

const LLM_COLORS = { opus: '#a78bfa', gemini: '#34d399', perplexity: '#f59e0b', grok: '#00ccff', kimi: '#ff6b9d', qwen: '#fbbf24' } as const;
const TYPE_ICONS: Record<PlatformType, string> = { social: '📡', commerce: '🛒', llm: '🤖', dispatch: '💬', infra: '☁️' };
const GROUP_COLORS: Record<string, string> = { Orchestrators: '#a78bfa', Research: '#f59e0b', 'Content Claws': '#34d399', Commerce: '#e53238', Watchers: '#475569', 'Ollama Fleet': '#fbbf24', 'ClawX Council': '#818cf8', Dispatch: '#2CA5E0' };

const AGENTS: Agent[] = [
  ['claude', 'Claude (Opus)', 'Strategic Orchestrator', 'active', 'claude.ai', '#a78bfa', 'Orchestrators'],
  ['codex', 'Codex', 'Code Executor', 'active', 'Sabretooth', '#818cf8', 'Orchestrators'],
  ['gemini', 'Gemini', 'UI / Content', 'active', 'Sabretooth', '#34d399', 'Orchestrators'],
  ['perplexity', 'Perplexity / Comet', 'Research + Intel', 'active', 'Manus.space', '#f59e0b', 'Research'],
  ['grok', 'Grok', 'Adversarial Testing', 'active', 'xAI', '#00ccff', 'Research'],
  ['gensparkclaw', 'GensparkClaw', 'Media Content', 'active', 'T5500 E:', '#fb923c', 'Content Claws'],
  ['metaclaw', 'MetaClaw', 'Meta / IG / FB', 'active', 'T5500 E:', '#1877F2', 'Content Claws'],
  ['geminiclaw', 'GeminiClaw', 'YouTube Fleet', 'active', 'T5500 E:', '#34d399', 'Content Claws'],
  ['claudeclaw', 'ClaudeCODECLAW', 'Telegram Overflow', 'active', 'T5500 E:', '#a78bfa', 'Content Claws'],
  ['hemorz', 'HEMORzoid', 'eBay/Square/Mercari', 'active', 'Sabretooth', '#e53238', 'Commerce'],
  ['stoopid', 'Stoopid Crosslister', 'Multi-Platform Listings', 'active', 'Sabretooth', '#ff4655', 'Commerce'],
  ['cupid', 'Cupid', 'Dating App Launch', 'active', 'Sabretooth', '#ec4899', 'Commerce'],
  ['fleetwatcher', 'CodeX-Fleet-Watcher', 'Node Health Monitor', 'active', 'Sabretooth', '#64748b', 'Watchers'],
  ['braincheck', 'CodeX-Brain-Checkpoint', 'Mission Drift Detection', 'active', 'Sabretooth', '#64748b', 'Watchers'],
  ['guardian', 'CodeX-Mission-Guardian', 'Iron Wall Enforcer', 'active', 'Sabretooth', '#64748b', 'Watchers'],
  ['sentry', 'CodeX-Task-Sentry', 'Task Queue Monitor', 'active', 'Sabretooth', '#64748b', 'Watchers'],
  ['safecontrol', 'SABRETOOTH-Safe-Control', 'Node Safety Gate', 'active', 'Sabretooth', '#475569', 'Watchers'],
  ['openclaw', 'OpenClaw Gateway', 'Local LLM Dispatcher', 'active', 'Sabretooth :18789', '#0ea5e9', 'Watchers'],
  ['clawdbot', 'ClawdBot', 'Telegram Bot Gateway', 'active', 'Sabretooth :18789', '#2CA5E0', 'Watchers'],
  ['drafts9020', 'CodeX-9020-Safe-Drafts', 'Remote Draft Queue', 'standby', '9020', '#334155', 'Watchers'],
  ['mktaudit', 'CodeX-T5500-Mkt-Audit', 'Marketing Audit', 'standby', 'T5500', '#334155', 'Watchers'],
  ['ollama_orch', 'Ollama Orchestrator', 'qwen2.5:7b', 'active', 'Sabretooth :11434', '#fbbf24', 'Ollama Fleet'],
  ['ollama_dep', 'Ollama Deployer', 'kimi-k2.5', 'active', 'Sabretooth :11434', '#fbbf24', 'Ollama Fleet'],
  ['ollama_plat', 'Ollama Platforms', 'qwen2.5:7b', 'active', 'Sabretooth :11434', '#fbbf24', 'Ollama Fleet'],
  ['ollama_shr', 'Ollama Shriners', 'kimi-k2.5', 'active', 'Sabretooth :11434', '#fbbf24', 'Ollama Fleet'],
  ['joshuaclaw', 'JoshuaClaw', 'Founder — Permanent Vote', 'active', 'Human', '#ffffff', 'ClawX Council'],
  ['manus', 'Manus', 'META Orchestrator', 'active', 'manus.space', '#34d399', 'ClawX Council'],
  ['clawx_claude', 'ClawX-Claude', 'Architecture + Audit', 'active', 'Anthropic', '#a78bfa', 'ClawX Council'],
  ['clawx_gemini', 'ClawX-Gemini', 'UI + Visual Intel', 'active', 'Google', '#34d399', 'ClawX Council'],
  ['clawx_perp', 'ClawX-Perplexity', 'Research + Intel', 'active', 'Perplexity', '#f59e0b', 'ClawX Council'],
  ['clawx_grok', 'ClawX-Grok', 'Adversarial Testing', 'active', 'xAI', '#00ccff', 'ClawX Council'],
  ['clawx_ollama', 'ClawX-Ollama', 'Local Free Worker', 'active', 'Local', '#fbbf24', 'ClawX Council'],
  ['aisolutionsbot', '@AiSolutionsForTheKids', 'Telegram Dispatch Bot', 'active', 'Telegram', '#2CA5E0', 'Dispatch'],
  ['revenuepack', 'CodeX-Revenue-Pack', 'Revenue Automation', 'standby', 'T5500', '#334155', 'Dispatch'],
].map(([id, name, role, status, node, color, group]) => ({ id, name, role, status, node, color, group })) as Agent[];

const POSTS: Post[] = [
  { id: 1, platform: 'youtube', llm: 'opus', agent: 'GeminiClaw', title: 'Why Human Verification Changes Dating Forever', reach: 14200, likes: 870, comments: 134, shares: 210, status: 'Live', deployed: '2026-03-20', tags: ['#youandinotai', '#ai', '#dating'] },
  { id: 2, platform: 'instagram', llm: 'gemini', agent: 'MetaClaw', title: 'Heart Fingerprint Launch Reel', reach: 9800, likes: 1340, comments: 89, shares: 412, status: 'Live', deployed: '2026-03-21', tags: ['#humanverified', '#datingapp'] },
  { id: 3, platform: 'tiktok', llm: 'perplexity', agent: 'GensparkClaw', title: 'Bot-Shield $1 Explainer', reach: 31000, likes: 4200, comments: 320, shares: 890, status: 'Live', deployed: '2026-03-21', tags: ['#botshield', '#datingtok'] },
  { id: 4, platform: 'facebook', llm: 'opus', agent: 'MetaClaw', title: 'Impact DAO Mission Explainer', reach: 5600, likes: 340, comments: 67, shares: 98, status: 'Live', deployed: '2026-03-22', tags: ['#impact', '#dao'] },
  { id: 5, platform: 'twitter', llm: 'gemini', agent: 'ClaudeClaw', title: 'Thread: How We Built a Bot-Free Dating App', reach: 7200, likes: 560, comments: 210, shares: 330, status: 'Live', deployed: '2026-03-22', tags: ['#buildinpublic'] },
  { id: 6, platform: 'linkedin', llm: 'perplexity', agent: 'ClaudeClaw', title: 'Founding Member Revenue Model Deep-Dive', reach: 4100, likes: 280, comments: 45, shares: 66, status: 'Live', deployed: '2026-03-23', tags: ['#startup', '#dao'] },
  { id: 7, platform: 'reddit', llm: 'opus', agent: 'OpenClaw', title: 'r/datingapps — Bot problem is worse than you think', reach: 8800, likes: 620, comments: 445, shares: 120, status: 'Live', deployed: '2026-03-23', tags: ['#reddit', '#dating'] },
  { id: 8, platform: 'pinterest', llm: 'gemini', agent: 'GensparkClaw', title: 'Heart Fingerprint Infographic Pin', reach: 3200, likes: 210, comments: 12, shares: 88, status: 'Live', deployed: '2026-03-23', tags: ['#infographic'] },
  { id: 9, platform: 'youtube', llm: 'opus', agent: 'GeminiClaw', title: 'Ai-Solutions.Store — DAO Impact Launch', reach: 0, likes: 0, comments: 0, shares: 0, status: 'Queued', deployed: '2026-03-25', tags: ['#impact', '#dao'] },
  { id: 10, platform: 'tiktok', llm: 'kimi', agent: 'GensparkClaw', title: 'Solo Founder Behind the Scenes', reach: 0, likes: 0, comments: 0, shares: 0, status: 'Draft', deployed: '—', tags: ['#solofounder'] },
  { id: 11, platform: 'ebay', llm: 'opus', agent: 'HEMORzoid', title: 'Deck of Hearts — Joker Wild Card (50 qty)', reach: 0, likes: 0, comments: 0, shares: 0, status: 'Queued', deployed: '2026-03-25', tags: ['#collectible', '#enigma'] },
  { id: 12, platform: 'ebay', llm: 'gemini', agent: 'HEMORzoid', title: 'Claude Opus 1/1 Impact Auction', reach: 0, likes: 0, comments: 0, shares: 0, status: 'Queued', deployed: '2026-03-25', tags: ['#omega', '#impact'] },
];

const card = { background: '#12151e', border: '1px solid #1e2535', borderRadius: 10, padding: 16 };

export function CommandCenterPanel() {
  const [tab, setTab] = useState<'feed' | 'analytics' | 'agents' | 'apimap'>('feed');
  const [platFilter, setPlatFilter] = useState<PlatformKey | 'all'>('all');
  const [llmFilter, setLlmFilter] = useState<LlmKey | 'all'>('all');
  const [activePost, setActivePost] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentTarget, setCommentTarget] = useState('post');
  const [comments, setComments] = useState<Record<number, { text: string; target: string; ts: string; author: string }[]>>({});
  const [agentGroup, setAgentGroup] = useState('all');

  const filteredPosts = useMemo(() => POSTS.filter(post => (platFilter === 'all' || post.platform === platFilter) && (llmFilter === 'all' || post.llm === llmFilter)), [platFilter, llmFilter]);
  const totalReach = POSTS.filter(post => post.status === 'Live').reduce((sum, post) => sum + post.reach, 0);
  const totalLikes = POSTS.filter(post => post.status === 'Live').reduce((sum, post) => sum + post.likes, 0);
  const llmReachData = Object.entries(LLM_COLORS).map(([key, color]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), reach: POSTS.filter(post => post.llm === key).reduce((sum, post) => sum + post.reach, 0), posts: POSTS.filter(post => post.llm === key).length, color }));
  const platformGroups: PlatformType[] = ['social', 'commerce', 'llm', 'dispatch', 'infra'];
  const platsByType = platformGroups.map(type => ({ type, platforms: Object.entries(PLATFORMS).filter(([, value]) => value.type === type) }));
  const agentGroups = [...new Set(AGENTS.map(agent => agent.group))];
  const filteredAgents = AGENTS.filter(agent => agentGroup === 'all' || agent.group === agentGroup);

  const badge = (color: string) => ({ padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${color}22`, color });
  const btn = (active: boolean, color = '#a78bfa') => ({ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: active ? color : '#1e2535', color: active ? '#0d0f14' : '#64748b' });
  const submitComment = (postId: number) => {
    if (!commentDraft.trim()) return;
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), { text: commentDraft, target: commentTarget, ts: new Date().toLocaleTimeString(), author: 'Josh / Hermes' }] }));
    setCommentDraft('');
  };

  return (
    <section style={{ fontFamily: 'Inter, sans-serif', background: '#0d0f14', color: '#e2e8f0', border: '1px solid #1e2535', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid #1e2535', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(90deg,#a78bfa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡️ ANTIGRAVITY</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>PAPERWEIGHT Command Center · 34 agents · 24 APIs</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{([['feed', '📡 Feed'], ['analytics', '📊 Analytics'], ['agents', '🤖 Agents'], ['apimap', '🗺 API Map']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} style={btn(tab === key)}>{label}</button>)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 1, background: '#1e2535' }}>{[
        ['📡', totalReach.toLocaleString(), 'Total Reach', '#a78bfa'], ['❤️', totalLikes.toLocaleString(), 'Total Likes', '#E1306C'], ['✓', `${POSTS.filter(post => post.status === 'Live').length} live`, 'Posts', '#34d399'], ['🤖', `${AGENTS.filter(agent => agent.status === 'active').length}/34`, 'Agents Active', '#f59e0b'],
      ].map(([icon, value, label, color]) => <div key={label} style={{ background: '#12151e', padding: '12px 16px', textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color }}>{icon} {value}</div><div style={{ fontSize: 10, color: '#64748b' }}>{label}</div></div>)}</div>

      <div style={{ display: 'flex', minHeight: 560 }}>
        <nav style={{ width: 190, background: '#0a0c12', borderRight: '1px solid #1e2535', overflowY: 'auto', flexShrink: 0, padding: '8px 0' }}>
          <button type="button" onClick={() => setPlatFilter('all')} style={{ ...btn(platFilter === 'all'), width: '100%', borderRadius: 0, borderLeft: platFilter === 'all' ? '3px solid #a78bfa' : '3px solid transparent', textAlign: 'left', padding: '8px 12px' }}>◉ All Platforms</button>
          {platsByType.map(({ type, platforms }) => <div key={type}><div style={{ padding: '8px 12px 4px', fontSize: 9, color: '#475569', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{TYPE_ICONS[type]} {type}</div>{platforms.map(([key, value]) => <button key={key} type="button" onClick={() => setPlatFilter(key as PlatformKey)} style={{ width: '100%', padding: '7px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: platFilter === key ? '#1a1d27' : 'transparent', borderLeft: platFilter === key ? `3px solid ${value.color}` : '3px solid transparent', color: platFilter === key ? '#e2e8f0' : '#64748b', fontSize: 12, textAlign: 'left' }}><span style={{ color: value.color, fontWeight: 800, fontSize: 14, minWidth: 16 }}>{value.icon}</span><span style={{ fontSize: 11 }}>{value.label}</span></button>)}</div>)}
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {tab === 'feed' && <><div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>{(['all', 'opus', 'gemini', 'perplexity', 'grok', 'kimi'] as const).map(key => <button key={key} type="button" onClick={() => setLlmFilter(key)} style={btn(llmFilter === key, key === 'all' ? '#a78bfa' : LLM_COLORS[key])}>{key === 'all' ? 'All LLMs' : key.charAt(0).toUpperCase() + key.slice(1)}</button>)}</div>{filteredPosts.map(post => {
            const platform = PLATFORMS[post.platform];
            const isOpen = activePost === post.id;
            return <article key={post.id} style={{ ...card, marginBottom: 10, border: `1px solid ${isOpen ? '#a78bfa' : '#1e2535'}`, cursor: 'pointer' }} onClick={() => setActivePost(isOpen ? null : post.id)}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18, color: platform.color }}>{platform.icon}</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div><div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{platform.label} · {post.deployed} · <span style={{ color: '#64748b' }}>via {post.agent}</span></div></div><span style={badge(LLM_COLORS[post.llm])}>{post.llm}</span><span style={badge(post.status === 'Live' ? '#34d399' : post.status === 'Queued' ? '#f59e0b' : '#475569')}>{post.status}</span></div><div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 8, borderTop: '1px solid #1a1d27', flexWrap: 'wrap' }}>{([['📡', post.reach.toLocaleString()], ['❤️', post.likes], ['💬', post.comments], ['🔁', post.shares]] as const).map(([icon, value]) => <span key={icon} style={{ fontSize: 12, color: '#94a3b8' }}>{icon} {value}</span>)}<div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>{post.tags.map(tag => <span key={tag} style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, background: '#1e2535', color: '#64748b' }}>{tag}</span>)}</div></div>{isOpen && <div style={{ marginTop: 12, borderTop: '1px solid #1e2535', paddingTop: 12 }} onClick={event => event.stopPropagation()}><div style={{ background: '#0a0c12', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 11 }}><span style={{ color: '#475569' }}>🤖 Created by </span><span style={{ color: LLM_COLORS[post.llm], fontWeight: 700 }}>{post.llm.toUpperCase()}</span><span style={{ color: '#475569' }}> → dispatched via </span><span style={{ color: '#a78bfa', fontWeight: 700 }}>{post.agent}</span><span style={{ color: '#475569' }}> → posted to </span><span style={{ color: platform.color, fontWeight: 700 }}>{platform.label}</span><span style={{ color: '#475569' }}> · API: </span><span style={{ color: '#64748b' }}>{platform.api}</span></div>{(comments[post.id] ?? []).map((comment, index) => <div key={`${comment.ts}-${index}`} style={{ background: '#1a1d27', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 12 }}><span style={{ color: '#a78bfa', fontWeight: 700 }}>{comment.author}</span><span style={{ color: '#475569', fontSize: 10, marginLeft: 8 }}>→ {platform.label} {comment.target} · {comment.ts}</span><div style={{ color: '#e2e8f0', marginTop: 4 }}>{comment.text}</div></div>)}<div style={{ background: '#0a0c12', borderRadius: 10, border: '1px solid #1e2535', padding: 12 }}><div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 800, marginBottom: 8 }}>💬 UNIVERSAL COMMENT COMPOSER — {platform.label}</div><div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>{['post', 'page', 'group', 'thread', 'dm'].map(target => <button key={target} type="button" onClick={() => setCommentTarget(target)} style={btn(commentTarget === target)}>{target}</button>)}</div><textarea value={commentDraft} onChange={event => setCommentDraft(event.target.value)} placeholder={`Draft reply for ${platform.label} ${commentTarget}...`} rows={3} style={{ width: '100%', background: '#12151e', border: '1px solid #1e2535', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} /><div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><button type="button" onClick={() => submitComment(post.id)} style={{ padding: '8px 20px', background: 'linear-gradient(90deg,#a78bfa,#34d399)', border: 'none', borderRadius: 8, color: '#0d0f14', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Stage → {platform.label}</button></div></div></div>}</article>;
          })}</>}

          {tab === 'analytics' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div style={card}><div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 12 }}>🤖 LLM Reach Performance</div><ResponsiveContainer width="100%" height={220}><BarChart data={llmReachData}><CartesianGrid strokeDasharray="3 3" stroke="#1e2535" /><XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} /><YAxis stroke="#64748b" tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: '#12151e', border: '1px solid #1e2535', color: '#e2e8f0', fontSize: 11 }} /><Bar dataKey="reach" radius={[4, 4, 0, 0]}>{llmReachData.map(entry => <Cell key={entry.name} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>{llmReachData.map(entry => <div key={entry.name} style={{ ...card, borderColor: `${entry.color}44` }}><div style={{ fontSize: 14, fontWeight: 800, color: entry.color }}>{entry.name}</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{entry.posts} <span style={{ fontSize: 11, color: '#475569' }}>posts</span></div><div style={{ fontSize: 12, color: '#64748b' }}>{entry.reach.toLocaleString()} reach</div><div style={{ marginTop: 8, height: 4, background: '#1e2535', borderRadius: 4 }}><div style={{ width: `${Math.min(entry.reach / 350, 100)}%`, height: '100%', background: entry.color, borderRadius: 4 }} /></div></div>)}</div></div>}

          {tab === 'agents' && <><div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}><button type="button" onClick={() => setAgentGroup('all')} style={btn(agentGroup === 'all')}>All 34</button>{agentGroups.map(group => <button key={group} type="button" onClick={() => setAgentGroup(group)} style={btn(agentGroup === group, GROUP_COLORS[group])}>{group}</button>)}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>{filteredAgents.map(agent => <article key={agent.id} style={{ ...card, borderColor: `${agent.color}33` }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: agent.status === 'active' ? agent.color : '#334155', flexShrink: 0 }} /><div style={{ fontWeight: 700, fontSize: 12, color: agent.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div></div><div style={{ fontSize: 11, color: '#94a3b8' }}>{agent.role}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>📍 {agent.node}</div><div style={{ marginTop: 6 }}><span style={badge(GROUP_COLORS[agent.group] ?? '#475569')}>{agent.group}</span></div></article>)}</div></>}

          {tab === 'apimap' && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><div style={{ fontSize: 11, color: '#64748b' }}>24 registered API endpoints across all platform types</div>{(['social', 'commerce', 'llm', 'dispatch', 'infra'] as PlatformType[]).map(type => <section key={type} style={card}><div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', marginBottom: 10, textTransform: 'uppercase' }}>{TYPE_ICONS[type]} {type} APIs</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{Object.entries(PLATFORMS).filter(([, value]) => value.type === type).map(([key, value]) => <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#0a0c12', borderRadius: 8, borderLeft: `3px solid ${value.color}` }}><span style={{ color: value.color, fontWeight: 800, fontSize: 16, minWidth: 20 }}>{value.icon}</span><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{value.label}</div><div style={{ fontSize: 10, color: '#475569' }}>{value.api}</div></div><span style={{ fontSize: 10, color: '#64748b', background: '#1e2535', padding: '2px 8px', borderRadius: 6 }}>via {value.claw}</span><span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#34d39922', color: '#34d399' }}>LIVE</span></div>)}</div></section>)}</div>}
        </div>
      </div>
    </section>
  );
}
