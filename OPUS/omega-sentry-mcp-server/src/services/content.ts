/**
 * Content generation for social media posts.
 * Returns ready-to-post content for X/Twitter, Reddit, TikTok.
 * Voice: Josh Coleman — direct, blue-collar, no corporate speak.
 */

import { PAYMENT_LINKS, PROTOCOL_OMEGA, ROYAL_FLUSH, PRICING } from "../constants.js";

export interface SocialPost {
  platform: "x" | "reddit" | "tiktok" | "instagram";
  content: string;
  hashtags: string[];
  cta_link: string;
  character_count: number;
}

const X_POSTS: string[] = [
  `47% of dating profiles are bots. We charge $1 to prove you're human. 60% goes to Shriners Children's Hospital. Launching April 4.\n\nyouandinotai.com`,
  `Built a dating app in my garage with AI because I was tired of swiping on bots.\n\n$1 Bot-Shield verification = economic proof of work that bankrupts bot farms.\n\nApril 4. youandinotai.com`,
  `What if every person you matched with was cryptographically verified as human?\n\n$1 entry. 60% to charity. No VC funding. Just an electrician and AI.\n\nyouandinotai.com`,
  `The Royal Flush Draw: Verify for $1, get entered to win $500 + lifetime premium.\n\nRefer a friend = 5 bonus entries.\n\nyouandinotai.com launching April 4`,
  `Dating apps make money from bots. We make money from proving you're not one.\n\n$1 verification. 60% to Shriners. On-chain proof.\n\nyouandinotai.com`,
  `Every $1 Bot-Shield verification:\n- 60¢ → Shriners Children's Hospital\n- 30¢ → V8 verification engine\n- 10¢ → founder ops\n\nAll tracked on Base Mainnet. Not a promise — a protocol.\n\nyouandinotai.com`,
  `I'm an electrician who used AI to build a dating app where bots can't exist.\n\nThe secret: charge $1. Bot farms can't afford $10K for 10K fake profiles.\n\nLaunch: April 4. youandinotai.com`,
  `No AI-generated profiles. No catfish. No "premium" tier to see who liked you.\n\nJust humans who paid $1 to prove they're real.\n\nyouandinotai.com — April 4`,
  `60% of every dollar we make goes to Shriners Children's Hospital.\n\nNot 60% of profits. 60% of revenue. On-chain. Immutable.\n\nCharityRouter100 on Base Mainnet. Verify it yourself.\n\nyouandinotai.com`,
  `The Royal Flush Draw:\n\n🃏 $1 verification = 1 entry\n🃏 Each referral = 5 entries  \n🃏 Prize: $500 cash + lifetime premium\n🃏 Drawing: April 4, 2026\n\nNo cap on entries. youandinotai.com`,
];

const REDDIT_COMMENTS: string[] = [
  `I got so tired of matching with bots that I built something about it. It's a dating app where everyone pays $1 to verify they're human — biometric liveness check, not just a selfie. 60% of the dollar goes to Shriners Children's Hospital. Launching April 4. If you're interested: youandinotai.com`,
  `The bot problem on dating apps is a feature, not a bug. Fake accounts inflate user numbers which keeps investors happy. That's why no one fixes it. We took a different approach — $1 economic friction that makes bot farms unprofitable. youandinotai.com`,
  `Been building a human-verified dating app. The core idea: a $1 "Bot-Shield" verification that makes it economically impossible for bot farms to operate (10K fake profiles = $10K cost with zero ROI). Every verification is logged on-chain for transparency. Check it out: youandinotai.com`,
];

export function getRandomXPost(): SocialPost {
  const content = X_POSTS[Math.floor(Math.random() * X_POSTS.length)]!;
  return {
    platform: "x",
    content,
    hashtags: ["#YouAndINotAI", "#VerifiedHumansOnly", "#ForTheKids", "#DatingApp"],
    cta_link: "https://youandinotai.com",
    character_count: content.length,
  };
}

export function getRandomRedditComment(): SocialPost {
  const content = REDDIT_COMMENTS[Math.floor(Math.random() * REDDIT_COMMENTS.length)]!;
  return {
    platform: "reddit",
    content,
    hashtags: [],
    cta_link: "https://youandinotai.com",
    character_count: content.length,
  };
}

export function getXThread(): SocialPost[] {
  const platform: SocialPost["platform"] = "x";
  const tweets: Array<{ content: string; hashtags: string[]; cta_link: string }> = [
    { content: `THREAD: I'm an electrician. I can't code. But I built a dating app with AI that solves the one problem every app ignores.\n\nBots.`, hashtags: [], cta_link: "https://youandinotai.com" },
    { content: `1/ Up to 47% of dating profiles are fake. Bots, catfish, spam accounts. The big apps don't fix it because inflated user numbers = happy investors.`, hashtags: [], cta_link: "" },
    { content: `2/ So I built Bot-Shield V8. A $1 verification that does 3 things:\n\n- Economic friction (bot farms can't afford $1 x 10K profiles)\n- Biometric liveness check (not a selfie — a live verification)\n- On-chain audit trail (Base Mainnet, public ledger)`, hashtags: [], cta_link: "" },
    { content: `3/ Where does your $1 go?\n\n60c → Shriners Children's Hospital\n30c → V8 verification infrastructure\n10c → founder operations\n\nAll enforced by smart contract. CharityRouter100 on Base Mainnet. Immutable.`, hashtags: [], cta_link: "" },
    { content: `4/ Plus: the Royal Flush Draw.\n\n$1 verification = 1 entry to win $500 cash + lifetime premium.\nRefer a friend who verifies = 5 bonus entries.\nNo cap.\n\nDrawing on launch day: April 4, 2026.`, hashtags: [], cta_link: "" },
    { content: `5/ No VC money. No corporate team. Just an electrician in Florida with Claude AI, a dream, and a garage.\n\nFounding Members: $14.99/mo (locked in — goes to $24.99 after launch).\n\nyouandinotai.com\n\n#ForTheKids #YouAndINotAI`, hashtags: ["#ForTheKids", "#YouAndINotAI"], cta_link: "https://youandinotai.com" },
  ];
  return tweets.map((t): SocialPost => ({ platform, ...t, character_count: t.content.length }));
}

export function getTikTokScript(): string {
  return `[HOOK - 0-3 seconds]
"47% of the people you're swiping on aren't real."

[PROBLEM - 3-10 seconds]
"Every major dating app has a bot problem. And they don't fix it because fake accounts make their numbers look good to investors."

[SOLUTION - 10-20 seconds]
"So I built a dating app where everyone pays $1 to prove they're human. Biometric liveness check. On-chain verification. If you're a bot farm, that's $10,000 for 10,000 fake profiles. The economics don't work."

[CHARITY HOOK - 20-30 seconds]
"And here's the part that matters: 60 cents of every dollar goes directly to Shriners Children's Hospital. Not profits — revenue. Tracked on blockchain. Can't be changed."

[CTA - 30-35 seconds]
"YouAndINotAI.com. Launching April 4th. $1 to verify. $500 Royal Flush Draw for early members. Link in bio."`;
}

export function getAllContent(): {
  x_posts: SocialPost[];
  reddit_comments: SocialPost[];
  x_thread: SocialPost[];
  tiktok_script: string;
} {
  return {
    x_posts: X_POSTS.map((content): SocialPost => ({
      platform: "x",
      content,
      hashtags: ["#YouAndINotAI", "#ForTheKids"],
      cta_link: "https://youandinotai.com",
      character_count: content.length,
    })),
    reddit_comments: REDDIT_COMMENTS.map((content): SocialPost => ({
      platform: "reddit",
      content,
      hashtags: [],
      cta_link: "https://youandinotai.com",
      character_count: content.length,
    })),
    x_thread: getXThread(),
    tiktok_script: getTikTokScript(),
  };
}
