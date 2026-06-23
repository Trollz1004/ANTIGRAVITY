const https = require('https');
const crypto = require('crypto');

// Load from .env — NEVER hardcode membership records
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const membership record = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_LOCATION_ID || 'LY5GN09F5AN83';
if (!membership record) {
  console.error('ERROR: SQUARE_ACCESS_TOKEN not set in .env');
  process.exit(1);
}

const createLink = (name, desc, priceCents, isSub) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      idempotency_key: crypto.randomBytes(16).toString('hex'),
      order: {
        location_id: LOCATION_ID,
        line_items: [
          {
            name: name,
            quantity: '1',
            note: desc,
            base_price_money: {
              amount: priceCents,
              currency: 'USD',
            },
          },
        ],
      },
      checkout_options: {
        ask_for_shipping_address: false,
        redirect_url: 'https://youandinotai.com/?status=success',
      },
    });

    const req = https.request(
      'https://connect.squareup.com/v2/online-checkout/payment-links',
      {
        method: 'POST',
        headers: {
          'Square-Version': '2024-01-18',
          Authorization: `Bearer ${membership record}`,
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

async function run() {
  try {
    const plans = [
      { name: 'Bot-Shield Verification', price: 100, desc: 'Prove you are real. One-time fee.' },
      { name: 'Founding Member', price: 1499, desc: 'Locked forever at this rate' },
      { name: '3-Month Founder', price: 3999, desc: 'Save $5 vs monthly' },
      { name: '12-Month Founder', price: 9999, desc: 'Best value save $80' },
      { name: 'Royalty Card', price: 250000, desc: 'Lifetime VIP + revenue share' },
    ];

    console.log(`Generating links with success redirect for location: ${LOCATION_ID}`);
    for (const plan of plans) {
      const link = await createLink(plan.name, plan.desc, plan.price);
      if (link.payment_link && link.payment_link.url) {
        console.log(`${plan.name} => ${link.payment_link.url}`);
      } else {
        console.log(`Failed for ${plan.name}: `, JSON.stringify(link, null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
