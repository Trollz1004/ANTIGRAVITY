// Protocol Omega — Immutable Truth
// These values are cryptographic fact on Base Mainnet (Chain 8453)

export const PROTOCOL_OMEGA = {
  // Wallet addresses (Base Mainnet)
  wallets: {
    DAO_TREASURY: "0xa87874d5320555c8639670645F1A2B4f82363a7c",
    DATING_REVENUE: "0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121",
    CHARITY_REVENUE: "0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B",
    OPS_WALLET: "0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4",
  },

  // Split logic (Gospel V1.3)
  split: {
    CHARITY_PCT: 60,    // Shriners Children's Hospital
    INFRA_PCT: 30,      // V8 Engine & AI Infrastructure
    FOUNDER_PCT: 10,    // Family Trust Allocation
    // Remainder from integer division → Charity
  },

  // Contracts
  contracts: {
    CHARITY_ROUTER: "CharityRouter100",  // Immutable 100% charity forwarder
    DATING_ROUTER: "DatingRevenueRouter", // UUPS upgradeable with timelock
  },

  chain: {
    name: "Base Mainnet",
    id: 8453,
  },

  // Launch
  LAUNCH_DATE: "2026-04-04",
  PRE_ORDER_TARGET: 19990,
} as const;

// Stripe payment links (live)
export const PAYMENT_LINKS = {
  BOT_SHIELD: "https://buy.stripe.com/3cI00kdVa5EL7oN8AReEo0k",
  MONTHLY: "https://buy.stripe.com/5kQ8wQ04kebh6kJbN3eEo0l",
  THREE_MONTH: "https://buy.stripe.com/8x24gA3gwebhfVjbN3eEo0n",
  TWELVE_MONTH: "https://buy.stripe.com/cNicN604k6IP10p5oFeEo0m",
  ROYALTY_CARD: "https://buy.stripe.com/8x2cN604kaZ5cJ75oFeEo0o",
} as const;

// Pricing
export const PRICING = {
  BOT_SHIELD: 1.00,
  MONTHLY: 14.99,
  THREE_MONTH: 39.99,
  TWELVE_MONTH: 99.99,
  ROYALTY_CARD: 2500.00,
} as const;

// Royal Flush Draw
export const ROYAL_FLUSH = {
  PRIZE_CASH: 500,
  PRIZE_LIFETIME_PREMIUM: true,
  ENTRIES_PER_VERIFY: 1,
  ENTRIES_PER_REFERRAL: 5,
  DRAW_DATE: "2026-04-04",
} as const;

export const CHARACTER_LIMIT = 25000;

// Email config
export const EMAIL_CONFIG = {
  FROM_NAME: "Josh Coleman",
  FROM_EMAIL: "joshlcoleman@gmail.com",
  REPLY_TO: "joshlcoleman@gmail.com",
} as const;
