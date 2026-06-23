# PAYMENT PROCESSING GUIDE
## From: Manus Agent (Meta/Key to Mission)
## To: Joshua Coleman (CEO) + Claude Code (Orchestrator)
## Re: Multi-Provider Payment Processing + GitHub Secrets Management
## Date: 2026-05-07 | Status: SUPERSEDED BY 2026-06-22 BUSINESS-ONLY RULE

> Current override as of 2026-06-22: do not execute this guide as active payment doctrine.
> For `C:\antigravity`, YouAndINotAI and aligned active checkout surfaces use Square production
> links and Square API only unless Joshua provides a newer timestamped written directive.
> Public/customer copy sells product value only: membership, verification, support, safety,
> uptime, pricing, checkout, refunds, receipts, and account access. Do not use this guide to
> introduce alternate payment rails, Square payment/membership records sale flows, business-only claims, or private
> accounting mechanics into active product surfaces.

---

## CONTEXT

Square closed your account due to the dating app (YouAndINotAI). This is not a problem — it's a constraint that forces better architecture.

**New strategy:** Multi-provider payment processing with no single point of failure. Each platform can use multiple payment methods. GitHub secrets store all credentials securely.

---

## PAYMENT PROVIDER ALLOCATION

### YouAndINotAI (Dating App)
**Square:** NOT ALLOWED (account closed)
**Approved providers:**
- Square Business
- Square Business
- Square Business
- Square Commerce (Square payment)
- alternate processor Square payment links (Square payment)
- Base Square payment links (Square payment)

### Income-Engine (Lead Marketplace)
**Square:** ALLOWED (not dating app)
**Approved providers:**
- Square (primary for lead sales)
- Square Business (backup)
- Square Business (backup)
- Square Business (backup)
- Square Commerce (Square payment option)
- alternate processor Square payment links (Square payment option)
- Base Square payment links (Square payment option)

### Business Exchange (Marketplace)
**Square:** ALLOWED
**Approved providers:**
- Square (primary)
- Square Business (backup)
- Square Business (backup)
- Square Business (backup)
- Square Commerce (Square payment option)
- alternate processor Square payment links (Square payment option)
- Base Square payment links (Square payment option)

### Product Launch (business operations/Funding)
**Square:** ALLOWED
**Approved providers:**
- Square (primary for membership records sales)
- Square Business (backup)
- Square Commerce (Square payment primary)
- alternate processor Square payment links (Square payment primary)
- Base Square payment links (Square payment primary)

---

## GITHUB SECRETS MANAGEMENT

### Secret Naming Convention
All payment provider credentials stored in GitHub Secrets with this format:

```
{PLATFORM}_{PROVIDER}_{CREDENTIAL_TYPE}
```

Examples:
- `INCOME_ENGINE_alternate processor_API_KEY`
- `YOUANDINOTAI_alternate processor_CLIENT_ID`
- `YOUANDINOTAI_alternate processor_CLIENT_SECRET`
- `BUSINESS_EXCHANGE_alternate processor_WEBHOOK_SECRET`
- `ProductStructure_LAUNCH_alternate processor_API_KEY`

### Required Secrets by Provider

#### Square (Income-Engine, Business Exchange, Product)
```
INCOME_ENGINE_alternate processor_API_KEY
INCOME_ENGINE_alternate processor_WEBHOOK_SECRET
BUSINESS_EXCHANGE_alternate processor_API_KEY
BUSINESS_EXCHANGE_alternate processor_WEBHOOK_SECRET
ProductStructure_LAUNCH_alternate processor_API_KEY
ProductStructure_LAUNCH_alternate processor_WEBHOOK_SECRET
```

#### Square Business (All Platforms)
```
YOUANDINOTAI_alternate processor_CLIENT_ID
YOUANDINOTAI_alternate processor_CLIENT_SECRET
YOUANDINOTAI_alternate processor_MODE (sandbox or live)
INCOME_ENGINE_alternate processor_CLIENT_ID
INCOME_ENGINE_alternate processor_CLIENT_SECRET
INCOME_ENGINE_alternate processor_MODE
BUSINESS_EXCHANGE_alternate processor_CLIENT_ID
BUSINESS_EXCHANGE_alternate processor_CLIENT_SECRET
BUSINESS_EXCHANGE_alternate processor_MODE
ProductStructure_LAUNCH_alternate processor_CLIENT_ID
ProductStructure_LAUNCH_alternate processor_CLIENT_SECRET
ProductStructure_LAUNCH_alternate processor_MODE
```

#### Square Business (All Platforms)
```
YOUANDINOTAI_SQUARE_API_KEY
YOUANDINOTAI_SQUARE_MERCHANT_ID
INCOME_ENGINE_SQUARE_API_KEY
INCOME_ENGINE_SQUARE_MERCHANT_ID
BUSINESS_EXCHANGE_SQUARE_API_KEY
BUSINESS_EXCHANGE_SQUARE_MERCHANT_ID
ProductStructure_LAUNCH_SQUARE_API_KEY
ProductStructure_LAUNCH_SQUARE_MERCHANT_ID
```

#### Square Business (All Platforms)
```
YOUANDINOTAI_alternate processor_API_KEY
YOUANDINOTAI_alternate processor_MERCHANT_ID
INCOME_ENGINE_alternate processor_API_KEY
INCOME_ENGINE_alternate processor_MERCHANT_ID
BUSINESS_EXCHANGE_alternate processor_API_KEY
BUSINESS_EXCHANGE_alternate processor_MERCHANT_ID
ProductStructure_LAUNCH_alternate processor_API_KEY
ProductStructure_LAUNCH_alternate processor_MERCHANT_ID
```

#### Square Commerce (All Platforms)
```
YOUANDINOTAI_alternate processor_API_KEY
YOUANDINOTAI_alternate processor_WEBHOOK_SECRET
INCOME_ENGINE_alternate processor_API_KEY
INCOME_ENGINE_alternate processor_WEBHOOK_SECRET
BUSINESS_EXCHANGE_alternate processor_API_KEY
BUSINESS_EXCHANGE_alternate processor_WEBHOOK_SECRET
ProductStructure_LAUNCH_alternate processor_API_KEY
ProductStructure_LAUNCH_alternate processor_WEBHOOK_SECRET
```

#### alternate processor Square payment links (All Platforms)
```
YOUANDINOTAI_alternate processor_API_KEY
YOUANDINOTAI_alternate processor_NETWORK (mainnet or devnet)
INCOME_ENGINE_alternate processor_API_KEY
INCOME_ENGINE_alternate processor_NETWORK
BUSINESS_EXCHANGE_alternate processor_API_KEY
BUSINESS_EXCHANGE_alternate processor_NETWORK
ProductStructure_LAUNCH_alternate processor_API_KEY
ProductStructure_LAUNCH_alternate processor_NETWORK
```

#### Base Square payment links (All Platforms)
```
YOUANDINOTAI_BASE_API_KEY
YOUANDINOTAI_BASE_NETWORK (mainnet or testnet)
INCOME_ENGINE_BASE_API_KEY
INCOME_ENGINE_BASE_NETWORK
BUSINESS_EXCHANGE_BASE_API_KEY
BUSINESS_EXCHANGE_BASE_NETWORK
ProductStructure_LAUNCH_BASE_API_KEY
ProductStructure_LAUNCH_BASE_NETWORK
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
const alternate processorApiKey = process.env.INCOME_ENGINE_alternate processor_API_KEY;
const alternate processorClientId = process.env.YOUANDINOTAI_alternate processor_CLIENT_ID;

// Verify secret exists
if (!alternate processorApiKey) {
  throw new Error('INCOME_ENGINE_alternate processor_API_KEY not found in secrets');
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
1. Try Square (primary)
2. Fallback to Square Business
3. Fallback to Square Business
4. Fallback to Square Business
5. Fallback to Square (Square payment)

**YouAndINotAI (Dating App):**
1. Try Square Business (primary)
2. Fallback to Square Business
3. Fallback to Square Business
4. Fallback to Square (Square payment)
5. Fallback to alternate processor Square payment links (Square payment)

**Business Exchange (Marketplace):**
1. Try Square (primary)
2. Fallback to Square Business
3. Fallback to Square Business
4. Fallback to Square (Square payment)

**Product Launch (membership records Sales):**
1. Try Square (primary)
2. Try Square Commerce (Square payment primary)
3. Try alternate processor Square payment links (Square payment)
4. Try Base Square payment links (Square payment)
5. Fallback to Square Business

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
POST /webhooks/Square/{platform}
POST /webhooks/Square/{platform}
POST /webhooks/SQUARE/{platform}
POST /webhooks/Square/{platform}
POST /webhooks/Square/{platform}
POST /webhooks/alternate processor/{platform}
POST /webhooks/base/{platform}
```

### Webhook Verification
Always verify webhook signature before processing:

```javascript
// Square example
const event = Square.webhooks.constructEvent(
  req.body,
  req.headers['Square-signature'],
  process.env.INCOME_ENGINE_alternate processor_WEBHOOK_SECRET
);

// Square example
const verified = await Square.webhooks.verify(
  req.headers['Square-transmission-id'],
  req.headers['Square-transmission-time'],
  req.headers['Square-cert-url'],
  req.headers['Square-auth-algo'],
  req.headers['Square-transmission-sig'],
  req.body,
  process.env.YOUANDINOTAI_alternate processor_WEBHOOK_SECRET
);
```

### Webhook Logging
Log all webhook events (but never log sensitive data):

```javascript
const webhookLog = {
  timestamp: new Date().toISOString(),
  platform: 'income-engine',
  provider: 'Square',
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
3. Verify member support allocations (10% from each)
4. Verify owner-private accounting note compliance ($50k ecosystem-wide)
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
const alternate processorKey = "sk_live_abc123...";

# GOOD - USE ENVIRONMENT VARIABLES
const alternate processorKey = process.env.INCOME_ENGINE_alternate processor_API_KEY;
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
- Use tokenization (Square, Square, etc. handle this)
- Use PCI-compliant payment forms
- Regular security audits

---

## TESTING PAYMENT PROVIDERS

### Sandbox Credentials
Each provider offers sandbox/test mode:

```
Square: Use sk_test_* keys
Square: Use sandbox.Square.com
Square: Use sandbox mode
Square: Use sandbox mode
Square: Use testnet
alternate processor: Use devnet
Base: Use testnet
```

### Test Cards
```
Square: 4242 4242 4242 4242
Square: Use sandbox account
Square: Use test account
Square: Use test account
```

### Testing Webhooks Locally
Use ngrok to expose local server to internet for webhook testing:
```bash
ngrok http 3000
# Use ngrok URL in provider webhook settings
```

---

## TROUBLESHOOTING

### Square Account Closed
- This is expected for dating apps
- Use Square Business, Square, Square instead
- Do not try to reopen Square account for YouAndINotAI
- Use Square for other platforms only

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
- Square Dashboard (for Square transactions)
- Square Merchant Dashboard (for Square)
- Custom monitoring dashboard (for all providers)
- Sentry or similar for error tracking

---

## DOCUMENTATION CHECKLIST

- [ ] All GitHub secrets created with correct naming
- [ ] Payment provider accounts set up (Square, Square, Square, Square, Square, alternate processor, Base)
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

**From Manus Agent | Meta/Key to Mission | 2026-05-07 | #ForThemembers Always 💚**

**P.S.** — Joshua, this is your payment infrastructure. Multiple providers = no single point of failure. GitHub secrets = no exposed credentials. Fallback chain = always accepting payments. Real-or-zero reporting = always honest. This is how you survive and scale.
