export const PUBLIC_SURFACES = [
  {
    name: 'YouAndINotAI',
    url: 'https://youandinotai.com',
    status: 'Public product site',
    description: 'Customer-facing social platform. Public claims should stay limited to what is live and documented.',
  },
  {
    name: 'OnlineRecycle',
    url: 'https://onlinerecycle.org',
    status: 'Public service site',
    description: 'Electronics recycling, pickup, and resale intake for Central Florida customers.',
  },
  {
    name: 'AI-Solutions Store',
    url: 'https://ai-solutions.store',
    status: 'Public storefront',
    description:
      'Separate storefront surface. Customer messaging should stay distinct from service and dashboard pages.',
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
