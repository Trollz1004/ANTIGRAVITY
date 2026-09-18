/**
 * SOCIAL COMMAND CENTER (SCC) — the founder-approval gate for everything
 * agents want to publish anywhere off-node.
 *
 * Two halves:
 *  1. TARGETS — the real posting surface catalog. The social entries mirror
 *     ANTIGRAVITY scripts/dashboard-aidoesitall/social_engine/platform_policy.py
 *     (the runtime source of truth the posting engine actually enforces); the
 *     directory entries mirror ops/sales/directory-submissions tracker targets.
 *     Every target is currently draft-only / founder-gated. This file is a
 *     mirror for the board — changing policy means changing platform_policy.py,
 *     not this file.
 *  2. POST QUEUE — agents submit drafts here; nothing is EVER published by this
 *     server. Approval is a founder decision recorded on the queue; the node's
 *     social engine (or the founder by hand) executes approved posts and only
 *     where platform_policy allows live posting.
 *
 * Persistence: server/data/scc-posts.json, atomic writes, same pattern as store.ts.
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SccPost, SccTarget } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const SCC_FILE = join(DATA_DIR, 'scc-posts.json');

// ── Target catalog ───────────────────────────────────────────────────────────
// Social entries: 1:1 with platform_policy.py PLATFORM_POLICY (2026-08-11).
const social = (
  id: string,
  name: string,
  mode: string,
  owner: string,
  reason: string,
): SccTarget => ({
  id,
  name,
  kind: 'social',
  mode,
  livePostAllowed: false,
  owner,
  reason,
});

const directory = (id: string, name: string, url: string): SccTarget => ({
  id,
  name,
  kind: 'directory',
  mode: 'draft_pack_only',
  livePostAllowed: false,
  owner: 'Josh submits by hand from the approved draft pack',
  reason: `Submissions live in ops/sales/directory-submissions; ${url}`,
});

export const SCC_TARGETS: SccTarget[] = [
  social('twitter', 'X / Twitter', 'perplexity_only', 'Perplexity with Josh supervising', 'X posting stays outside node automation.'),
  social('facebook', 'Facebook', 'perplexity_only', 'Perplexity with Josh supervising', 'Facebook posting stays outside node automation.'),
  social('reddit', 'Reddit', 'devvit_or_manual', 'Devvit, Opus, or Perplexity', 'No direct node posting to Reddit.'),
  social('linkedin', 'LinkedIn', 'draft_only', 'Josh manual review or future official API review', 'LinkedIn stays draft-only on nodes.'),
  social('instagram', 'Instagram', 'draft_only', 'Manual', 'Nodes can prepare assets and captions only.'),
  social('threads', 'Threads', 'draft_only', 'Manual', 'Nodes can prepare assets and captions only.'),
  social('tiktok', 'TikTok', 'draft_only', 'Manual', 'Nodes can prepare assets and captions only.'),
  social('pinterest', 'Pinterest', 'draft_only', 'Manual', 'Nodes can prepare assets and copy only.'),
  social('youtube', 'YouTube', 'draft_only', 'Manual', 'Nodes can prepare titles, descriptions, and clip notes only.'),
  social('quora', 'Quora', 'draft_only', 'Manual', 'Nodes can prepare answers only.'),
  social('medium', 'Medium', 'draft_only', 'Manual', 'Nodes can prepare article drafts only.'),
  social('substack', 'Substack', 'draft_only', 'Manual', 'Nodes can prepare newsletter drafts only.'),
  social('producthunt', 'Product Hunt', 'draft_only', 'Manual', 'Launch copy only; no autonomous posting.'),
  social('indiehackers', 'Indie Hackers', 'draft_only', 'Manual', 'Community posting stays human-led.'),
  social('nextdoor', 'Nextdoor', 'draft_only', 'Manual', 'Nodes can prepare local copy only.'),
  social('bluesky', 'Bluesky', 'draft_only', 'Manual', 'No autonomous posting from nodes.'),
  social('mastodon', 'Mastodon', 'draft_only', 'Manual', 'No autonomous posting from nodes.'),
  social('discord', 'Discord', 'draft_only', 'Manual', 'Nodes can prepare community updates only.'),
  social('telegram', 'Telegram', 'draft_only', 'Manual', 'Nodes can prepare community updates only.'),
  social('devto', 'DEV.to', 'draft_only', 'Manual', 'Nodes can prepare article drafts only.'),
  social('hashnode', 'Hashnode', 'draft_only', 'Manual', 'Nodes can prepare article drafts only.'),
  social('ebay', 'eBay', 'listing_pack_only', 'Manual listing publish', 'Nodes build listing packs and exports only.'),
  directory('betalist', 'BetaList', 'https://betalist.com/submit'),
  directory('showhn', 'Show HN', 'https://news.ycombinator.com/submit'),
  directory('alternativeto', 'AlternativeTo', 'https://alternativeto.net/manage-item/'),
  directory('saashub', 'SaaSHub', 'https://www.saashub.com/services/new'),
  directory('startupbase', 'StartupBase', 'https://startupbase.io'),
  directory('launchingnext', 'Launching Next', 'https://www.launchingnext.com/submit/'),
  directory('sideprojectors', 'SideProjectors', 'https://www.sideprojectors.com'),
  directory('uneed', 'Uneed', 'https://www.uneed.best/submit-a-tool'),
];

const TARGET_INDEX = new Map(SCC_TARGETS.map((t) => [t.id, t]));

// ── Post queue with persistence ──────────────────────────────────────────────
interface PersistedScc {
  version: number;
  posts: SccPost[];
}

let posts: SccPost[] = [];
let flushTimer: NodeJS.Timeout | null = null;

export function loadSccState(): void {
  try {
    if (existsSync(SCC_FILE)) {
      const raw = JSON.parse(readFileSync(SCC_FILE, 'utf8')) as PersistedScc;
      posts = Array.isArray(raw.posts) ? raw.posts : [];
    }
  } catch (err) {
    console.error('[scc] Failed to load state, starting empty:', err);
    posts = [];
  }
}

function flush(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${SCC_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify({ version: 1, posts } satisfies PersistedScc, null, 2));
    renameSync(tmp, SCC_FILE);
  } catch (err) {
    // Never break the API on a persistence failure — state stays correct in
    // memory for this process's lifetime — but a silent disk/permission
    // failure here would mean decisions quietly stop surviving a restart.
    console.error('[scc] Flush failed:', err);
  }
}

function persistScc(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 150);
}

export function listTargets(): SccTarget[] {
  return SCC_TARGETS;
}

export function listPosts(): SccPost[] {
  return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function submitPost(input: {
  targetId?: unknown;
  title?: unknown;
  body?: unknown;
  author?: unknown;
}): SccPost {
  const targetId = typeof input.targetId === 'string' ? input.targetId.trim() : '';
  const target = TARGET_INDEX.get(targetId);
  if (!target) throw new Error(`Unknown target '${targetId}'. See /api/scc for the catalog.`);
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!body) throw new Error('Post body is required.');
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : body.slice(0, 60);
  const author = typeof input.author === 'string' && input.author.trim() ? input.author.trim() : 'unattributed-agent';

  const now = new Date().toISOString();
  const post: SccPost = {
    id: randomUUID(),
    targetId: target.id,
    title,
    body,
    author,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  persistScc();
  return post;
}

/** Thrown when a post id doesn't exist, so callers can map it to HTTP 404. */
export class SccPostNotFoundError extends Error {}

export function decidePost(id: string, decision: 'approved' | 'rejected', note?: unknown): SccPost {
  const post = posts.find((p) => p.id === id);
  if (!post) throw new SccPostNotFoundError('Post not found.');
  if (post.status !== 'pending') throw new Error(`Post already ${post.status}.`);
  post.status = decision;
  post.decisionNote = typeof note === 'string' && note.trim() ? note.trim() : undefined;
  post.decidedAt = new Date().toISOString();
  post.updatedAt = post.decidedAt;
  persistScc();
  return post;
}

export function deletePost(id: string): boolean {
  const i = posts.findIndex((p) => p.id === id);
  if (i === -1) return false;
  posts.splice(i, 1);
  persistScc();
  return true;
}

export function sccSummary(): { targets: number; live: number; pending: number } {
  return {
    targets: SCC_TARGETS.length,
    live: SCC_TARGETS.filter((t) => t.livePostAllowed).length,
    pending: posts.filter((p) => p.status === 'pending').length,
  };
}
