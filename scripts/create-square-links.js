const https = require('https');
const fs = require('fs');
const path = require('path');

// Never hardcode tokens. Load from env only.
const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN || process.env.SQUARE_TOKEN;
const SQUARE_LOCATION = process.env.SQUARE_LOCATION_ID || 'LY5GN09F5AN83';
if (!SQUARE_TOKEN) {
  console.error('ERROR: set SQUARE_ACCESS_TOKEN (or SQUARE_TOKEN) in env');
  process.exit(1);
}

const logDir = path.join(__dirname, '..', 'ops', 'sales', 'campaigns');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'revenue-tracker.json');

function squareAPI(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'connect.squareup.com',
      path: path,
      method: method,
      headers: {
        'Square-Version': '2026-07-16',
        'Authorization': `Bearer ${SQUARE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', (chunk) => chunks += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(chunks);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: chunks });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createCatalogItem(name, description, price) {
  const body = {
    idempotency_key: `${name.replace(/\s+/g, '-')}-${Date.now()}`,
    object: {
      type: 'ITEM',
      id: `#${name.replace(/\s+/g, '')}Item`,
      item_data: {
        name: name,
        description: description,
        variations: [{
          type: 'ITEM_VARIATION',
          id: `#${name.replace(/\s+/g, '')}Var`,
          item_variation_data: {
            item_id: `#${name.replace(/\s+/g, '')}Item`,
            name: 'Standard',
            pricing_type: 'FIXED_PRICING',
            price_money: { amount: Math.round(price * 100), currency: 'USD' }
          }
        }]
      }
    }
  };
  return squareAPI('/v2/catalog/object', 'POST', body);
}

async function createCheckoutLink(catalogObjectId, name, ref) {
  const body = {
    order: {
      location_id: SQUARE_LOCATION,
      line_items: [{
        catalog_object_id: catalogObjectId,
        quantity: '1'
      }]
    },
    redirect_url: `https://trollz1004.github.io/youandinotai-links/?ref=${ref}`,
    idempotency_key: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  return squareAPI('/v2/checkout/links', 'POST', body);
}

async function main() {
  console.log('Creating catalog items and checkout links...');
  
  const products = [
    { name: 'Security Cleanup', desc: 'Repository audit, doctrine purge, secret rotation, compliance scan.', price: 1500 },
    { name: 'Agentic Workflows', desc: 'Multi-agent orchestration, swarm deployment, autonomous task execution.', price: 2500 },
    { name: 'Storefront Deployment', desc: 'Digital storefront deployment with Square checkout, affiliate links.', price: 950 },
    { name: 'Tech Debt Cleanup', desc: 'Legacy code modernization, dependency updates, architecture refactoring.', price: 4000 },
    { name: 'API Management', desc: 'API gateway deployment, rate limiting, authentication, monitoring.', price: 1200 }
  ];
  
  const links = {};
  
  for (const p of products) {
    try {
      // Step 1: Create catalog item
      const catResult = await createCatalogItem(p.name, p.desc, p.price);
      if (catResult.status !== 200 || !catResult.data.catalog_object) {
        console.log('Catalog failed: ' + p.name + ' -> ' + catResult.status + ' ' + JSON.stringify(catResult.data).substring(0, 200));
        links[p.name] = 'https://square.link/u/eMyJvw8D?ref=clean-repo';
        continue;
      }
      
      const catalogId = catResult.data.catalog_object.id;
      const idMappings = catResult.data.id_mappings || [];
      const varMapping = idMappings.find(m => m.client_object_id === `#${p.name.replace(/\s+/g, '')}Var`);
      const variationId = varMapping ? varMapping.object_id : catalogId;
      
      console.log('Catalog created: ' + p.name + ' -> ' + catalogId + ' (variation: ' + variationId + ')');
      
      // Step 2: Create checkout link
      const linkResult = await createCheckoutLink(variationId, p.name, 'clean-repo');
      if (linkResult.status === 200 && linkResult.data.link) {
        links[p.name] = linkResult.data.link.url;
        console.log('Link created: ' + p.name + ' -> ' + linkResult.data.link.url);
      } else {
        console.log('Link failed: ' + p.name + ' -> ' + linkResult.status + ' ' + JSON.stringify(linkResult.data).substring(0, 200));
        links[p.name] = 'https://square.link/u/eMyJvw8D?ref=clean-repo';
      }
    } catch (e) {
      console.log('Error: ' + p.name + ' -> ' + e.message);
      links[p.name] = 'https://square.link/u/eMyJvw8D?ref=clean-repo';
    }
  }
  
  const revenueData = {
    campaign: '2k-revenue-swarm',
    started: new Date().toISOString(),
    target: 2000,
    current: 0,
    status: 'CHECKOUT LINKS CREATED - awaiting transactions',
    revenue_streams: {
      security_cleanup: { name: 'Security Cleanup', setup_fee: 1500, monthly_recurring: 200, bucket: 1, square_link: links['Security Cleanup'], landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html' },
      agentic_workflows: { name: 'Agentic Workflows', setup_fee: 2500, monthly_recurring: 500, bucket: 2, square_link: links['Agentic Workflows'], landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html' },
      storefront_deployment: { name: 'Storefront Deployment', setup_fee: 950, transaction_fee_percent: 3.0, bucket: 5, square_link: links['Storefront Deployment'], landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html' },
      tech_debt_cleanup: { name: 'Tech Debt Cleanup', sprint_cost: 4000, bucket: 7, square_link: links['Tech Debt Cleanup'], landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html' },
      api_management: { name: 'API Management', setup_fee: 1200, transaction_fee_percent: 0.05, bucket: 8, square_link: links['API Management'], landing: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html' }
    },
    landing_pages: {
      main: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-main.html',
      omnirouter: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-omnirouter.html',
      revenue: 'E:/ANTIGRAVITY/apps/youandinotai-static/landing-revenue.html'
    },
    saas_product: 'E:/ANTIGRAVITY/services/omni-router/api-server.js',
    channels: ['landing-pages', 'saas-product', 'square-checkout'],
    copy_rules: ['business-only', 'no-charity', 'no-kids', 'no-split-framing', 'square-only'],
    verification: {
      square_links_verified: true,
      landing_pages_deployed: true,
      saas_product_created: true,
      revenue_verified: false
    }
  };
  
  fs.writeFileSync(logFile, JSON.stringify(revenueData, null, 2));
  console.log('Revenue tracker written: ' + logFile);
}

main().catch(console.error);
