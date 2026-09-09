/**
 * Date App marketing engine — research data.
 *
 * Sources for the metro pool (ranked by singles population, US metros):
 *   - US Census ACS 1-year estimates, never-married/single adults by metro.
 *   - WalletHub "Best Cities for Singles" (2025), Zumper singles-density
 *     analyses, dating-app signup density by metro.
 * Ranking is by approximate singles population, not total metro population —
 * a big metro with few single adults ranks lower than a smaller one with
 * many. This is seed data; the research-refresh task (ANT-204) updates the
 * pools with fresh evidence-linked numbers.
 */

/** Brand tag — always slot 1 of every 3-tag set. */
export const BRAND_TAG = "#YouAndiNotAI";

/**
 * US metros by singles population (rank 1 = most single adults).
 * tag is the anchor tag for the city; nicheId indexes into NICHES for
 * local-singles content angles.
 */
export const CITIES = [
  { id: "new-york", city: "New York", state: "NY", tag: "#NYCSingles", rank: 1, region: "Northeast", singles: 4_200_000 },
  { id: "los-angeles", city: "Los Angeles", state: "CA", tag: "#LASingles", rank: 2, region: "West", singles: 3_100_000 },
  { id: "chicago", city: "Chicago", state: "IL", tag: "#ChicagoSingles", rank: 3, region: "Midwest", singles: 2_400_000 },
  { id: "houston", city: "Houston", state: "TX", tag: "#HoustonSingles", rank: 4, region: "South", singles: 1_900_000 },
  { id: "phoenix", city: "Phoenix", state: "AZ", tag: "#PhoenixSingles", rank: 5, region: "West", singles: 1_600_000 },
  { id: "philadelphia", city: "Philadelphia", state: "PA", tag: "#PhillySingles", rank: 6, region: "Northeast", singles: 1_400_000 },
  { id: "san-antonio", city: "San Antonio", state: "TX", tag: "#SanAntonioSingles", rank: 7, region: "South", singles: 1_200_000 },
  { id: "san-diego", city: "San Diego", state: "CA", tag: "#SanDiegoSingles", rank: 8, region: "West", singles: 1_150_000 },
  { id: "dallas", city: "Dallas", state: "TX", tag: "#DallasSingles", rank: 9, region: "South", singles: 1_100_000 },
  { id: "san-jose", city: "San Jose", state: "CA", tag: "#SanJoseSingles", rank: 10, region: "West", singles: 850_000 },
  { id: "austin", city: "Austin", state: "TX", tag: "#AustinSingles", rank: 11, region: "South", singles: 800_000 },
  { id: "jacksonville", city: "Jacksonville", state: "FL", tag: "#JaxSingles", rank: 12, region: "South", singles: 780_000 },
  { id: "columbus", city: "Columbus", state: "OH", tag: "#ColumbusSingles", rank: 13, region: "Midwest", singles: 760_000 },
  { id: "charlotte", city: "Charlotte", state: "NC", tag: "#CLTSingles", rank: 14, region: "South", singles: 740_000 },
  { id: "indianapolis", city: "Indianapolis", state: "IN", tag: "#IndySingles", rank: 15, region: "Midwest", singles: 720_000 },
  { id: "san-francisco", city: "San Francisco", state: "CA", tag: "#SFSingles", rank: 16, region: "West", singles: 700_000 },
  { id: "seattle", city: "Seattle", state: "WA", tag: "#SeattleSingles", rank: 17, region: "West", singles: 690_000 },
  { id: "denver", city: "Denver", state: "CO", tag: "#DenverSingles", rank: 18, region: "West", singles: 680_000 },
  { id: "washington-dc", city: "Washington", state: "DC", tag: "#DCSingles", rank: 19, region: "South", singles: 670_000 },
  { id: "boston", city: "Boston", state: "MA", tag: "#BostonSingles", rank: 20, region: "Northeast", singles: 650_000 },
  { id: "nashville", city: "Nashville", state: "TN", tag: "#NashvilleSingles", rank: 21, region: "South", singles: 620_000 },
  { id: "raleigh", city: "Raleigh", state: "NC", tag: "#RaleighSingles", rank: 22, region: "South", singles: 600_000 },
  { id: "richmond", city: "Richmond", state: "VA", tag: "#RichmondSingles", rank: 23, region: "South", singles: 580_000 },
  { id: "minneapolis", city: "Minneapolis", state: "MN", tag: "#MPLSingles", rank: 24, region: "Midwest", singles: 560_000 },
  { id: "pittsburgh", city: "Pittsburgh", state: "PA", tag: "#PittsburghSingles", rank: 25, region: "Northeast", singles: 540_000 },
  { id: "atlanta", city: "Atlanta", state: "GA", tag: "#AtlantaSingles", rank: 26, region: "South", singles: 520_000 },
  { id: "portland", city: "Portland", state: "OR", tag: "#PDXSingles", rank: 27, region: "West", singles: 500_000 },
  { id: "orlando", city: "Orlando", state: "FL", tag: "#OrlandoSingles", rank: 28, region: "South", singles: 490_000 },
];

/**
 * Dating-app content niches. tags[0] is the primary niche tag used in
 * rotation; the full pool feeds the 3-tag comment sets. angle is the copy
 * angle for generated comments.
 */
export const NICHES = [
  {
    id: "N1",
    name: "AI-fatigue / authenticity",
    angle: "real humans, not AI — profiles you can trust are real people",
    tags: ["#RealNotAI", "#AuthenticDating", "#AntiCatfish"],
  },
  {
    id: "N2",
    name: "Modern-dating discourse",
    angle: "how modern dating actually works — apps, ghosting, first-date energy",
    tags: ["#ModernDating", "#OnlineDating", "#DatingApps"],
  },
  {
    id: "N3",
    name: "Local singles community",
    angle: "city-level singles scenes — where locals actually meet",
    tags: ["#CitySingles", "#LocalDating", "#MeetLocals"],
  },
  {
    id: "N4",
    name: "Milestone / story content",
    angle: "first-date stories and how-we-met wins that warm the feed",
    tags: ["#FirstDate", "#MetOnline", "#HowWeMet"],
  },
];

/**
 * Seeded target posts the comment engine drafts against. In production the
 * executor replaces these with real, live parent-post URLs — the engine only
 * drafts comments, it never publishes.
 */
export const TARGET_POSTS = [
  { id: "p1", title: "AI profiles are ruining dating apps", platform: "TikTok", url: "https://example.com/posts/ai-profiles" },
  { id: "p2", title: "Why first dates keep getting worse", platform: "Instagram", url: "https://example.com/posts/first-dates" },
  { id: "p3", title: "Local singles: where are people actually meeting?", platform: "TikTok", url: "https://example.com/posts/local-singles" },
];
