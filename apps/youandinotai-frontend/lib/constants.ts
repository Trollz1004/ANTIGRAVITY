export const PUBLIC_SURFACES = [
  {
    name: 'YouAndINotAI',
    url: 'https://youandinotai.com',
    status: 'Public product',
    description: 'Dating and community platform with Bot-Shield verification, message boards, and memberships.',
  },
  {
    name: 'Business Exchange',
    url: 'https://aidoesitall.website',
    status: 'Live marketplace',
    description: 'Marketplace for services, referrals, and business sales. The B2B routing layer for the ecosystem.',
  },
  {
    name: 'DAO Roadmap',
    url: 'https://dashboard.aidoesitall.website',
    status: 'Launching Now',
    description: 'DAO governance going public. LLC for-profit structure. Join the founding community.',
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
// Env overrides (NEXT_PUBLIC_*) win at build time; hardcoded values are the
// fallback so the site never breaks on a missing env var.
const SQUARE_LINK_BOT_SHIELD = process.env.NEXT_PUBLIC_SQUARE_LINK_BOT_SHIELD || 'https://square.link/u/Qc5mxUy7';
const SQUARE_LINK_FOUNDING = process.env.NEXT_PUBLIC_SQUARE_LINK_FOUNDING || 'https://square.link/u/cxwjcn0s';
const SQUARE_LINK_3MONTH = process.env.NEXT_PUBLIC_SQUARE_LINK_3MONTH || 'https://square.link/u/oY7qEfRM';
const SQUARE_LINK_12MONTH = process.env.NEXT_PUBLIC_SQUARE_LINK_12MONTH || 'https://square.link/u/6GHpbvvl';
const SQUARE_LINK_ROYALTY = process.env.NEXT_PUBLIC_SQUARE_LINK_ROYALTY || 'https://square.link/u/CafhorUS';

export const MEMBERSHIP_PLANS = [
  {
    id: 'bot_shield',
    name: 'Bot-Shield Verification',
    price: '$1',
    cadence: 'one-time',
    blurb: 'One-time human verification that keeps the platform real-people-only.',
    url: SQUARE_LINK_BOT_SHIELD,
    featured: false,
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    price: '$14.99',
    cadence: '/month',
    blurb: 'Full access plus permanent founding-member status as the platform grows.',
    url: SQUARE_LINK_FOUNDING,
    featured: true,
  },
  {
    id: '3_month',
    name: '3-Month Founder',
    price: '$39.99',
    cadence: '3 months',
    blurb: 'A full quarter of Founding Member access, prepaid.',
    url: SQUARE_LINK_3MONTH,
    featured: false,
  },
  {
    id: '12_month',
    name: '12-Month Founder',
    price: '$99.99',
    cadence: '12 months',
    blurb: 'A full year of Founding Member access at the best rate.',
    url: SQUARE_LINK_12MONTH,
    featured: false,
  },
  {
    id: 'royalty',
    name: 'Royalty Card',
    price: '$2,500',
    cadence: 'lifetime',
    blurb: 'Lifetime founder tier with permanent recognition.',
    url: SQUARE_LINK_ROYALTY,
    featured: false,
  },
] as const;
