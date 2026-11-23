// Daily counts: data/ewaste-intake/stats/YYYY-MM-DD.json holds
// { "page_views": n, "page_views_all": n, "bookings": n }.
// Known crawler user agents are excluded from page_views (people) and included
// in page_views_all. No IPs, user agents or cookies are stored, and nothing
// here is exposed over HTTP.

import fs from "node:fs";
import path from "node:path";

const KNOWN_CRAWLER_RE =
  /\b(?:googlebot|adsbot-google|apis-google|mediapartners-google|feedfetcher-google|google-inspectiontool|storebot-google|googleother|bingbot|adidxbot|bingpreview|msnbot|duckduckbot|duckduckgo-favicons-bot|slurp|baiduspider|yandex(?:bot|images|mobilebot|accessibilitybot)?|sogou|exabot|ia_archiver|archive\.org_bot|applebot|qwantify|seznambot|petalbot|yisouspider|bytespider|ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|blexbot|dataforseobot|screaming\s*frog|facebookexternalhit|facebot|meta-external(?:agent|fetcher)|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|pinterestbot|redditbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|ccbot|cohere-ai|amazonbot|youbot|diffbot|omgili|uptimerobot|pingdom|statuscake|site24x7|headlesschrome|phantomjs|playwright|puppeteer|curl|wget|python-requests|python-urllib|aiohttp|httpx|go-http-client|libwww-perl|okhttp|axios|node-fetch|undici)\b|(?:bot|crawler|spider|archiver|scraper)(?:[/\s;);,]|$)/i;

export function isKnownCrawler(userAgent = "") {
  if (typeof userAgent !== "string" || !userAgent.trim()) return false;
  return KNOWN_CRAWLER_RE.test(userAgent);
}

export function dayKey(now = new Date()) {
  // en-CA formats as YYYY-MM-DD; the business day is Florida time.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

function readDayCounts(file) {
  let cur = { page_views: 0, page_views_all: 0, bookings: 0 };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const pageViews = Number(parsed.page_views) || 0;
    const pageViewsAll =
      parsed.page_views_all !== undefined ? Number(parsed.page_views_all) || 0 : pageViews;
    cur = {
      page_views: pageViews,
      page_views_all: pageViewsAll,
      bookings: Number(parsed.bookings) || 0,
    };
  } catch {
    // missing or unreadable: start from zero
  }
  return cur;
}

function writeDayCounts(statsDir, now, updateFn) {
  try {
    fs.mkdirSync(statsDir, { recursive: true });
    const file = path.join(statsDir, `${dayKey(now)}.json`);
    const cur = readDayCounts(file);
    updateFn(cur);
    fs.writeFileSync(file, `${JSON.stringify(cur)}\n`, "utf8");
  } catch {
    // counting must never break a request
  }
}

export function recordPageView(statsDir, nowOrUserAgent = new Date(), maybeUserAgent = "") {
  let now = new Date();
  let userAgent = "";
  if (nowOrUserAgent instanceof Date) {
    now = nowOrUserAgent;
    userAgent =
      typeof maybeUserAgent === "string"
        ? maybeUserAgent
        : maybeUserAgent && typeof maybeUserAgent === "object"
          ? String(maybeUserAgent.userAgent || "")
          : "";
  } else if (typeof nowOrUserAgent === "string") {
    userAgent = nowOrUserAgent;
    now = maybeUserAgent instanceof Date ? maybeUserAgent : new Date();
  } else if (nowOrUserAgent && typeof nowOrUserAgent === "object") {
    now = nowOrUserAgent.now instanceof Date ? nowOrUserAgent.now : new Date();
    userAgent = String(nowOrUserAgent.userAgent || "");
  }
  const crawler = isKnownCrawler(userAgent);
  writeDayCounts(statsDir, now, (cur) => {
    cur.page_views_all += 1;
    if (!crawler) {
      cur.page_views += 1;
    }
  });
}

export const recordBooking = (statsDir, now = new Date()) =>
  writeDayCounts(statsDir, now, (cur) => {
    cur.bookings += 1;
  });
