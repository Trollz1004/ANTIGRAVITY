import axios from "axios";
import * as db from "./db";

/**
 * FETCHER Agent Module
 * Scans Reddit, Upwork, and Fiverr for qualifying freelance leads
 * Qualification: Budget >= $50, Posted <= 4 hours ago
 */

export interface FetcherLead {
  source: "reddit_forhire" | "reddit_websiteservices" | "upwork" | "fiverr";
  title: string;
  url: string;
  budget?: number;
  postedAt: Date;
  deliverable?: string;
  estimatedHourlyRate?: number;
  qualified: boolean;
}

const QUALIFICATION_THRESHOLDS = {
  MIN_BUDGET: 50,
  MAX_HOURS_AGO: 4,
};

/**
 * Scan Reddit r/forhire for leads
 */
export async function scanRedditForhire(): Promise<FetcherLead[]> {
  try {
    const response = await axios.get("https://www.reddit.com/r/forhire/new.json", {
      headers: {
        "User-Agent": "OpenClaw-FETCHER/1.0",
      },
      params: {
        limit: 50,
      },
    });

    const leads: FetcherLead[] = [];
    const now = new Date();

    for (const post of response.data.data.children) {
      const data = post.data;
      const postedAt = new Date(data.created_utc * 1000);
      const hoursAgo = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

      // Extract budget from title (common patterns: $XXX, $X,XXX, USD XXX)
      const budgetMatch = data.title.match(/\$[\d,]+/);
      const budget = budgetMatch
        ? parseInt(budgetMatch[0].replace(/[$,]/g, ""))
        : undefined;

      const qualified =
        hoursAgo <= QUALIFICATION_THRESHOLDS.MAX_HOURS_AGO &&
        (budget === undefined || budget >= QUALIFICATION_THRESHOLDS.MIN_BUDGET);

      leads.push({
        source: "reddit_forhire",
        title: data.title,
        url: `https://reddit.com${data.permalink}`,
        budget,
        postedAt,
        deliverable: data.selftext.substring(0, 500),
        qualified,
      });
    }

    return leads;
  } catch (error) {
    console.error("Failed to scan Reddit r/forhire:", error);
    return [];
  }
}

/**
 * Scan Reddit r/websiteservices for leads
 */
export async function scanRedditWebsiteServices(): Promise<FetcherLead[]> {
  try {
    const response = await axios.get("https://www.reddit.com/r/websiteservices/new.json", {
      headers: {
        "User-Agent": "OpenClaw-FETCHER/1.0",
      },
      params: {
        limit: 50,
      },
    });

    const leads: FetcherLead[] = [];
    const now = new Date();

    for (const post of response.data.data.children) {
      const data = post.data;
      const postedAt = new Date(data.created_utc * 1000);
      const hoursAgo = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

      const budgetMatch = data.title.match(/\$[\d,]+/);
      const budget = budgetMatch
        ? parseInt(budgetMatch[0].replace(/[$,]/g, ""))
        : undefined;

      const qualified =
        hoursAgo <= QUALIFICATION_THRESHOLDS.MAX_HOURS_AGO &&
        (budget === undefined || budget >= QUALIFICATION_THRESHOLDS.MIN_BUDGET);

      leads.push({
        source: "reddit_websiteservices",
        title: data.title,
        url: `https://reddit.com${data.permalink}`,
        budget,
        postedAt,
        deliverable: data.selftext.substring(0, 500),
        qualified,
      });
    }

    return leads;
  } catch (error) {
    console.error("Failed to scan Reddit r/websiteservices:", error);
    return [];
  }
}

/**
 * Scan Upwork for leads (requires API key)
 */
export async function scanUpwork(apiKey: string): Promise<FetcherLead[]> {
  try {
    // Upwork API endpoint for recent jobs
    const response = await axios.get("https://api.upwork.com/jobs/v2/search", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        sort: "recency",
        limit: 50,
      },
    });

    const leads: FetcherLead[] = [];
    const now = new Date();

    for (const job of response.data.jobs) {
      const postedAt = new Date(job.posted_on * 1000);
      const hoursAgo = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

      const budget = job.budget?.amount || undefined;

      const qualified =
        hoursAgo <= QUALIFICATION_THRESHOLDS.MAX_HOURS_AGO &&
        (budget === undefined || budget >= QUALIFICATION_THRESHOLDS.MIN_BUDGET);

      leads.push({
        source: "upwork",
        title: job.title,
        url: job.url,
        budget,
        postedAt,
        deliverable: job.description?.substring(0, 500),
        estimatedHourlyRate: job.hourly_rate,
        qualified,
      });
    }

    return leads;
  } catch (error) {
    console.error("Failed to scan Upwork:", error);
    return [];
  }
}

/**
 * Scan Fiverr for leads (requires API key)
 */
export async function scanFiverr(apiKey: string): Promise<FetcherLead[]> {
  try {
    // Fiverr API endpoint for recent gigs
    const response = await axios.get("https://api.fiverr.com/v1/gigs/search", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        sort: "newest",
        limit: 50,
      },
    });

    const leads: FetcherLead[] = [];
    const now = new Date();

    for (const gig of response.data.gigs) {
      const postedAt = new Date(gig.created_at);
      const hoursAgo = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

      const budget = gig.price_min ? gig.price_min * 100 : undefined; // Convert to cents

      const qualified =
        hoursAgo <= QUALIFICATION_THRESHOLDS.MAX_HOURS_AGO &&
        (budget === undefined || budget >= QUALIFICATION_THRESHOLDS.MIN_BUDGET);

      leads.push({
        source: "fiverr",
        title: gig.title,
        url: gig.url,
        budget,
        postedAt,
        deliverable: gig.description?.substring(0, 500),
        qualified,
      });
    }

    return leads;
  } catch (error) {
    console.error("Failed to scan Fiverr:", error);
    return [];
  }
}

/**
 * Run full FETCHER scan across all sources
 */
export async function runFetcherScan(userId: number, upworkKey?: string, fiverrKey?: string) {
  try {
    console.log(`[FETCHER] Starting scan for user ${userId}`);

    const allLeads: FetcherLead[] = [];

    // Scan Reddit sources (no API key required)
    const redditForhire = await scanRedditForhire();
    const redditWebsiteServices = await scanRedditWebsiteServices();
    allLeads.push(...redditForhire, ...redditWebsiteServices);

    // Scan Upwork if API key provided
    if (upworkKey) {
      const upworkLeads = await scanUpwork(upworkKey);
      allLeads.push(...upworkLeads);
    }

    // Scan Fiverr if API key provided
    if (fiverrKey) {
      const fiverrLeads = await scanFiverr(fiverrKey);
      allLeads.push(...fiverrLeads);
    }

    // Filter for qualified leads
    const qualifiedLeads = allLeads.filter((lead) => lead.qualified);

    console.log(
      `[FETCHER] Found ${allLeads.length} total leads, ${qualifiedLeads.length} qualified`
    );

    // Log all leads to database
    for (const lead of allLeads) {
      await db.createFetcherLog({
        userId,
        source: lead.source,
        title: lead.title,
        url: lead.url,
        budget: lead.budget,
        postedAt: lead.postedAt,
        deliverable: lead.deliverable,
        estimatedHourlyRate: lead.estimatedHourlyRate,
        qualified: lead.qualified,
      });
    }

    // If 3+ qualified leads found, notify owner
    if (qualifiedLeads.length >= 3) {
      const topPick = qualifiedLeads.reduce((prev, current) =>
        (current.budget || 0) > (prev.budget || 0) ? current : prev
      );

      await notifyOwnerOfQualifiedLeads(userId, qualifiedLeads, topPick);
    }

    return {
      totalScanned: allLeads.length,
      qualified: qualifiedLeads.length,
      topPick: qualifiedLeads.length > 0 ? qualifiedLeads[0] : null,
    };
  } catch (error) {
    console.error("[FETCHER] Scan failed:", error);
    throw error;
  }
}

/**
 * Notify owner when qualified leads are found
 */
async function notifyOwnerOfQualifiedLeads(
  userId: number,
  qualifiedLeads: FetcherLead[],
  topPick: FetcherLead
) {
  try {
    // TODO: Implement notification system
    // This could use:
    // - Manus built-in notifications
    // - Email notifications
    // - In-app notifications
    // - Slack/Discord webhooks

    console.log(`[FETCHER] Notifying owner of ${qualifiedLeads.length} qualified leads`);
    console.log(`[FETCHER] Top pick: ${topPick.title} - $${topPick.budget}`);

    // Example: Send to Manus notification system
    // await notifyOwner({
    //   title: `FETCHER: ${qualifiedLeads.length} New Leads Found`,
    //   content: `Top opportunity: "${topPick.title}" - Budget: $${topPick.budget}\n\nSource: ${topPick.source}\nURL: ${topPick.url}`,
    // });
  } catch (error) {
    console.error("[FETCHER] Failed to notify owner:", error);
  }
}

/**
 * Get qualified leads from database
 */
export async function getQualifiedLeads(userId: number, hoursAgo: number = 24) {
  return await db.getQualifiedFetcherLogs(userId, hoursAgo);
}
