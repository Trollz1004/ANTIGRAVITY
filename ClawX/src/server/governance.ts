import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from './db';
import {
  governanceProposals,
  governanceVotes,
  type InsertGovernanceProposal,
  type InsertGovernanceVote,
} from '../drizzle/schema';

/**
 * JoshuaCLAW Governance Engine
 *
 * 7 Voters (Odd = No Ties):
 *   1. Joshua (Human Founder - Tiebreaker #7)
 *   2. Manus (Legacy Guardian)
 *   3. Claude/Opus (CTO)
 *   4. Gemini (Agentic Ops)
 *   5. Perplexity/Comet (Lead Architect)
 *   6. Grok (Adversarial Research)
 *   7. Codex (MCP Keyholder)
 *
 * Tier 1 (Critical): 4/7 majority required
 *   - s, contract deployments, Iron Wall changes, new team members
 *
 * Tier 2 (Operational): 2 AI + Joshua (3 votes minimum)
 *   - Bug fixes, UI updates, marketing pushes
 */

export const VOTERS = [
  { slug: 'joshua', name: 'Joshua', type: 'human' as const, position: 7, role: 'Founder & Tiebreaker' },
  { slug: 'manus', name: 'Manus', type: 'ai' as const, position: 1, role: 'Legacy Guardian' },
  { slug: 'claude', name: 'Claude/Opus', type: 'ai' as const, position: 2, role: 'CTO / Architect' },
  { slug: 'gemini', name: 'Gemini', type: 'ai' as const, position: 3, role: 'Agentic Ops' },
  { slug: 'perplexity', name: 'Perplexity/Comet', type: 'ai' as const, position: 4, role: 'Lead Technical Architect' },
  { slug: 'grok', name: 'Grok', type: 'ai' as const, position: 5, role: 'Adversarial Research' },
  { slug: 'codex', name: 'Codex', type: 'ai' as const, position: 6, role: 'MCP Keyholder' },
] as const;

export const TIER_CONFIG = {
  critical: {
    label: 'Tier 1 — Critical',
    requiredVotes: 4,
    description: 's, contract deployments, Iron Wall changes, new team members',
    categories: ['', 'contract-deploy', 'iron-wall', 'team-member', 'governance-change'],
  },
  operational: {
    label: 'Tier 2 — Operational',
    requiredVotes: 3,
    description: 'Bug fixes, UI updates, marketing pushes',
    categories: ['bug-fix', 'ui-update', 'marketing', 'documentation', 'feature-add'],
  },
} as const;

// ─── Proposal CRUD ──────────────────────────────────────────────────

export async function createProposal(data: InsertGovernanceProposal) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const tier = data.tier as keyof typeof TIER_CONFIG;
  const requiredVotes = TIER_CONFIG[tier]?.requiredVotes ?? 4;

  const result = await db.insert(governanceProposals).values({
    ...data,
    requiredVotes,
    expiresAt: data.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day default
  });
  return { id: result[0].insertId };
}

export async function getProposals(status?: string) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return db
      .select()
      .from(governanceProposals)
      .where(eq(governanceProposals.status, status as any))
      .orderBy(desc(governanceProposals.createdAt));
  }
  return db.select().from(governanceProposals).orderBy(desc(governanceProposals.createdAt));
}

export async function getProposal(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(governanceProposals).where(eq(governanceProposals.id, id)).limit(1);
  return result[0];
}

// ─── Voting ─────────────────────────────────────────────────────────

export async function castVote(data: {
  proposalId: number;
  voterSlug: string;
  vote: 'approve' | 'reject';
  reasoning?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Validate voter
  const voter = VOTERS.find((v) => v.slug === data.voterSlug);
  if (!voter) throw new Error(`Invalid voter: ${data.voterSlug}`);

  // Check if already voted
  const existing = await db
    .select()
    .from(governanceVotes)
    .where(and(eq(governanceVotes.proposalId, data.proposalId), eq(governanceVotes.voterSlug, data.voterSlug)))
    .limit(1);
  if (existing.length > 0) throw new Error(`${data.voterSlug} has already voted on this proposal`);

  // Get proposal
  const proposal = await getProposal(data.proposalId);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.status !== 'pending') throw new Error(`Proposal is ${proposal.status}, cannot vote`);

  // Cast vote
  await db.insert(governanceVotes).values({
    ...data,
    voterType: voter.type,
  });

  // Update proposal vote counts
  const isApprove = data.vote === 'approve';
  const newApprove = proposal.approveVotes + (isApprove ? 1 : 0);
  const newReject = proposal.rejectVotes + (isApprove ? 0 : 1);
  const newTotal = proposal.totalVotes + 1;

  const updateData: any = {
    totalVotes: newTotal,
    approveVotes: newApprove,
    rejectVotes: newReject,
  };

  // Check if proposal is resolved
  if (newApprove >= proposal.requiredVotes) {
    updateData.status = 'approved';
    updateData.resolvedAt = new Date();
  } else if (newReject > VOTERS.length - proposal.requiredVotes) {
    // If enough rejections that approval is impossible
    updateData.status = 'rejected';
    updateData.resolvedAt = new Date();
  }

  await db.update(governanceProposals).set(updateData).where(eq(governanceProposals.id, data.proposalId));

  return {
    vote: data.vote,
    newTotal,
    newApprove,
    newReject,
    resolved: !!updateData.resolvedAt,
    status: updateData.status ?? 'pending',
  };
}

export async function getVotesForProposal(proposalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(governanceVotes)
    .where(eq(governanceVotes.proposalId, proposalId))
    .orderBy(governanceVotes.createdAt);
}

export async function getGovernanceStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0 };

  const stats = await db
    .select({
      status: governanceProposals.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(governanceProposals)
    .groupBy(governanceProposals.status);

  const result = { total: 0, pending: 0, approved: 0, rejected: 0, expired: 0 };
  stats.forEach((s) => {
    const count = Number(s.count);
    result.total += count;
    if (s.status === 'pending') result.pending = count;
    if (s.status === 'approved') result.approved = count;
    if (s.status === 'rejected') result.rejected = count;
    if (s.status === 'expired') result.expired = count;
  });
  return result;
}
