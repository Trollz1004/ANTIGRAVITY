/**
 * Paperclip growth engine — research data for the "5 ways to improve
 * Paperclip in marketing / SEO / YouTube (faceless or animated, avatars ok)"
 * directive. Each way is a daily routine with its own topic pool; the
 * rotation engine picks up to 3 items per day per way, no repeats within a
 * window, and the daily batch drafts 3 variants with different 3-tag sets.
 *
 * Pools are seed data: topics are grounded in the Date App's actual product
 * surface (real humans, not AI; city singles scenes; dating discourse).
 */

/** Brand tag — always slot 1 of every 3-tag set. */
export const BRAND_TAG = "#YouAndiNotAI";

/**
 * The five ways. Each has:
 *   id        — stable key, used for the routine key, state file, and output
 *               filename
 *   name      — human name of the way
 *   platform  — where the content lives
 *   angle     — the copy angle for generated variants
 *   pool      — >=6 topics/angles, each with 3+ tags; rotation picks from here
 */
export const WAYS = [
  {
    id: "seo",
    name: "SEO content cluster",
    description: "Long-form keyword articles targeting dating-app search intent; each piece ranks for real queries and carries the human-first promise.",
    platform: "Blog / website",
    angle: "long-form keyword articles that rank for dating-app intent",
    pool: [
      { id: "seo-1", title: "AI profiles on dating apps: how to spot a bot", tags: ["#DatingSEO", "#AIScams", "#OnlineDatingTips"] },
      { id: "seo-2", title: "Best dating apps for people who hate small talk", tags: ["#DatingSEO", "#RealDating", "#DatingApps"] },
      { id: "seo-3", title: "Is dating app burnout real? The 2026 data", tags: ["#DatingSEO", "#DatingBurnout", "#ModernDating"] },
      { id: "seo-4", title: "How to write a dating profile that isn't AI-slop", tags: ["#DatingSEO", "#ProfileTips", "#AuthenticDating"] },
      { id: "seo-5", title: "First date questions that actually work", tags: ["#DatingSEO", "#FirstDate", "#DatingAdvice"] },
      { id: "seo-6", title: "City-by-city: where singles actually meet in 2026", tags: ["#DatingSEO", "#CitySingles", "#MeetLocals"] },
      { id: "seo-7", title: "Ghosting, breadcrumbing, orbiting: the modern-dating dictionary", tags: ["#DatingSEO", "#DatingTerms", "#ModernDating"] },
      { id: "seo-8", title: "Dating app safety: meet in public, verify the human", tags: ["#DatingSEO", "#DatingSafety", "#RealNotAI"] },
    ],
  },
  {
    id: "youtube",
    name: "Faceless YouTube channel",
    description: "Long-form faceless video scripts (voiceover + stock/avatar visuals) that carry the Date App story to YouTube search and browse.",
    platform: "YouTube (faceless, avatar ok)",
    angle: "long-form faceless video scripts — voiceover + stock/avatar visuals",
    pool: [
      { id: "yt-1", title: "I tested 5 dating apps and 4 were full of bots", tags: ["#FacelessYouTube", "#DatingApps", "#AIProfiles"] },
      { id: "yt-2", title: "Why dating apps got worse (and what to do about it)", tags: ["#FacelessYouTube", "#DatingBurnout", "#ModernDating"] },
      { id: "yt-3", title: "The city with the most single people in America", tags: ["#FacelessYouTube", "#CitySingles", "#USMetros"] },
      { id: "yt-4", title: "How AI ruined online dating — and how humans win it back", tags: ["#FacelessYouTube", "#RealNotAI", "#AIScams"] },
      { id: "yt-5", title: "30 first-date horror stories that end well", tags: ["#FacelessYouTube", "#FirstDate", "#DatingStories"] },
      { id: "yt-6", title: "What your dating profile says about you (data analysis)", tags: ["#FacelessYouTube", "#ProfileTips", "#DatingData"] },
      { id: "yt-7", title: "I ranked 10 US cities for singles so you don't have to", tags: ["#FacelessYouTube", "#CitySingles", "#DatingTravel"] },
      { id: "yt-8", title: "The ghosting economy: why people vanish", tags: ["#FacelessYouTube", "#Ghosting", "#DatingPsychology"] },
    ],
  },
  {
    id: "shorts",
    name: "Animated / avatar short-form",
    description: "15-30s animated or avatar scripts with a hook in the first 2 seconds, built for TikTok / Shorts / Reels reach.",
    platform: "TikTok / YouTube Shorts / Reels (animated or avatar)",
    angle: "15-30s animated or avatar scripts with a hook in the first 2 seconds",
    pool: [
      { id: "sh-1", title: "3 signs a profile is AI-generated", tags: ["#Shorts", "#AIProfiles", "#DatingTips"] },
      { id: "sh-2", title: "POV: the algorithm matched you with a bot", tags: ["#Shorts", "#DatingApps", "#RealNotAI"] },
      { id: "sh-3", title: "This city has the most single people (you guessed wrong)", tags: ["#Shorts", "#CitySingles", "#FunFacts"] },
      { id: "sh-4", title: "Rating first-date questions, rapid fire", tags: ["#Shorts", "#FirstDate", "#DatingAdvice"] },
      { id: "sh-5", title: "What ghosting actually means (in 20 seconds)", tags: ["#Shorts", "#Ghosting", "#DatingTerms"] },
      { id: "sh-6", title: "Your profile in 3 filters: which one are you?", tags: ["#Shorts", "#ProfileTips", "#DatingApps"] },
      { id: "sh-7", title: "5 green flags on a dating profile", tags: ["#Shorts", "#DatingTips", "#GreenFlags"] },
      { id: "sh-8", title: "Why real people are quitting dating apps", tags: ["#Shorts", "#RealNotAI", "#DatingBurnout"] },
    ],
  },
  {
    id: "community",
    name: "Community engagement on existing posts",
    description: "Value-first comments on existing dating posts — 3 tags extend a post's reach to more people; no posting, only genuine engagement.",
    platform: "TikTok / Instagram / Reddit comments",
    angle: "value-first comments on existing dating posts — 3 tags extend the post's reach",
    pool: [
      { id: "co-1", title: "AI profile detection threads", tags: ["#RealNotAI", "#AIProfiles", "#DatingTips"] },
      { id: "co-2", title: "City singles scene discussions", tags: ["#CitySingles", "#LocalDating", "#MeetLocals"] },
      { id: "co-3", title: "First date story comment sections", tags: ["#FirstDate", "#DatingStories", "#HowWeMet"] },
      { id: "co-4", title: "Dating app burnout / quitting threads", tags: ["#DatingBurnout", "#ModernDating", "#DatingApps"] },
      { id: "co-5", title: "Profile review / tips threads", tags: ["#ProfileTips", "#AuthenticDating", "#DatingAdvice"] },
      { id: "co-6", title: "Ghosting and modern-dating etiquette threads", tags: ["#Ghosting", "#DatingTerms", "#ModernDating"] },
      { id: "co-7", title: "\"How we met\" success story posts", tags: ["#HowWeMet", "#MetOnline", "#DatingWins"] },
      { id: "co-8", title: "AI / bots ruining apps threads", tags: ["#RealNotAI", "#AIScams", "#DatingApps"] },
    ],
  },
  {
    id: "social-proof",
    name: "Social proof & story marketing",
    description: "How-we-met and real-human success stories that prove the product promise; story formats across Instagram / TikTok / X.",
    platform: "Instagram / TikTok / X story formats",
    angle: "how-we-met and real-human success stories that prove the product promise",
    pool: [
      { id: "sp-1", title: "How we met: the profile that wasn't AI", tags: ["#HowWeMet", "#RealNotAI", "#DatingWins"] },
      { id: "sp-2", title: "First date in [city] that ended in a second date", tags: ["#FirstDate", "#CitySingles", "#DatingStories"] },
      { id: "sp-3", title: "Deleted the apps, then found this", tags: ["#DatingApps", "#RealDating", "#DatingWins"] },
      { id: "sp-4", title: "The anti-catfish success story", tags: ["#RealNotAI", "#AntiCatfish", "#DatingStories"] },
      { id: "sp-5", title: "Two introverts, one profile, one match", tags: ["#HowWeMet", "#RealDating", "#DatingWins"] },
      { id: "sp-6", title: "We met in 2026 without a single AI message", tags: ["#RealNotAI", "#MetOnline", "#DatingWins"] },
      { id: "sp-7", title: "What real humans look like on a dating app", tags: ["#RealDating", "#AuthenticDating", "#DatingApps"] },
      { id: "sp-8", title: "The city swap: matched across 3 time zones", tags: ["#HowWeMet", "#CitySingles", "#DatingStories"] },
    ],
  },
];
