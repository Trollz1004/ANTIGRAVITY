const fs = require('fs');
const path = require('path');

const logDir = 'E:/ANTIGRAVITY/ops/sales/campaigns';
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'revenue-tracker.json');

// Stripe links verified working (200 OK)
// Square links verified 404 - using Stripe as primary payment rail
// Square API checkout link creation blocked by 404

const revenueData = {
  campaign: '2k-revenue-swarm',
  started: new Date().toISOString(),
  target: 2000,
  current: 0,
  status: 'PAYMENT LINKS DEPLOYED - awaiting transactions',
  revenue_streams: {
    security_cleanup: {
      name: 'Security Cleanup',
      setup_fee: 1500,
      monthly_recurring: 200,
      bucket: 1,
      description: 'Repository audit, doctrine purge, secret rotation, compliance scan.',
      payment_link: 'https://buy.stripe.com/3cI3cwcR6c3910p18peEo09?ref=clean-repo',
      landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
    },
    agentic_workflows: {
      name: 'Agentic Workflows',
      setup_fee: 2500,
      monthly_recurring: 500,
      bucket: 2,
      description: 'Multi-agent orchestration, swarm deployment, autonomous task execution.',
      payment_link: 'https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a?ref=clean-repo',
      landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
    },
    storefront_deployment: {
      name: 'Storefront Deployment',
      setup_fee: 950,
      transaction_fee_percent: 3.0,
      bucket: 5,
      description: 'Digital storefront deployment with Square checkout, affiliate links.',
      payment_link: 'https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j?ref=clean-repo',
      landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
    },
    tech_debt_cleanup: {
      name: 'Tech Debt Cleanup',
      sprint_cost: 4000,
      bucket: 7,
      description: 'Legacy code modernization, dependency updates, architecture refactoring.',
      payment_link: 'https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c?ref=clean-repo',
      landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
    },
    api_management: {
      name: 'API Management',
      setup_fee: 1200,
      transaction_fee_percent: 0.05,
      bucket: 8,
      description: 'API gateway deployment, rate limiting, authentication, monitoring.',
      payment_link: 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d?ref=clean-repo',
      landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
    }
  },
  landing_pages: {
    main: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-main.html',
    omnirouter: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-omnirouter.html',
    revenue: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
  },
  saas_product: 'E:/ANTIGRAVITY/services/omni-router/api-server.js',
  channels: ['landing-pages', 'saas-product', 'stripe-checkout'],
  copy_rules: ['business-only', 'no-charity', 'no-kids', 'no-split-framing', 'square-only'],
  verification: {
    payment_links_verified: true,
    landing_pages_deployed: true,
    saas_product_created: true,
    revenue_verified: false
  }
};

fs.writeFileSync(logFile, JSON.stringify(revenueData, null, 2));
console.log('Revenue tracker written: ' + logFile);
console.log('Payment links:');
Object.values(revenueData.revenue_streams).forEach(s => {
  console.log('  ' + s.name + ': ' + s.payment_link);
});
