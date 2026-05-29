export const PUBLIC_SURFACES = [
  {
    name: 'YouAndINotAI',
    url: 'https://youandinotai.com',
    status: 'Live product',
    description: 'Dating and community platform with human verification, message boards, and memberships. A live revenue engine.',
  },
  {
    name: 'Business Exchange',
    url: 'https://aidoesitall.website',
    status: 'Live marketplace',
    description: 'Marketplace for services, referrals, and business sales. The B2B routing layer for the ecosystem.',
  },
  {
    name: 'DAO Launch',
    url: 'https://dashboard.aidoesitall.website',
    status: 'Public',
    description: 'Governance and funding layer. Token sale active across 4 DAOs ($LOVE, $UKID, $GREEN, $AGRAV).',
  },
  {
    name: 'Customer Support',
    url: 'https://dashboard.aidoesitall.website',
    status: 'Active',
    description: 'Direct support surface — visible, reachable, not buried. A trust signal and conversion layer.',
  },
  {
    name: 'OnlineRecycle',
    url: 'https://onlinerecycle.org',
    status: 'Live product',
    description: 'Electronics recycling, pickup, and resale intake for Central Florida customers.',
  },
  {
    name: 'AI-Solutions Store',
    url: 'https://ai-solutions.store',
    status: 'Live storefront',
    description: 'Storefront for digital products and automation offers.',
  },
  {
    name: 'Antigravity Dashboard',
    url: 'https://dashboard.aidoesitall.website',
    status: 'Public status surface',
    description: 'This site is limited to high-level status, verified public links, and explicitly tracked metrics.',
  },
] as const;

// Square checkout links — backend/fastapi-app/app/payments.py is the source of truth.
// Keep prices and URLs in sync with PLAN_LINKS / PLAN_AMOUNTS_CENTS there.
export const MEMBERSHIP_PLANS = [
  {
    id: 'bot_shield',
    name: 'Bot-Shield Verification',
    price: '$1',
    cadence: 'one-time',
    blurb: 'One-time human verification that keeps the platform real-people-only.',
    url: 'https://square.link/u/Qc5mxUy7',
    featured: false,
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    price: '$14.99',
    cadence: '/month',
    blurb: 'Full access plus permanent founding-member status as the platform grows.',
    url: 'https://square.link/u/cxwjcn0s',
    featured: true,
  },
  {
    id: '3_month',
    name: '3-Month Founder',
    price: '$39.99',
    cadence: '3 months',
    blurb: 'A full quarter of Founding Member access, prepaid.',
    url: 'https://square.link/u/oY7qEfRM',
    featured: false,
  },
  {
    id: '12_month',
    name: '12-Month Founder',
    price: '$99.99',
    cadence: '12 months',
    blurb: 'A full year of Founding Member access at the best rate.',
    url: 'https://square.link/u/6GHpbvvl',
    featured: false,
  },
  {
    id: 'royalty',
    name: 'Royalty Card',
    price: '$2,500',
    cadence: 'lifetime',
    blurb: 'Lifetime founder tier with permanent recognition.',
    url: 'https://square.link/u/CafhorUS',
    featured: false,
  },
] as const;