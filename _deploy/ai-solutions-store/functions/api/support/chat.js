const DEFAULT_REPLY = "Message logged for AI-Solutions support. If this needs a human, escalation is flagged for Hermes/human step-in.";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function shouldEscalate(message) {
  return /\b(human|hermes|escalate|urgent|broken|refund|failed|error|lawsuit|chargeback|step in|help)\b/i.test(message);
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const startedAt = new Date().toISOString();
  let body;
  try {
    body = await context.request.json();
  } catch (_) {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const sessionId = String(body.sessionId || "").slice(0, 120) || crypto.randomUUID();
  const message = String(body.message || "").trim().slice(0, 4000);
  const source = String(body.source || "ai-solutions.store").slice(0, 120);
  if (!message) return json({ ok: false, error: "message_required" }, 400);

  const upstreamUrl = context.env.SUPPORTCLAW_URL;
  const upstreamToken = context.env.SUPPORTCLAW_TOKEN;
  const escalation = shouldEscalate(message);
  const logRecord = { sessionId, source, message, should_escalate: escalation, timestamp: startedAt };
  console.log("ai-solutions support chat", JSON.stringify(logRecord));

  if (upstreamUrl) {
    try {
      const headers = { "content-type": "application/json" };
      if (upstreamToken) headers.authorization = `Bearer ${upstreamToken}`;
      const upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, message, source }),
      });
      const text = await upstream.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { reply: text };
      }
      if (!upstream.ok) throw new Error(`SupportClaw ${upstream.status}: ${text.slice(0, 200)}`);
      return json({
        ok: true,
        sessionId,
        source,
        reply: data.reply || DEFAULT_REPLY,
        should_escalate: Boolean(data.should_escalate || escalation),
        category: data.category || "general",
        escalation_reason: data.escalation_reason || (escalation ? "keyword_match" : ""),
        timestamp: data.timestamp || startedAt,
      });
    } catch (error) {
      console.log("supportclaw proxy failed", String(error));
      return json({
        ok: true,
        sessionId,
        source,
        reply: "SupportClaw bridge is not reachable from this deployment yet. Your message was logged and escalation is flagged.",
        should_escalate: true,
        category: "technical",
        escalation_reason: "supportclaw_unreachable",
        timestamp: startedAt,
      });
    }
  }

  return json({
    ok: true,
    sessionId,
    source,
    reply: DEFAULT_REPLY,
    should_escalate: escalation,
    category: escalation ? "escalation" : "general",
    escalation_reason: escalation ? "keyword_match" : "",
    timestamp: startedAt,
  });
}
