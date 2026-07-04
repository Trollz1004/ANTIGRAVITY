// Fire-and-forget lead side effects: Slack notify, Hermes memory upsert, Telegram
// broadcast. ALL are env-gated and default-off. A failure in ANY hook must NEVER
// block or delay the lead API response — every call here is invoked without
// awaiting in the request path (see routes/leads.js), and every function below
// swallows its own errors internally as a second layer of defense.

const { WebClient } = require('@slack/web-api');

const slack = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;
const LEADS_SLACK_CHANNEL = process.env.SLACK_CHANNEL_LEADS || process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform';

const HERMES_MEMORY_URL = process.env.HERMES_MEMORY_URL || 'http://localhost:9119/memory/upsert';
const HOOK_TIMEOUT_MS = 5000;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

/**
 * Notify Slack of a lead event (new lead / conversion). No-op if SLACK_BOT_TOKEN
 * is unset. Never throws — errors are logged and swallowed.
 */
async function notifyLeadSlack(lead, event = 'new_lead') {
  if (!slack) return;

  try {
    const label = event === 'converted' ? ':tada: Lead converted' : ':inbox_tray: New lead';
    const text = `${label}: *${lead.name || 'Unknown'}* (${lead.email || 'no email'})\n` +
      `Platform: ${lead.platform || 'n/a'} | Stage: ${lead.stage || lead.status || 'n/a'} | Score: ${lead.score ?? lead.crm_score ?? 'n/a'}`;

    await slack.chat.postMessage({ channel: LEADS_SLACK_CHANNEL, text, mrkdwn: true });
  } catch (err) {
    console.error('[hooks] Slack notify failed (swallowed):', err.message);
  }
}

/**
 * Upsert a lead into Hermes' memory service. No-op if the URL is unreachable —
 * connection-refused is a normal, expected condition (Hermes may not be running)
 * and must not be treated as a crash.
 */
async function upsertHermesMemory(lead, event = 'new_lead') {
  const { signal, cancel } = withTimeout(HOOK_TIMEOUT_MS);

  try {
    await fetch(HERMES_MEMORY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'lead',
        event,
        lead_id: lead.id,
        name: lead.name,
        email: lead.email,
        platform: lead.platform,
        stage: lead.stage || lead.status,
        score: lead.score ?? lead.crm_score ?? null,
        timestamp: new Date().toISOString()
      }),
      signal
    });
  } catch (err) {
    // Includes connection-refused (Hermes not running), timeout, DNS failure, etc.
    console.error('[hooks] Hermes memory upsert failed (swallowed):', err.message);
  } finally {
    cancel();
  }
}

/**
 * Broadcast a lead event directly via the Telegram Bot API. No-op if
 * TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is unset.
 */
async function broadcastTelegram(lead, event = 'new_lead') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !token.trim() || !chatId) return;

  const { signal, cancel } = withTimeout(HOOK_TIMEOUT_MS);

  try {
    const label = event === 'converted' ? 'Lead converted' : 'New lead';
    const text = `${label}: ${lead.name || 'Unknown'} (${lead.email || 'no email'}) — platform: ${lead.platform || 'n/a'}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal
    });
  } catch (err) {
    console.error('[hooks] Telegram broadcast failed (swallowed):', err.message);
  } finally {
    cancel();
  }
}

/**
 * Optional legacy Emergent integration hooks — default-OFF, no hard dependency
 * on any *.emergent* host. Only fire if the corresponding env var is set.
 */
async function notifyEmergentLedger(lead, event = 'new_lead') {
  const url = process.env.EMERGENT_LEDGER_URL;
  if (!url || !url.trim()) return;

  const { signal, cancel } = withTimeout(HOOK_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, lead }),
      signal
    });
  } catch (err) {
    console.error('[hooks] Emergent ledger notify failed (swallowed):', err.message);
  } finally {
    cancel();
  }
}

async function notifyEmergentBroadcast(lead, event = 'new_lead') {
  const url = process.env.EMERGENT_BROADCAST_URL;
  if (!url || !url.trim()) return;

  const { signal, cancel } = withTimeout(HOOK_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, lead }),
      signal
    });
  } catch (err) {
    console.error('[hooks] Emergent broadcast notify failed (swallowed):', err.message);
  } finally {
    cancel();
  }
}

/**
 * Fire every hook without blocking the caller. Call this WITHOUT awaiting from
 * the request path (e.g. `fireLeadHooks(lead, 'new_lead')` with no `await`).
 * Each hook already swallows its own errors, and this wrapper adds one more
 * layer of protection via .catch() so a synchronous throw can never escape.
 */
function fireLeadHooks(lead, event = 'new_lead') {
  Promise.allSettled([
    notifyLeadSlack(lead, event),
    upsertHermesMemory(lead, event),
    broadcastTelegram(lead, event),
    notifyEmergentLedger(lead, event),
    notifyEmergentBroadcast(lead, event)
  ]).catch((err) => {
    // Should be unreachable (allSettled never rejects), but never let a hook
    // failure escape as an unhandled rejection.
    console.error('[hooks] Unexpected fireLeadHooks failure (swallowed):', err.message);
  });
}

module.exports = {
  fireLeadHooks,
  notifyLeadSlack,
  upsertHermesMemory,
  broadcastTelegram,
  notifyEmergentLedger,
  notifyEmergentBroadcast
};
