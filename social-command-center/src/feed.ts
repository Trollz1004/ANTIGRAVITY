/**
 * Content Feed — post queue with LLM provenance tracking.
 * In-memory store with file-backed persistence.
 * Zero secrets — only public post metadata.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export type PostStatus = 'Live' | 'Queued' | 'Draft';
export type ApprovalStatus = 'Not Needed' | 'Pending' | 'Approved' | 'Needs Edit' | 'Rejected';
export type ApprovalChannel = 'discord' | 'telegram' | 'whatsapp' | 'openclaw' | 'n/a';
export type ReviewPriority = 'low' | 'normal' | 'high';

export interface PostEntry {
  id: number;
  platform: string;
  llm: string;
  agent: string;
  title: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  status: PostStatus;
  deployed: string;
  tags: string[];
  approvalStatus: ApprovalStatus;
  approvalChannel: ApprovalChannel;
  approvalRequestedBy: string;
  approver: string;
  reviewPriority: ReviewPriority;
  reviewNotes: string;
  approvalRequestedAt: string;
  approvalReviewedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FEED_FILE = path.join(DATA_DIR, 'feed.json');

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizePostEntry(raw: Partial<PostEntry>): PostEntry {
  return {
    id: raw.id ?? 0,
    platform: raw.platform ?? '',
    llm: raw.llm ?? '',
    agent: raw.agent ?? '',
    title: raw.title ?? '',
    reach: raw.reach ?? 0,
    likes: raw.likes ?? 0,
    comments: raw.comments ?? 0,
    shares: raw.shares ?? 0,
    status: raw.status ?? 'Draft',
    deployed: raw.deployed ?? '—',
    tags: raw.tags ?? [],
    approvalStatus: raw.approvalStatus ?? 'Pending',
    approvalChannel: raw.approvalChannel ?? 'discord',
    approvalRequestedBy: raw.approvalRequestedBy ?? '',
    approver: raw.approver ?? '',
    reviewPriority: raw.reviewPriority ?? 'normal',
    reviewNotes: raw.reviewNotes ?? '',
    approvalRequestedAt: raw.approvalRequestedAt ?? '',
    approvalReviewedAt: raw.approvalReviewedAt ?? '',
  };
}

function loadFeed(): PostEntry[] {
  ensureDataDir();
  if (!existsSync(FEED_FILE)) {
    const seed = getDefaultFeed();
    writeFileSync(FEED_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = readFileSync(FEED_FILE, 'utf-8');
    return (JSON.parse(raw) as Partial<PostEntry>[]).map(normalizePostEntry);
  } catch {
    return getDefaultFeed();
  }
}

function saveFeed(posts: PostEntry[]): void {
  ensureDataDir();
  writeFileSync(FEED_FILE, JSON.stringify(posts, null, 2), 'utf-8');
}

let cachedFeed: PostEntry[] | null = null;

export function getFeed(): PostEntry[] {
  if (!cachedFeed) {
    cachedFeed = loadFeed();
  }
  return cachedFeed;
}

export function addPost(post: Omit<PostEntry, 'id'>): PostEntry {
  const feed = getFeed();
  const maxId = feed.reduce((max, p) => Math.max(max, p.id), 0);
  const newPost = normalizePostEntry({ ...post, id: maxId + 1 });
  feed.push(newPost);
  cachedFeed = feed;
  saveFeed(feed);
  return newPost;
}

export function updatePostStatus(
  postId: number,
  status: PostStatus,
  metrics?: { reach?: number; likes?: number; comments?: number; shares?: number },
): PostEntry | null {
  const feed = getFeed();
  const post = feed.find((p) => p.id === postId);
  if (!post) return null;
  post.status = status;
  if (metrics) {
    if (metrics.reach !== undefined) post.reach = metrics.reach;
    if (metrics.likes !== undefined) post.likes = metrics.likes;
    if (metrics.comments !== undefined) post.comments = metrics.comments;
    if (metrics.shares !== undefined) post.shares = metrics.shares;
  }
  cachedFeed = feed;
  saveFeed(feed);
  return post;
}

export function getApprovalQueue(channel?: ApprovalChannel): PostEntry[] {
  return getFeed().filter((post) => {
    const needsReview = post.approvalStatus === 'Pending' || post.approvalStatus === 'Needs Edit';
    return needsReview && (!channel || post.approvalChannel === channel);
  });
}

export function reviewPost(
  postId: number,
  decision: 'Approved' | 'Needs Edit' | 'Rejected',
  review?: {
    approver?: string;
    reviewNotes?: string;
    approvalChannel?: ApprovalChannel;
  },
): PostEntry | null {
  const feed = getFeed();
  const post = feed.find((p) => p.id === postId);
  if (!post) return null;

  post.approvalStatus = decision;
  post.approver = review?.approver ?? post.approver;
  post.reviewNotes = review?.reviewNotes ?? post.reviewNotes;
  post.approvalChannel = review?.approvalChannel ?? post.approvalChannel;
  post.approvalReviewedAt = new Date().toISOString();

  if (decision === 'Approved' && post.status === 'Draft') {
    post.status = 'Queued';
  }
  if (decision === 'Rejected' || decision === 'Needs Edit') {
    post.status = 'Draft';
  }

  cachedFeed = feed;
  saveFeed(feed);
  return post;
}

export function getFeedByPlatform(platform: string): PostEntry[] {
  return getFeed().filter((p) => p.platform === platform);
}

export function getFeedByLlm(llm: string): PostEntry[] {
  return getFeed().filter((p) => p.llm === llm);
}

export function getFeedByStatus(status: PostStatus): PostEntry[] {
  return getFeed().filter((p) => p.status === status);
}

export function getFeedAnalytics(): {
  totalPosts: number;
  livePosts: number;
  queuedPosts: number;
  draftPosts: number;
  approvalPending: number;
  needsEdit: number;
  rejected: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  byLlm: Record<string, { posts: number; reach: number; likes: number }>;
  byPlatform: Record<string, { posts: number; reach: number; likes: number }>;
} {
  const feed = getFeed();
  const livePosts = feed.filter((p) => p.status === 'Live');

  const byLlm: Record<string, { posts: number; reach: number; likes: number }> = {};
  const byPlatform: Record<string, { posts: number; reach: number; likes: number }> = {};

  for (const post of feed) {
    if (!byLlm[post.llm]) byLlm[post.llm] = { posts: 0, reach: 0, likes: 0 };
    byLlm[post.llm].posts++;
    byLlm[post.llm].reach += post.reach;
    byLlm[post.llm].likes += post.likes;

    if (!byPlatform[post.platform]) byPlatform[post.platform] = { posts: 0, reach: 0, likes: 0 };
    byPlatform[post.platform].posts++;
    byPlatform[post.platform].reach += post.reach;
    byPlatform[post.platform].likes += post.likes;
  }

  return {
    totalPosts: feed.length,
    livePosts: livePosts.length,
    queuedPosts: feed.filter((p) => p.status === 'Queued').length,
    draftPosts: feed.filter((p) => p.status === 'Draft').length,
    approvalPending: feed.filter((p) => p.approvalStatus === 'Pending').length,
    needsEdit: feed.filter((p) => p.approvalStatus === 'Needs Edit').length,
    rejected: feed.filter((p) => p.approvalStatus === 'Rejected').length,
    totalReach: livePosts.reduce((s, p) => s + p.reach, 0),
    totalLikes: livePosts.reduce((s, p) => s + p.likes, 0),
    totalComments: livePosts.reduce((s, p) => s + p.comments, 0),
    totalShares: livePosts.reduce((s, p) => s + p.shares, 0),
    byLlm,
    byPlatform,
  };
}

function getDefaultFeed(): PostEntry[] {
  return [
    normalizePostEntry({
      id: 1,
      platform: 'youtube',
      llm: 'opus',
      agent: 'GeminiClaw',
      title: 'Why Human Verification Changes Dating Forever',
      reach: 14200,
      likes: 870,
      comments: 134,
      shares: 210,
      status: 'Live',
      deployed: '2026-03-20',
      tags: ['#youandinotai', '#ai', '#dating'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 2,
      platform: 'instagram',
      llm: 'gemini',
      agent: 'MetaClaw',
      title: 'Heart Fingerprint Launch Reel',
      reach: 9800,
      likes: 1340,
      comments: 89,
      shares: 412,
      status: 'Live',
      deployed: '2026-03-21',
      tags: ['#humanverified', '#datingapp'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 3,
      platform: 'tiktok',
      llm: 'perplexity',
      agent: 'GensparkClaw',
      title: 'Bot-Shield $1 Explainer',
      reach: 31000,
      likes: 4200,
      comments: 320,
      shares: 890,
      status: 'Live',
      deployed: '2026-03-21',
      tags: ['#botshield', '#datingtok'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 4,
      platform: 'facebook',
      llm: 'opus',
      agent: 'MetaClaw',
      title: 'Why Human Verification Still Matters',
      reach: 5600,
      likes: 340,
      comments: 67,
      shares: 98,
      status: 'Live',
      deployed: '2026-03-22',
      tags: ['#humanverified'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 5,
      platform: 'twitter',
      llm: 'gemini',
      agent: 'ClaudeClaw',
      title: 'Thread: How We Built a Bot-Free Dating App',
      reach: 7200,
      likes: 560,
      comments: 210,
      shares: 330,
      status: 'Live',
      deployed: '2026-03-22',
      tags: ['#buildinpublic'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 6,
      platform: 'linkedin',
      llm: 'perplexity',
      agent: 'ClaudeClaw',
      title: 'What It Takes To Launch A Human-Verified Social Platform',
      reach: 4100,
      likes: 280,
      comments: 45,
      shares: 66,
      status: 'Live',
      deployed: '2026-03-23',
      tags: ['#startup', '#product'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 7,
      platform: 'reddit',
      llm: 'opus',
      agent: 'OpenClaw',
      title: 'r/datingapps — Bot problem is worse than you think',
      reach: 8800,
      likes: 620,
      comments: 445,
      shares: 120,
      status: 'Live',
      deployed: '2026-03-23',
      tags: ['#reddit', '#dating'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 8,
      platform: 'pinterest',
      llm: 'gemini',
      agent: 'GensparkClaw',
      title: 'Heart Fingerprint Infographic Pin',
      reach: 3200,
      likes: 210,
      comments: 12,
      shares: 88,
      status: 'Live',
      deployed: '2026-03-23',
      tags: ['#infographic'],
      approvalStatus: 'Not Needed',
      approvalChannel: 'n/a',
    }),
    normalizePostEntry({
      id: 9,
      platform: 'youtube',
      llm: 'opus',
      agent: 'GeminiClaw',
      title: 'AI-Solutions.Store — Internal Doctrine Review Pending',
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      status: 'Draft',
      deployed: '—',
      tags: ['#internal', '#review'],
      approvalStatus: 'Pending',
      approvalChannel: 'discord',
      approvalRequestedBy: 'Joshua Claw',
      reviewPriority: 'high',
      approvalRequestedAt: '2026-03-24T09:00:00Z',
    }),
    normalizePostEntry({
      id: 10,
      platform: 'tiktok',
      llm: 'kimi',
      agent: 'GensparkClaw',
      title: 'Solo Founder Behind the Scenes',
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      status: 'Draft',
      deployed: '—',
      tags: ['#solofounder'],
      approvalStatus: 'Needs Edit',
      approvalChannel: 'discord',
      approvalRequestedBy: 'Joshua Claw',
      reviewPriority: 'normal',
      reviewNotes: 'Tighten the angle before release.',
      approvalRequestedAt: '2026-03-24T12:00:00Z',
      approvalReviewedAt: '2026-03-24T12:30:00Z',
      approver: 'JoshuaClaw',
    }),
    normalizePostEntry({
      id: 11,
      platform: 'ebay',
      llm: 'opus',
      agent: 'HEMORzoid',
      title: 'Deck of Hearts — Joker Wild Card (50 qty)',
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      status: 'Queued',
      deployed: '2026-03-25',
      tags: ['#collectible', '#enigma'],
      approvalStatus: 'Approved',
      approvalChannel: 'discord',
      approvalRequestedBy: 'Joshua Claw',
      approver: 'JoshuaClaw',
      reviewPriority: 'normal',
      approvalRequestedAt: '2026-03-24T15:00:00Z',
      approvalReviewedAt: '2026-03-24T15:10:00Z',
    }),
    normalizePostEntry({
      id: 12,
      platform: 'ebay',
      llm: 'gemini',
      agent: 'HEMORzoid',
      title: 'Claude Opus 1/1 Collector Auction',
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      status: 'Draft',
      deployed: '—',
      tags: ['#omega', '#collector'],
      approvalStatus: 'Rejected',
      approvalChannel: 'discord',
      approvalRequestedBy: 'Joshua Claw',
      approver: 'JoshuaClaw',
      reviewPriority: 'low',
      reviewNotes: 'Do not release in current form.',
      approvalRequestedAt: '2026-03-24T16:00:00Z',
      approvalReviewedAt: '2026-03-24T16:15:00Z',
    }),
  ];
}
