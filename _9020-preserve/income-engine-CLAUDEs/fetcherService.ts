/**
 * FETCHER lead scanning service for Reddit, Upwork, and Fiverr
 */

export interface FetcherLead {
  source: "reddit" | "upwork" | "fiverr";
  title: string;
  url: string;
  budget: number;
  postedAt: Date;
  deliverable: string;
  estimatedHourlyRate?: number;
  qualified: boolean;
}

const LEAD_QUALIFICATION_RULES = {
  minBudget: 50,
  maxAgeHours: 4,
  requiredKeywords: ["develop", "build", "create", "design", "code", "app", "website"],
};

/**
 * Scan Reddit for qualified leads
 */
export async function scanReddit(): Promise<FetcherLead[]> {
  try {
    // TODO: Implement actual Reddit API scraping
    // This would use PRAW or similar library
    console.log("[FETCHER] Scanning Reddit...");
    return [];
  } catch (error) {
    console.error("[FETCHER] Reddit scan failed:", error);
    return [];
  }
}

/**
 * Scan Upwork for qualified leads
 */
export async function scanUpwork(): Promise<FetcherLead[]> {
  try {
    // TODO: Implement actual Upwork API scraping
    console.log("[FETCHER] Scanning Upwork...");
    return [];
  } catch (error) {
    console.error("[FETCHER] Upwork scan failed:", error);
    return [];
  }
}

/**
 * Scan Fiverr for qualified leads
 */
export async function scanFiverr(): Promise<FetcherLead[]> {
  try {
    // TODO: Implement actual Fiverr API scraping
    console.log("[FETCHER] Scanning Fiverr...");
    return [];
  } catch (error) {
    console.error("[FETCHER] Fiverr scan failed:", error);
    return [];
  }
}

/**
 * Check if a lead meets qualification criteria
 */
export function isQualifiedLead(lead: FetcherLead): boolean {
  // Check budget
  if (lead.budget < LEAD_QUALIFICATION_RULES.minBudget) {
    return false;
  }

  // Check age
  const ageHours =
    (Date.now() - lead.postedAt.getTime()) / (1000 * 60 * 60);
  if (ageHours > LEAD_QUALIFICATION_RULES.maxAgeHours) {
    return false;
  }

  // Check for required keywords
  const hasKeyword = LEAD_QUALIFICATION_RULES.requiredKeywords.some((keyword) =>
    lead.title.toLowerCase().includes(keyword) ||
    lead.deliverable.toLowerCase().includes(keyword)
  );

  return hasKeyword;
}

/**
 * Run a full scan across all platforms
 */
export async function runFullScan(): Promise<FetcherLead[]> {
  const [redditLeads, upworkLeads, fiverrLeads] = await Promise.all([
    scanReddit(),
    scanUpwork(),
    scanFiverr(),
  ]);

  const allLeads = [...redditLeads, ...upworkLeads, ...fiverrLeads];

  // Filter qualified leads
  return allLeads.filter((lead) => {
    const qualified = isQualifiedLead(lead);
    lead.qualified = qualified;
    return qualified;
  });
}

/**
 * Get top picks from leads (highest budget, most recent)
 */
export function getTopPicks(leads: FetcherLead[], limit: number = 5): FetcherLead[] {
  return leads
    .sort((a, b) => {
      // Sort by budget (descending), then by date (most recent first)
      if (b.budget !== a.budget) {
        return b.budget - a.budget;
      }
      return b.postedAt.getTime() - a.postedAt.getTime();
    })
    .slice(0, limit);
}
