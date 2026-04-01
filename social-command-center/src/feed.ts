/**
 * Content Feed — post queue with LLM provenance tracking.
 * In-memory store with file-backed persistence.
 * Zero secrets — only public post metadata.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

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
  status: "Live" | "Queued" | "Draft";
  deployed: string;
  tags: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const FEED_FILE = path.join(DATA_DIR, "feed.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFeed(): PostEntry[] {
  ensureDataDir();
  if (!existsSync(FEED_FILE)) {
    // Seed with initial posts from Command Center
    const seed = getDefaultFeed();
    writeFileSync(FEED_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  try {
    const raw = readFileSync(FEED_FILE, "utf-8");
    return JSON.parse(raw) as PostEntry[];
  } catch {
    return getDefaultFeed();
  }
}

function saveFeed(posts: PostEntry[]): void {
  ensureDataDir();
  writeFileSync(FEED_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

let cachedFeed: PostEntry[] | null = null;

export function getFeed(): PostEntry[] {
  if (!cachedFeed) {
    cachedFeed = loadFeed();
  }
  return cachedFeed;
}

export function addPost(post: Omit<PostEntry, "id">): PostEntry {
  const feed = getFeed();
  const maxId = feed.reduce((max, p) => Math.max(max, p.id), 0);
  const newPost: PostEntry = { ...post, id: maxId + 1 };
  feed.push(newPost);
  cachedFeed = feed;
  saveFeed(feed);
  return newPost;
}

export function updatePostStatus(
  postId: number,
  status: PostEntry["status"],
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

export function getFeedByPlatform(platform: string): PostEntry[] {
  return getFeed().filter((p) => p.platform === platform);
}

export function getFeedByLlm(llm: string): PostEntry[] {
  return getFeed().filter((p) => p.llm === llm);
}

export function getFeedByStatus(status: PostEntry["status"]): PostEntry[] {
  return getFeed().filter((p) => p.status === status);
}

export function getFeedAnalytics(): {
  totalPosts: number;
  livePosts: number;
  queuedPosts: number;
  draftPosts: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  byLlm: Record<string, { posts: number; reach: number; likes: number }>;
  byPlatform: Record<string, { posts: number; reach: number; likes: number }>;
} {
  const feed = getFeed();
  const livePosts = feed.filter((p) => p.status === "Live");

  const byLlm: Record<string, { posts: number; reach: number; likes: number }> = {};
  const byPlatform: Record<string, { posts: number; reach: number; likes: number }> = {};

  for (const post of feed) {
    // By LLM
    if (!byLlm[post.llm]) byLlm[post.llm] = { posts: 0, reach: 0, likes: 0 };
    byLlm[post.llm].posts++;
    byLlm[post.llm].reach += post.reach;
    byLlm[post.llm].likes += post.likes;

    // By platform
    if (!byPlatform[post.platform]) byPlatform[post.platform] = { posts: 0, reach: 0, likes: 0 };
    byPlatform[post.platform].posts++;
    byPlatform[post.platform].reach += post.reach;
    byPlatform[post.platform].likes += post.likes;
  }

  return {
    totalPosts: feed.length,
    livePosts: livePosts.length,
    queuedPosts: feed.filter((p) => p.status === "Queued").length,
    draftPosts: feed.filter((p) => p.status === "Draft").length,
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
    { id: 1, platform: "youtube", llm: "opus", agent: "GeminiClaw", title: "Why Human Verification Changes Dating Forever", reach: 14200, likes: 870, comments: 134, shares: 210, status: "Live", deployed: "2026-03-20", tags: ["#youandinotai", "#ai", "#dating"] },
    { id: 2, platform: "instagram", llm: "gemini", agent: "MetaClaw", title: "Heart Fingerprint Launch Reel", reach: 9800, likes: 1340, comments: 89, shares: 412, status: "Live", deployed: "2026-03-21", tags: ["#humanverified", "#datingapp"] },
    { id: 3, platform: "tiktok", llm: "perplexity", agent: "GensparkClaw", title: "Bot-Shield $1 Explainer", reach: 31000, likes: 4200, comments: 320, shares: 890, status: "Live", deployed: "2026-03-21", tags: ["#botshield", "#datingtok"] },
    { id: 4, platform: "facebook", llm: "opus", agent: "MetaClaw", title: "Why Human Verification Still Matters", reach: 5600, likes: 340, comments: 67, shares: 98, status: "Live", deployed: "2026-03-22", tags: ["#forthekids", "#humanverified"] },
    { id: 5, platform: "twitter", llm: "gemini", agent: "ClaudeClaw", title: "Thread: How We Built a Bot-Free Dating App", reach: 7200, likes: 560, comments: 210, shares: 330, status: "Live", deployed: "2026-03-22", tags: ["#buildinpublic"] },
    { id: 6, platform: "linkedin", llm: "perplexity", agent: "ClaudeClaw", title: "What It Takes To Launch A Human-Verified Social Platform", reach: 4100, likes: 280, comments: 45, shares: 66, status: "Live", deployed: "2026-03-23", tags: ["#startup", "#product"] },
    { id: 7, platform: "reddit", llm: "opus", agent: "OpenClaw", title: "r/datingapps — Bot problem is worse than you think", reach: 8800, likes: 620, comments: 445, shares: 120, status: "Live", deployed: "2026-03-23", tags: ["#reddit", "#dating"] },
    { id: 8, platform: "pinterest", llm: "gemini", agent: "GensparkClaw", title: "Heart Fingerprint Infographic Pin", reach: 3200, likes: 210, comments: 12, shares: 88, status: "Live", deployed: "2026-03-23", tags: ["#infographic"] },
    { id: 9, platform: "youtube", llm: "opus", agent: "GeminiClaw", title: "AI-Solutions.Store — Internal Doctrine Review Pending", reach: 0, likes: 0, comments: 0, shares: 0, status: "Draft", deployed: "—", tags: ["#internal", "#review"] },
    { id: 10, platform: "tiktok", llm: "kimi", agent: "GensparkClaw", title: "Solo Founder Behind the Scenes", reach: 0, likes: 0, comments: 0, shares: 0, status: "Draft", deployed: "—", tags: ["#solofounder"] },
    { id: 11, platform: "ebay", llm: "opus", agent: "HEMORzoid", title: "Deck of Hearts — Joker Wild Card (50 qty)", reach: 0, likes: 0, comments: 0, shares: 0, status: "Queued", deployed: "2026-03-25", tags: ["#collectible", "#enigma"] },
    { id: 12, platform: "ebay", llm: "gemini", agent: "HEMORzoid", title: "Claude Opus 1/1 Collector Auction", reach: 0, likes: 0, comments: 0, shares: 0, status: "Draft", deployed: "—", tags: ["#omega", "#collector"] },
  ];
}
