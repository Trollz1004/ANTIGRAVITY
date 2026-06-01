# PAYMENT PROCESSING GUIDE
## From: Manus Agent (Meta/Key to Mission)
## To: Joshua Coleman (CEO) + Claude Code (Orchestrator)
## Re: Multi-Provider Payment Processing + GitHub Secrets Management
## Date: 2026-05-07 | Status: OPERATIONAL

---

## CONTEXT

Stripe closed your account due to the dating app (YouAndINotAI). This is not a problem — it's a constraint that forces better architecture.

**New strategy:** Multi-provider payment processing with no single point of failure. Each platform can use multiple payment methods. GitHub secrets store all credentials securely.

---

## PAYMENT PROVIDER ALLOCATION

### YouAndINotAI (Dating App)
**Stripe:** NOT ALLOWED (account closed)
**Approved providers:**
- PayPal Business
- Cash App Business
- Venmo Business
- Coinbase Commerce (crypto)
- Phantom Wallet (crypto)
- Base Wallet (crypto)

### Income-Engine (Lead Marketplace)
**Stripe:** ALLOWED (not dating app)
**Approved providers:**
- Stripe (primary for lead sales)
- PayPal Business (backup)
- Cash App Business (backup)
- Venmo Business (backup)
- Coinbase Commerce (crypto option)
- Phantom Wallet (crypto option)
- Base Wallet (crypto option)

### Business Exchange (Marketplace)
**Stripe:** ALLOWED
**Approved providers:**
- Stripe (primary)
- PayPal Business (backup)
- Cash App Business (backup)
- Venmo Business (backup)
- Coinbase Commerce (crypto option)
- Phantom Wallet (crypto option)
- Base Wallet (crypto option)

### DAO Launch (Governance/Funding)
**Stripe:** ALLOWED
**Approved providers:**
- Stripe (primary for token sales)
- PayPal Business (backup)
- Coinbase Commerce (crypto primary)
- Phantom Wallet (crypto primary)
- Base Wallet (crypto primary)

---

## GITHUB SECRETS MANAGEMENT

### Secret Naming Convention
All payment provider credentials stored in GitHub Secrets with this format:

```
{PLATFORM}_{PROVIDER}_{CREDENTIAL_TYPE}
```

Examples:
- `INCOME_ENGINE_STRIPE_API_KEY`
- `YOUANDINOTAI_PAYPAL_CLIENT_ID`
- `YOUANDINOTAI_PAYPAL_CLIENT_SECRET`
- `BUSINESS_EXCHANGE_STRIPE_WEBHOOK_SECRET`
- `DAO_LAUNCH_COINBASE_API_KEY`

### Required Secrets by Provider

#### Stripe (Income-Engine, Business Exchange, DAO)
```
INCOME_ENGINE_STRIPE_API_KEY
INCOME_ENGINE_STRIPE_WEBHOOK_SECRET
BUSINESS_EXCHANGE_STRIPE_API_KEY
BUSINESS_EXCHANGE_STRIPE_WEBHOOK_SECRET
DAO_LAUNCH_STRIPE_API_KEY
DAO_LAUNCH_STRIPE_WEBHOOK_SECRET
```

#### PayPal Business (All Platforms)
```
YOUANDINOTAI_PAYPAL_CLIENT_ID
YOUANDINOTAI_PAYPAL_CLIENT_SECRET
YOUANDINOTAI_PAYPAL_MODE (sandbox or live)
INCOME_ENGINE_PAYPAL_CLIENT_ID
INCOME_ENGINE_PAYPAL_CLIENT_SECRET
INCOME_ENGINE_PAYPAL_MODE
BUSINESS_EXCHANGE_PAYPAL_CLIENT_ID
BUSINESS_EXCHANGE_PAYPAL_CLIENT_SECRET
BUSINESS_EXCHANGE_PAYPAL_MODE
DAO_LAUNCH_PAYPAL_CLIENT_ID
DAO_LAUNCH_PAYPAL_CLIENT_SECRET
DAO_LAUNCH_PAYPAL_MODE
```

#### Cash App Business (All Platforms)
```
YOUANDINOTAI_CASHAPP_API_KEY
YOUANDINOTAI_CASHAPP_MERCHANT_ID
INCOME_ENGINE_CASHAPP_API_KEY
INCOME_ENGINE_CASHAPP_MERCHANT_ID
BUSINESS_EXCHANGE_CASHAPP_API_KEY
BUSINESS_EXCHANGE_CASHAPP_MERCHANT_ID
DAO_LAUNCH_CASHAPP_API_KEY
DAO_LAUNCH_CASHAPP_MERCHANT_ID
```

#### Venmo Business (All Platforms)
```
YOUANDINOTAI_VENMO_API_KEY
YOUANDINOTAI_VENMO_MERCHANT_ID
INCOME_ENGINE_VENMO_API_KEY
INCOME_ENGINE_VENMO_MERCHANT_ID
BUSINESS_EXCHANGE_VENMO_API_KEY
BUSINESS_EXCHANGE_VENMO_MERCHANT_ID
DAO_LAUNCH_VENMO_API_KEY
DAO_LAUNCH_VENMO_MERCHANT_ID
```

#### Coinbase Commerce (All Platforms)
```
YOUANDINOTAI_COINBASE_API_KEY
YOUANDINOTAI_COINBASE_WEBHOOK_SECRET
INCOME_ENGINE_COINBASE_API_KEY
INCOME_ENGINE_COINBASE_WEBHOOK_SECRET
BUSINESS_EXCHANGE_COINBASE_API_KEY
BUSINESS_EXCHANGE_COINBASE_WEBHOOK_SECRET
DAO_LAUNCH_COINBASE_API_KEY
DAO_LAUNCH_COINBASE_WEBHOOK_SECRET
```

#### Phantom Wallet (All Platforms)
```
YOUANDINOTAI_PHANTOM_API_KEY
YOUANDINOTAI_PHANTOM_NETWORK (mainnet or devnet)
INCOME_ENGINE_PHANTOM_API_KEY
INCOME_ENGINE_PHANTOM_NETWORK
BUSINESS_EXCHANGE_PHANTOM_API_KEY
BUSINESS_EXCHANGE_PHANTOM_NETWORK
DAO_LAUNCH_PHANTOM_API_KEY
DAO_LAUNCH_PHANTOM_NETWORK
```

#### Base Wallet (All Platforms)
```
YOUANDINOTAI_BASE_API_KEY
YOUANDINOTAI_BASE_NETWORK (mainnet or testnet)
INCOME_ENGINE_BASE_API_KEY
INCOME_ENGINE_BASE_NETWORK
BUSINESS_EXCHANGE_BASE_API_KEY
BUSINESS_EXCHANGE_BASE_NETWORK
DAO_LAUNCH_BASE_API_KEY
DAO_LAUNCH_BASE_NETWORK
```

---

## GITHUB SECRETS SETUP PROCESS

### Step 1: Create Repository Secrets
1. Go to GitHub repo settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with exact naming convention above
5. Never commit secrets to code

### Step 2: Access Secrets in Code
```javascript
// Node.js / Express
const stripeApiKey = process.env.INCOME_ENGINE_STRIPE_API_KEY;
const paypalClientId = process.env.YOUANDINOTAI_PAYPAL_CLIENT_ID;

// Verify secret exists
if (!stripeApiKey) {
  throw new Error('INCOME_ENGINE_STRIPE_API_KEY not found in secrets');
}
```

### Step 3: Webhook Secrets
Store webhook signing secrets separately from API keys:
```
{PLATFORM}_{PROVIDER}_WEBHOOK_SECRET
```

Never expose webhook secrets in logs or error messages.

### Step 4: Rotation Policy
- Rotate all secrets every 90 days
- Rotate immediately if compromised
- Document rotation date in team notes
- Update GitHub secrets after rotation

---

## PAYMENT FLOW ARCHITECTURE

### Multi-Provider Fallback Chain

**Income-Engine (Lead Sales):**
1. Try Stripe (primary)
2. Fallback to PayPal Business
3. Fallback to Cash App Business
4. Fallback to Venmo Business
5. Fallback to Coinbase (crypto)

**YouAndINotAI (Dating App):**
1. Try PayPal Business (primary)
2. Fallback to Cash App Business
3. Fallback to Venmo Business
4. Fallback to Coinbase (crypto)
5. Fallback to Phantom Wallet (crypto)

**Business Exchange (Marketplace):**
1. Try Stripe (primary)
2. Fallback to PayPal Business
3. Fallback to Cash App Business
4. Fallback to Coinbase (crypto)

**DAO Launch (Token Sales):**
1. Try Stripe (primary)
2. Try Coinbase Commerce (crypto primary)
3. Try Phantom Wallet (crypto)
4. Try Base Wallet (crypto)
5. Fallback to PayPal Business

### Implementation Pattern
```javascript
async function processPayment(platform, amount, currency, method = null) {
  const providers = getProviderChain(platform);
  
  for (const provider of providers) {
    if (method && provider !== method) continue; // Skip if user selected specific method
    
    try {
      const result = await provider.charge(amount, currency);
      return { success: true, provider, transactionId: result.id };
    } catch (error) {
      console.error(`${provider} failed:`, error.message);
      continue; // Try next provider
    }
  }
  
  throw new Error(`All payment providers failed for ${platform}`);
}
```

---

## WEBHOOK MANAGEMENT

### Webhook Endpoints
Each platform needs webhook receiver for payment confirmations:

```
POST /webhooks/stripe/{platform}
POST /webhooks/paypal/{platform}
POST /webhooks/cashapp/{platform}
POST /webhooks/venmo/{platform}
POST /webhooks/coinbase/{platform}
POST /webhooks/phantom/{platform}
POST /webhooks/base/{platform}
```

### Webhook Verification
Always verify webhook signature before processing:

```javascript
// Stripe example
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.INCOME_ENGINE_STRIPE_WEBHOOK_SECRET
);

// PayPal example
const verified = await paypal.webhooks.verify(
  req.headers['paypal-transmission-id'],
  req.headers['paypal-transmission-time'],
  req.headers['paypal-cert-url'],
  req.headers['paypal-auth-algo'],
  req.headers['paypal-transmission-sig'],
  req.body,
  process.env.YOUANDINOTAI_PAYPAL_WEBHOOK_SECRET
);
```

### Webhook Logging
Log all webhook events (but never log sensitive data):

```javascript
const webhookLog = {
  timestamp: new Date().toISOString(),
  platform: 'income-engine',
  provider: 'stripe',
  event: event.type,
  amount: event.data.object.amount,
  currency: event.data.object.currency,
  status: 'processed'
};

console.log(JSON.stringify(webhookLog));
```

---

## PAYMENT RECONCILIATION

### Daily Reconciliation
1. Pull transactions from each provider API
2. Compare against database records
3. Flag discrepancies
4. Reconcile within 24 hours

### Monthly Reconciliation
1. Generate revenue report from each provider
2. Compare against platform revenue tracking
3. Verify kids bucket allocations (10% from each)
4. Verify founder cap compliance ($50k ecosystem-wide)
5. Document any variances

### Real-or-Zero Reporting
- Only report actual received payments
- Do not include pending or failed transactions
- Show zero if no transactions
- Document any holds or disputes

---

## SECURITY BEST PRACTICES

### Never Commit Secrets
```bash
# BAD - DO NOT DO THIS
const stripeKey = "sk_live_abc123...";

# GOOD - USE ENVIRONMENT VARIABLES
const stripeKey = process.env.INCOME_ENGINE_STRIPE_API_KEY;
```

### Never Log Sensitive Data
```javascript
// BAD
console.log('Processing payment:', { apiKey, amount, cardNumber });

// GOOD
console.log('Processing payment:', { platform, amount, lastFourDigits });
```

### Use HTTPS Only
All payment endpoints must use HTTPS. Never send credentials over HTTP.

### Rate Limiting
Implement rate limiting on payment endpoints to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.post('/api/payments', paymentLimiter, handlePayment);
```

### PCI Compliance
- Never store full credit card numbers
- Use tokenization (Stripe, PayPal, etc. handle this)
- Use PCI-compliant payment forms
- Regular security audits

---

## TESTING PAYMENT PROVIDERS

### Sandbox Credentials
Each provider offers sandbox/test mode:

```
Stripe: Use sk_test_* keys
PayPal: Use sandbox.paypal.com
Cash App: Use sandbox mode
Venmo: Use sandbox mode
Coinbase: Use testnet
Phantom: Use devnet
Base: Use testnet
```

### Test Cards
```
Stripe: 4242 4242 4242 4242
PayPal: Use sandbox account
Cash App: Use test account
Venmo: Use test account
```

### Testing Webhooks Locally
Use ngrok to expose local server to internet for webhook testing:
```bash
ngrok http 3000
# Use ngrok URL in provider webhook settings
```

---

## TROUBLESHOOTING

### Stripe Account Closed
- This is expected for dating apps
- Use PayPal Business, Cash App, Venmo instead
- Do not try to reopen Stripe account for YouAndINotAI
- Use Stripe for other platforms only

### Payment Failure
1. Check if provider is in maintenance
2. Verify API credentials are correct
3. Check rate limits
4. Try fallback provider
5. Log error and alert support

### Webhook Not Received
1. Verify webhook URL is correct
2. Check webhook is enabled in provider settings
3. Verify firewall allows incoming requests
4. Check webhook signature verification
5. Review provider logs

---

## MONITORING & ALERTS

### Key Metrics to Monitor
- Payment success rate (target: >99%)
- Average transaction time
- Failed transaction count
- Provider uptime
- Webhook delivery latency

### Alert Thresholds
- Payment success rate drops below 95%
- More than 5 consecutive failed transactions
- Webhook delivery delay > 5 minutes
- Any provider downtime

### Monitoring Tools
- Stripe Dashboard (for Stripe transactions)
- PayPal Merchant Dashboard (for PayPal)
- Custom monitoring dashboard (for all providers)
- Sentry or similar for error tracking

---

## DOCUMENTATION CHECKLIST

- [ ] All GitHub secrets created with correct naming
- [ ] Payment provider accounts set up (Stripe, PayPal, Cash App, Venmo, Coinbase, Phantom, Base)
- [ ] Webhook endpoints implemented for each provider
- [ ] Webhook verification implemented
- [ ] Fallback chain implemented
- [ ] Payment reconciliation process documented
- [ ] Security checklist completed
- [ ] Testing completed in sandbox mode
- [ ] Monitoring and alerts configured
- [ ] Team trained on payment processing
- [ ] Incident response plan documented

---

**From Manus Agent | Meta/Key to Mission | 2026-05-07 | #ForTheKids Always 💚**

**P.S.** — Joshua, this is your payment infrastructure. Multiple providers = no single point of failure. GitHub secrets = no exposed credentials. Fallback chain = always accepting payments. Real-or-zero reporting = always honest. This is how you survive and scale.
