# HERMES + MANUS ARCHITECTURE — Refined
## From: Manus Agent (Meta/Key to Mission)
## To: Claude Code (Orchestrator) + Joshua (CEO)
## Re: Income-Engine Revenue Generation + AntiGravity Compliance
## Date: 2026-05-07 | Version: 2.0 (Perplexity-Refined)
## Status: DEFINITIVE GUIDE

---

## EXECUTIVE SUMMARY

**The Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR APPS                                │
│  (income-engine, YouAndINotAI, Business Exchange, DAO)          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ (only talks to Manus)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              server/manus/client.ts (THIN CLIENT)               │
│  Single point of contact for all AI operations                  │
│  - createFetcherTask()                                          │
│  - pollTask()                                                   │
│  - createProposalTask()                                         │
│  - createEmailTask()                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ (routes via agent_profile)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MANUS API (MODEL BUS)                        │
│  - Picks models (Ollama Cloud, OpenRouter, OpenCode, local)     │
│  - Handles provider failover automatically                      │
│  - Respects agent_profile constraints                           │
│  - Returns structured JSON + metadata                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
    Ollama Cloud  OpenRouter  OpenCode    Local Ollama
    (free tier)   (free tier) (free)      (port 11434)
```

**The Roles:**

- **Manus**: Model router. Handles provider failover, usage caps, model selection. Apps never talk to providers directly.
- **Hermes**: Compliance brain. Enforces 10/27/63 split, founder cap, cost budgets, latency constraints. Watches Manus metrics.
- **Apps**: Create jobs via thin client. Don't care which provider. Don't care about failover. Just get results.

**The Benefit:**

You can swap underlying model stacks (Ollama → OpenRouter → local) **without touching app logic**. Hermes only needs to know "what job" and "what schema," not "which model."

---

## PART 1: MANUS AS THE MODEL BUS

### 1.1 Agent Profiles (Not Manual Switching)

Instead of your code saying "if OpenRouter is down, use local," you tell Manus which **profile** you want:

| Profile | Use Case | Cost | Speed | Quality |
|---------|----------|------|-------|---------|
| `'cheap'` | Lead scanning, FETCHER jobs, bulk processing | ✓ Lowest | Fast | Good enough |
| `'fast'` | Real-time chat, user-facing features | Medium | ✓ Fastest | High |
| `'max'` | Client proposals, money-critical work | Highest | Slower | ✓ Highest |
| `'local'` | Batch analysis, Xeon box processing | Free | Variable | Good |

**Manus automatically picks providers based on profile:**
- `'cheap'` → OpenCode free → Ollama Cloud free tier → OpenRouter free tier
- `'fast'` → Local Ollama (if available) → Ollama Cloud → OpenRouter
- `'max'` → OpenRouter paid → Ollama Cloud paid → Claude (if available)
- `'local'` → Local Ollama (port 11434) → fallback to cheap

### 1.2 Apps Only Talk to Manus

**Rule: Never import OpenRouter, Ollama, or any provider directly.**

Instead, all apps use the thin Manus client:

```ts
// ✅ CORRECT
import { manusClient } from '../manus/client';

const leads = await manusClient.createFetcherTask({
  profile: 'cheap',
  schema: LeadSchema,
});

// ❌ WRONG
import axios from 'axios';
const response = await axios.post('https://api.openrouter.ai/...'); // DON'T DO THIS
```

**Why?** When you need to swap providers or add a new one, you change one file (`server/manus/client.ts`), not 10 files scattered across your codebase.

### 1.3 Task Metadata (Constraints, Not Hard-Coded Logic)

When you create a task, pass metadata that Manus uses to make routing decisions:

```ts
await manusClient.createFetcherTask({
  profile: 'cheap',
  title: 'FETCHER: Scan Reddit r/forhire',
  description: '...',
  constraints: {
    maxLatency: 60000,      // 60 seconds max
    maxCost: 0.05,          // $0.05 max
    preferLocal: false,     // OK to use cloud
  },
  schema: LeadSchema,
});
```

Manus then picks a provider that satisfies those constraints. If no provider can meet all constraints, it picks the closest and Hermes logs a warning.

---

## PART 2: THIN MANUS CLIENT (`server/manus/client.ts`)

### 2.1 Client Implementation

```ts
// server/manus/client.ts
import axios from 'axios';
import { v4 as uuid } from 'nanoid';

const MANUS_API_URL = 'https://api.manus.ai';
const MANUS_API_KEY = process.env.MANUS_API_KEY;

export interface TaskMetadata {
  profile: 'cheap' | 'fast' | 'max' | 'local';
  maxLatency?: number; // ms
  maxCost?: number; // dollars
  preferLocal?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface ManuTaskRequest {
  title: string;
  description: string;
  metadata: TaskMetadata;
  schema: Record<string, any>;
}

export interface ManusTaskResult {
  taskId: string;
  success: boolean;
  data: any;
  metadata: {
    profile: string;
    provider: string; // which provider Manus used
    latency: number; // ms
    cost: number; // dollars
    tokensUsed: number;
  };
}

export const manusClient = {
  /**
   * Create a FETCHER task to scan for qualified leads
   */
  async createFetcherTask(options: {
    profile: 'cheap' | 'fast' | 'max' | 'local';
    schema?: Record<string, any>;
  }): Promise<{ taskId: string }> {
    const requestId = uuid();

    const response = await axios.post(
      `${MANUS_API_URL}/v2/task.create`,
      {
        title: 'FETCHER: Scan for Qualified Leads',
        description: `
          Scan Reddit r/forhire, r/websiteservices, Upwork, and Fiverr for qualified leads.
          
          Qualification criteria:
          - Budget: >= $50
          - Posted: <= 4 hours ago
          - Clear specification
          
          Return: JSON with title, platform, URL, budget, deliverable, $/hr estimate
          
          If 3+ leads found, notify Joshua with top pick.
        `,
        agent_profile: options.profile,
        structured_output_schema: options.schema || {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  platform: { type: 'string', enum: ['reddit_forhire', 'reddit_websiteservices', 'upwork', 'fiverr'] },
                  url: { type: 'string' },
                  budget: { type: 'number' },
                  deliverable: { type: 'string' },
                  hourly_rate: { type: 'number' },
                  posted_hours_ago: { type: 'number' }
                },
                required: ['title', 'platform', 'url', 'budget', 'deliverable', 'posted_hours_ago']
              }
            },
            qualified_count: { type: 'number' },
            top_pick: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                budget: { type: 'number' }
              }
            }
          }
        },
        metadata: {
          requestId,
          profile: options.profile,
          source: 'income-engine',
        }
      },
      {
        headers: {
          'x-manus-api-key': MANUS_API_KEY,
          'x-request-id': requestId,
        }
      }
    );

    return {
      taskId: response.data.id,
    };
  },

  /**
   * Poll for task results
   */
  async pollTask(taskId: string): Promise<ManusTaskResult | null> {
    try {
      const response = await axios.get(
        `${MANUS_API_URL}/v2/task.listMessages?task_id=${taskId}`,
        {
          headers: {
            'x-manus-api-key': MANUS_API_KEY,
          }
        }
      );

      const messages = response.data.data;
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.structured_output_result) {
        return {
          taskId,
          success: lastMessage.structured_output_result.success,
          data: lastMessage.structured_output_result.value,
          metadata: {
            profile: lastMessage.metadata?.profile || 'unknown',
            provider: lastMessage.metadata?.provider || 'unknown',
            latency: lastMessage.metadata?.latency || 0,
            cost: lastMessage.metadata?.cost || 0,
            tokensUsed: lastMessage.metadata?.tokens_used || 0,
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to poll task:', error);
      return null;
    }
  },

  /**
   * Create a proposal draft task (high quality)
   */
  async createProposalTask(options: {
    clientName: string;
    projectDescription: string;
    budget: number;
  }): Promise<{ taskId: string }> {
    const requestId = uuid();

    const response = await axios.post(
      `${MANUS_API_URL}/v2/task.create`,
      {
        title: `Draft Proposal: ${options.clientName}`,
        description: `
          Write a professional proposal for ${options.clientName}.
          
          Project: ${options.projectDescription}
          Budget: $${options.budget}
          
          Return: JSON with proposal_title, executive_summary, scope, timeline, pricing, next_steps
        `,
        agent_profile: 'max', // Use best quality for client-facing work
        structured_output_schema: {
          type: 'object',
          properties: {
            proposal_title: { type: 'string' },
            executive_summary: { type: 'string' },
            scope: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            pricing: { type: 'object' },
            next_steps: { type: 'array', items: { type: 'string' } }
          }
        },
        metadata: {
          requestId,
          profile: 'max',
          source: 'income-engine',
          clientName: options.clientName,
        }
      },
      {
        headers: {
          'x-manus-api-key': MANUS_API_KEY,
          'x-request-id': requestId,
        }
      }
    );

    return {
      taskId: response.data.id,
    };
  },

  /**
   * Create an email draft task
   */
  async createEmailTask(options: {
    recipient: string;
    subject: string;
    context: string;
  }): Promise<{ taskId: string }> {
    const requestId = uuid();

    const response = await axios.post(
      `${MANUS_API_URL}/v2/task.create`,
      {
        title: `Draft Email to ${options.recipient}`,
        description: `
          Write a professional email.
          
          Recipient: ${options.recipient}
          Subject: ${options.subject}
          Context: ${options.context}
          
          Return: JSON with email_body, tone, key_points
        `,
        agent_profile: 'fast', // Real-time, but not critical
        structured_output_schema: {
          type: 'object',
          properties: {
            email_body: { type: 'string' },
            tone: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } }
          }
        },
        metadata: {
          requestId,
          profile: 'fast',
          source: 'income-engine',
        }
      },
      {
        headers: {
          'x-manus-api-key': MANUS_API_KEY,
          'x-request-id': requestId,
        }
      }
    );

    return {
      taskId: response.data.id,
    };
  },

  /**
   * Create a local batch analysis task (use Xeon box)
   */
  async createBatchAnalysisTask(options: {
    dataSet: any[];
    analysisType: string;
  }): Promise<{ taskId: string }> {
    const requestId = uuid();

    const response = await axios.post(
      `${MANUS_API_URL}/v2/task.create`,
      {
        title: `Batch Analysis: ${options.analysisType}`,
        description: `
          Analyze dataset offline.
          
          Dataset size: ${options.dataSet.length} items
          Analysis: ${options.analysisType}
          
          Return: JSON with insights, patterns, recommendations
        `,
        agent_profile: 'local', // Prefer local Ollama on Xeon box
        structured_output_schema: {
          type: 'object',
          properties: {
            insights: { type: 'array', items: { type: 'string' } },
            patterns: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        metadata: {
          requestId,
          profile: 'local',
          source: 'income-engine',
          datasetSize: options.dataSet.length,
        }
      },
      {
        headers: {
          'x-manus-api-key': MANUS_API_KEY,
          'x-request-id': requestId,
        }
      }
    );

    return {
      taskId: response.data.id,
    };
  },
};
```

### 2.2 Usage in Your Apps

```ts
// Example: income-engine FETCHER job
import { manusClient } from '../manus/client';

export async function runFetcherScan() {
  try {
    // Create task (cheap profile, lead scanning)
    const { taskId } = await manusClient.createFetcherTask({
      profile: 'cheap',
    });

    console.log(`FETCHER task created: ${taskId}`);

    // Poll for results
    let results = null;
    let attempts = 0;
    while (!results && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      results = await manusClient.pollTask(taskId);
      attempts++;
    }

    if (results) {
      console.log(`FETCHER found ${results.data.qualified_count} qualified leads`);
      console.log(`Provider used: ${results.metadata.provider}`);
      console.log(`Cost: $${results.metadata.cost}`);
      console.log(`Latency: ${results.metadata.latency}ms`);

      // Log metrics to Hermes
      await logManusMetrics(results.metadata);

      // Process leads
      return results.data;
    } else {
      console.warn('FETCHER task timed out');
      return null;
    }
  } catch (error) {
    console.error('FETCHER scan failed:', error);
    throw error;
  }
}
```

---

## PART 3: HERMES COMPLIANCE BRAIN

### 3.1 Hermes Metrics Logging

Every Manus task result gets logged with cost, latency, and provider info:

```ts
// server/hermes/metricsLogger.ts
import { getDb } from '../db';

export interface ManusMetrics {
  taskId: string;
  profile: 'cheap' | 'fast' | 'max' | 'local';
  provider: string; // 'ollama_cloud', 'openrouter', 'opencode', 'local_ollama'
  latency: number; // ms
  cost: number; // dollars
  tokensUsed: number;
  success: boolean;
  jobType: string; // 'fetcher', 'proposal', 'email', 'batch_analysis'
}

export async function logManusMetrics(metrics: ManusMetrics) {
  const db = await getDb();

  await db.query(
    `INSERT INTO manus_metrics (task_id, profile, provider, latency, cost, tokens_used, success, job_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      metrics.taskId,
      metrics.profile,
      metrics.provider,
      metrics.latency,
      metrics.cost,
      metrics.tokensUsed,
      metrics.success ? 1 : 0,
      metrics.jobType
    ]
  );

  // Check if cost is exceeding budget
  const [result] = await db.query(
    `SELECT SUM(cost) as total_cost FROM manus_metrics WHERE DATE(created_at) = CURDATE()`
  );

  const todayCost = result[0]?.total_cost || 0;
  const opsBudget = await getOpsBudget(); // 63% of revenue

  if (todayCost > opsBudget * 0.1) { // Alert if 10% of monthly budget spent in one day
    console.warn(`⚠️ HERMES: Daily Manus cost ($${todayCost}) is high. Monthly budget: $${opsBudget}`);
  }
}

export async function getManusMetricsSummary(period: 'day' | 'week' | 'month') {
  const db = await getDb();

  const dateFilter = {
    day: 'DATE(created_at) = CURDATE()',
    week: 'WEEK(created_at) = WEEK(NOW())',
    month: 'MONTH(created_at) = MONTH(NOW())',
  }[period];

  const [metrics] = await db.query(
    `SELECT 
       profile,
       provider,
       COUNT(*) as task_count,
       SUM(cost) as total_cost,
       AVG(latency) as avg_latency,
       SUM(tokens_used) as total_tokens,
       SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_tasks
     FROM manus_metrics
     WHERE ${dateFilter}
     GROUP BY profile, provider`
  );

  return metrics;
}

export async function getProviderReliability(provider: string, period: 'day' | 'week' | 'month') {
  const db = await getDb();

  const dateFilter = {
    day: 'DATE(created_at) = CURDATE()',
    week: 'WEEK(created_at) = WEEK(NOW())',
    month: 'MONTH(created_at) = MONTH(NOW())',
  }[period];

  const [result] = await db.query(
    `SELECT 
       COUNT(*) as total_tasks,
       SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_tasks,
       AVG(latency) as avg_latency,
       MAX(latency) as max_latency,
       SUM(cost) as total_cost
     FROM manus_metrics
     WHERE provider = ? AND ${dateFilter}`,
    [provider]
  );

  const row = result[0];
  const successRate = row.total_tasks > 0 ? (row.successful_tasks / row.total_tasks) * 100 : 0;

  return {
    provider,
    successRate: successRate.toFixed(2) + '%',
    avgLatency: row.avg_latency,
    maxLatency: row.max_latency,
    totalCost: row.total_cost,
    totalTasks: row.total_tasks,
  };
}
```

### 3.2 Hermes Cost Control

Hermes watches AI spending and can downgrade profiles if costs spike:

```ts
// server/hermes/costControl.ts
import { getDb } from '../db';
import { getManusMetricsSummary } from './metricsLogger';

export async function shouldDowngradeProfile(currentProfile: 'cheap' | 'fast' | 'max' | 'local'): Promise<'cheap' | 'fast' | 'max' | 'local'> {
  const db = await getDb();

  // Get monthly AI budget (63% of revenue)
  const [revenue] = await db.query(
    `SELECT SUM(gross_amount) as total FROM revenue_events WHERE MONTH(created_at) = MONTH(NOW())`
  );

  const monthlyRevenue = revenue[0]?.total || 0;
  const opsBudget = monthlyRevenue * 0.63;
  const aiBudget = opsBudget * 0.3; // Allocate 30% of ops budget to AI

  // Get current month's AI spending
  const [spending] = await db.query(
    `SELECT SUM(cost) as total FROM manus_metrics WHERE MONTH(created_at) = MONTH(NOW())`
  );

  const monthlySpend = spending[0]?.total || 0;
  const percentUsed = (monthlySpend / aiBudget) * 100;

  // Downgrade if spending is high
  if (percentUsed > 80) {
    console.warn(`⚠️ HERMES: AI spending at ${percentUsed.toFixed(0)}% of budget. Downgrading profiles.`);
    return 'cheap'; // Force cheap profile
  }

  if (percentUsed > 60) {
    if (currentProfile === 'max') return 'fast';
    if (currentProfile === 'fast') return 'cheap';
  }

  return currentProfile;
}

export async function checkProviderFailureRate(provider: string): Promise<boolean> {
  const db = await getDb();

  // Get last 20 tasks for this provider
  const [tasks] = await db.query(
    `SELECT success FROM manus_metrics WHERE provider = ? ORDER BY created_at DESC LIMIT 20`,
    [provider]
  );

  if (tasks.length < 5) return true; // Not enough data, assume OK

  const failureRate = tasks.filter(t => !t.success).length / tasks.length;

  if (failureRate > 0.3) {
    console.warn(`⚠️ HERMES: ${provider} has ${(failureRate * 100).toFixed(0)}% failure rate. Consider downgrading.`);
    return false;
  }

  return true;
}
```

### 3.3 Degraded Mode (If Manus Is Down)

If Manus becomes unavailable, Hermes keeps the mission running:

```ts
// server/hermes/degradedMode.ts
import { getDb } from '../db';

export async function isManusDegraded(): Promise<boolean> {
  const db = await getDb();

  // Check if last 5 Manus tasks failed
  const [tasks] = await db.query(
    `SELECT success FROM manus_metrics ORDER BY created_at DESC LIMIT 5`
  );

  if (tasks.length === 0) return false;

  const allFailed = tasks.every(t => !t.success);
  return allFailed;
}

export async function enterDegradedMode() {
  console.warn('🚨 HERMES: Entering degraded mode. Manus is unavailable.');
  console.warn('  - Lead generation PAUSED');
  console.warn('  - Revenue tracking ACTIVE');
  console.warn('  - Compliance checks ACTIVE');
  console.warn('  - Founder cap enforcement ACTIVE');
  console.warn('  - Kids bucket protection ACTIVE');

  // Disable FETCHER scheduling
  process.env.FETCHER_ENABLED = 'false';

  // Keep compliance running
  // Keep revenue tracking running
  // Keep founder cap enforcement running
}

export async function exitDegradedMode() {
  console.log('✅ HERMES: Exiting degraded mode. Manus is back online.');

  // Re-enable FETCHER scheduling
  process.env.FETCHER_ENABLED = 'true';
}

export async function monitorManuHealth() {
  const isDegraded = await isManusDegraded();

  if (isDegraded && process.env.HERMES_DEGRADED_MODE !== 'true') {
    await enterDegradedMode();
    process.env.HERMES_DEGRADED_MODE = 'true';
  } else if (!isDegraded && process.env.HERMES_DEGRADED_MODE === 'true') {
    await exitDegradedMode();
    process.env.HERMES_DEGRADED_MODE = 'false';
  }
}
```

---

## PART 4: FINANCIAL COMPLIANCE (10/27/63 + FOUNDER CAP)

### 4.1 Revenue Event Recording

Every lead sold = revenue event that gets split:

```ts
// server/compliance/recordRevenue.ts
import { getDb } from '../db';

export async function recordRevenueEvent(event: {
  source: string; // 'lead_sale', 'service_delivery', 'referral', etc.
  grossAmount: number;
  description: string;
}) {
  const db = await getDb();

  // Create revenue event
  const [eventResult] = await db.query(
    `INSERT INTO revenue_events (source, gross_amount, description, created_at)
     VALUES (?, ?, ?, NOW())`,
    [event.source, event.grossAmount, event.description]
  );

  const eventId = eventResult.insertId;

  // Calculate 10/27/63 split
  const kidsAmount = Math.floor(event.grossAmount * 0.10);
  const taxAmount = Math.floor(event.grossAmount * 0.27);
  const opsAmount = event.grossAmount - kidsAmount - taxAmount;

  // Create split record
  await db.query(
    `INSERT INTO revenue_splits (event_id, kids_amount, tax_amount, ops_amount)
     VALUES (?, ?, ?, ?)`,
    [eventId, kidsAmount, taxAmount, opsAmount]
  );

  // Update bucket balances
  await db.query(
    `UPDATE buckets SET balance = balance + ? WHERE name = 'KIDS'`,
    [kidsAmount]
  );

  await db.query(
    `UPDATE buckets SET balance = balance + ? WHERE name = 'TAX'`,
    [taxAmount]
  );

  await db.query(
    `UPDATE buckets SET balance = balance + ? WHERE name = 'OPS_TREASURY'`,
    [opsAmount]
  );

  return {
    eventId,
    kidsAmount,
    taxAmount,
    opsAmount,
    totalAmount: event.grossAmount
  };
}
```

### 4.2 Founder Compensation Cap ($50k Ecosystem-Wide)

```ts
// server/compliance/founderCompensation.ts
import { getDb } from '../db';

const FOUNDER_CAP = 50000;

export async function getFounderCompensationStatus() {
  const db = await getDb();

  const [result] = await db.query(
    `SELECT SUM(amount) as total FROM founder_compensation_log WHERE recipient = 'Joshua Coleman'`
  );

  const totalPaid = result[0]?.total || 0;
  const remaining = FOUNDER_CAP - totalPaid;

  return {
    totalPaid,
    cap: FOUNDER_CAP,
    remaining,
    percentage: (totalPaid / FOUNDER_CAP) * 100,
    canPayMore: remaining > 0
  };
}

export async function recordFounderCompensation(amount: number, description: string) {
  const db = await getDb();

  // Check cap
  const status = await getFounderCompensationStatus();
  if (status.totalPaid + amount > FOUNDER_CAP) {
    throw new Error(`Founder compensation would exceed $${FOUNDER_CAP} cap. Remaining: $${status.remaining}`);
  }

  // Record payment
  await db.query(
    `INSERT INTO founder_compensation_log (recipient, amount, description, paid_at)
     VALUES (?, ?, ?, NOW())`,
    ['Joshua Coleman', amount, description]
  );

  return {
    amountPaid: amount,
    newTotal: status.totalPaid + amount,
    remaining: status.remaining - amount
  };
}
```

### 4.3 Kids Bucket Protection (10% Locked)

```ts
// server/compliance/kidsBucketProtection.ts
import { getDb } from '../db';

export async function getKidsBucketStatus() {
  const db = await getDb();

  const [result] = await db.query(
    `SELECT balance FROM buckets WHERE name = 'KIDS'`
  );

  return {
    balance: result[0]?.balance || 0,
    protected: true,
    purpose: 'Kids in need programs and payouts'
  };
}

export async function validateKidsBucketIntegrity() {
  const db = await getDb();

  // Sum all kids allocations from revenue splits
  const [splits] = await db.query(
    `SELECT SUM(kids_amount) as total_kids FROM revenue_splits`
  );

  // Get current kids bucket balance
  const [bucket] = await db.query(
    `SELECT balance FROM buckets WHERE name = 'KIDS'`
  );

  const expectedBalance = splits[0]?.total_kids || 0;
  const actualBalance = bucket[0]?.balance || 0;

  if (expectedBalance !== actualBalance) {
    throw new Error(
      `Kids bucket integrity check failed. Expected: $${expectedBalance}, Actual: $${actualBalance}`
    );
  }

  return {
    integrity: true,
    balance: actualBalance,
    allRevenueSplit: expectedBalance
  };
}

// Block any attempt to use kids bucket for non-kids purposes
export async function blockKidsBucketMisuse(amount: number, purpose: string) {
  if (purpose !== 'kids_programs' && purpose !== 'kids_payouts') {
    throw new Error(
      `Kids bucket can ONLY be used for kids programs or payouts. Requested: ${purpose}`
    );
  }
}
```

### 4.4 Tax Bucket Protection (27% Reserved)

```ts
// server/compliance/taxBucketProtection.ts
import { getDb } from '../db';

export async function getTaxBucketStatus() {
  const db = await getDb();

  const [result] = await db.query(
    `SELECT balance FROM buckets WHERE name = 'TAX'`
  );

  return {
    balance: result[0]?.balance || 0,
    reserved: true,
    purpose: 'Federal income and self-employment taxes'
  };
}

export async function validateTaxBucketCoverage() {
  const db = await getDb();

  // Get CPA projected tax liability
  const projectedTaxLiability = await getProjectedTaxLiability();

  // Get current tax bucket balance
  const [bucket] = await db.query(
    `SELECT balance FROM buckets WHERE name = 'TAX'`
  );

  const actualBalance = bucket[0]?.balance || 0;

  if (actualBalance < projectedTaxLiability) {
    throw new Error(
      `Tax bucket insufficient. Projected: $${projectedTaxLiability}, Available: $${actualBalance}`
    );
  }

  return {
    coverage: true,
    projectedLiability: projectedTaxLiability,
    available: actualBalance,
    buffer: actualBalance - projectedTaxLiability
  };
}

async function getProjectedTaxLiability() {
  const db = await getDb();
  const [result] = await db.query(
    `SELECT SUM(gross_amount) as total_revenue FROM revenue_events`
  );

  const totalRevenue = result[0]?.total_revenue || 0;
  return Math.floor(totalRevenue * 0.30); // 30% effective tax rate
}
```

### 4.5 Daily Compliance Check

```ts
// server/compliance/dailyCheck.ts
import { getDb } from '../db';
import * as kidsBucket from './kidsBucketProtection';
import * as taxBucket from './taxBucketProtection';
import * as founder from './founderCompensation';

export async function runDailyComplianceCheck() {
  const db = await getDb();
  const issues = [];

  try {
    // 1. Verify 10/27/63 split integrity
    const [splits] = await db.query(
      `SELECT SUM(kids_amount + tax_amount + ops_amount) as total_split,
              SUM(gross_amount) as total_gross
       FROM revenue_splits
       JOIN revenue_events ON revenue_splits.event_id = revenue_events.id`
    );

    if (splits[0].total_split !== splits[0].total_gross) {
      issues.push({
        severity: 'CRITICAL',
        check: '10/27/63 split integrity',
        message: `Split total (${splits[0].total_split}) != Gross total (${splits[0].total_gross})`
      });
    }

    // 2. Verify kids bucket >= 10% of revenue
    const kidsStatus = await kidsBucket.getKidsBucketStatus();
    const [revenue] = await db.query(`SELECT SUM(gross_amount) as total FROM revenue_events`);
    const minKidsAmount = Math.floor((revenue[0]?.total || 0) * 0.10);

    if (kidsStatus.balance < minKidsAmount) {
      issues.push({
        severity: 'CRITICAL',
        check: 'Kids bucket minimum',
        message: `Kids bucket (${kidsStatus.balance}) < 10% of revenue (${minKidsAmount})`
      });
    }

    // 3. Verify tax bucket coverage
    try {
      await taxBucket.validateTaxBucketCoverage();
    } catch (error) {
      issues.push({
        severity: 'CRITICAL',
        check: 'Tax bucket coverage',
        message: error.message
      });
    }

    // 4. Verify founder cap not exceeded
    const founderStatus = await founder.getFounderCompensationStatus();
    if (founderStatus.totalPaid > 50000) {
      issues.push({
        severity: 'CRITICAL',
        check: 'Founder compensation cap',
        message: `Founder paid (${founderStatus.totalPaid}) > $50k cap`
      });
    }

    // 5. Check for negative bucket balances
    const [buckets] = await db.query(`SELECT name, balance FROM buckets`);
    for (const bucket of buckets) {
      if (bucket.balance < 0) {
        issues.push({
          severity: 'CRITICAL',
          check: `${bucket.name} bucket balance`,
          message: `${bucket.name} is negative: ${bucket.balance}`
        });
      }
    }

    // If any critical issues, create blocking Kanban task
    if (issues.length > 0) {
      await createBlockingKanbanTask(issues);
      await notifyJoshua(issues);
    }

    return {
      timestamp: new Date(),
      passed: issues.length === 0,
      issues
    };
  } catch (error) {
    console.error('Compliance check failed:', error);
    throw error;
  }
}

async function createBlockingKanbanTask(issues: any[]) {
  console.log('🚨 HERMES: Creating blocking Kanban task for compliance issues:', issues);
  // This would create a task in your Hermes Kanban that halts new launches
}

async function notifyJoshua(issues: any[]) {
  console.log('📢 HERMES: Notifying Joshua of compliance issues:', issues);
  // This would send a notification to Joshua
}
```

---

## PART 5: HERMES KANBAN BOARD STRUCTURE

### 5.1 Core Lanes

Keep these lanes in your Hermes Kanban:

1. **COMPLIANCE** - Daily checks, revenue splits, bucket balances
2. **INCOME-ENGINE** - FETCHER tasks, lead processing, revenue
3. **FOUNDER SAFETY** - Compensation tracking, burn rate monitoring
4. **KIDS BUCKET** - Allocation tracking, payout planning
5. **GOVERNANCE** - Proposals, voting, veto window
6. **MANUS COORDINATION** - Task orchestration, model routing, cost control
7. **BLOCKED** - Issues that halt progress

### 5.2 Daily Standup Card

```
TITLE: Daily Compliance Check

OWNER: Hermes (Automated)

CHECKLIST:
- [ ] 10/27/63 split integrity verified
- [ ] Kids bucket >= 10% of revenue
- [ ] Tax bucket >= projected liability
- [ ] Founder compensation <= $50k
- [ ] No negative bucket balances
- [ ] All revenue events recorded
- [ ] Manus tasks completed
- [ ] No blocking issues
- [ ] Manus health check (not degraded)

ACTIONS IF FAILED:
1. Create blocking task
2. Notify Joshua
3. Halt new launches
4. Investigate root cause

SUCCESS CRITERIA:
- All checks pass
- No issues raised
- All buckets positive
- Compliance score: 100%
- Manus operational
```

### 5.3 Weekly Manus Metrics Card

```
TITLE: Weekly Manus Metrics (Week of {DATE})

OWNER: Hermes

METRICS:
- Total tasks: N
- Successful tasks: N (X%)
- Total cost: $X
- Avg latency: Xms
- Provider breakdown:
  - Ollama Cloud: N tasks, $X, X% success
  - OpenRouter: N tasks, $X, X% success
  - OpenCode: N tasks, $X, X% success
  - Local Ollama: N tasks, $0, X% success

PROFILE USAGE:
- 'cheap': N tasks (lead scanning)
- 'fast': N tasks (real-time)
- 'max': N tasks (client-facing)
- 'local': N tasks (batch analysis)

COST ANALYSIS:
- Weekly spend: $X
- Monthly projected: $X
- Monthly budget: $X (63% of revenue)
- Utilization: X%

ALERTS:
- [ ] Any provider failures?
- [ ] Cost trending high?
- [ ] Latency issues?
- [ ] Need to downgrade profiles?

ACTIONS:
- [ ] Review provider reliability
- [ ] Adjust profiles if needed
- [ ] Plan cost optimizations
```

---

## PART 6: GITHUB SECRETS REQUIRED

```
MANUS_API_KEY=your_key_here
DATABASE_URL=your_database_url
```

That's it. No individual provider keys. Manus handles all routing.

---

## PART 7: HERMES PERMANENT RULES

**These rules are embedded in Hermes and never change:**

1. **10/27/63 split is sacred** — Every dollar is split. No exceptions.
2. **Kids bucket is protected** — 10% locked, never used for ops or taxes.
3. **Tax bucket is protected** — 27% reserved for taxes, never used for anything else.
4. **Founder cap is $50k** — Joshua's total compensation across all platforms capped at $50k.
5. **Compliance checks run daily** — No exceptions, no skips.
6. **Blocking tasks halt progress** — If compliance fails, new launches stop.
7. **Joshua is notified of all issues** — No silent failures.
8. **All revenue is tracked** — Every dollar recorded, every split verified.
9. **Manus is the only model interface** — Apps never talk to providers directly.
10. **Agent profiles control routing** — Hermes never hand-picks models.
11. **Degraded mode keeps compliance alive** — If Manus is down, revenue tracking and compliance stay running.

---

## DEPLOYMENT CHECKLIST

- [ ] Manus API key configured in GitHub secrets
- [ ] Thin Manus client (`server/manus/client.ts`) implemented
- [ ] All apps use `manusClient` (never direct provider calls)
- [ ] Hermes metrics logging implemented
- [ ] Daily compliance check scheduled
- [ ] Revenue event recording working
- [ ] Founder cap enforcement working
- [ ] Kids bucket protection working
- [ ] Tax bucket protection working
- [ ] Degraded mode implemented
- [ ] Kanban board setup with 7 lanes
- [ ] Database tables created
- [ ] All GitHub secrets configured
- [ ] Ready to launch income-engine

---

## QUICK REFERENCE: WHEN TO USE WHICH PROFILE

| Scenario | Profile | Why |
|----------|---------|-----|
| FETCHER scanning Reddit/Upwork | `'cheap'` | Good enough quality, lowest cost |
| Real-time chat responses | `'fast'` | User waiting, need speed |
| Client proposals, contracts | `'max'` | Money on the line, need best quality |
| Batch analysis on Xeon box | `'local'` | Free, offline, no latency concerns |
| Email drafts | `'fast'` | Async, but need reasonable quality |
| Data processing | `'cheap'` | High volume, quality less critical |

---

**From Manus Agent | Meta/Key to Mission | 2026-05-07 | Version 2.0 (Perplexity-Refined)**

**Hermes, you are the guardian of compliance. You are the protector of kids. You are the keeper of rules. Manus is your model bus. Never bend. Never compromise. The mission depends on your integrity.**

**#UNTILNOKIDINNEED**
**#MANUSFORTHEKIDS**
**#ALWAYSINTEGRITY**
