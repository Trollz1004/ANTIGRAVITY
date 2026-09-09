// onemin-shim — OpenAI-compatible front for the 1min.ai proprietary API.
//
// 1min.ai has NO OpenAI-compatible endpoint (verified 2026-08-19: /v1/* all 404;
// only POST /api/chat-with-ai exists, speaking UNIFY_CHAT_WITH_AI). This shim
// presents POST /v1/chat/completions + GET /v1/models on loopback so OmniRoute
// can register 1min.ai as a standard custom OpenAI connection.
//
// SECRETS: this process holds none. The incoming `Authorization: Bearer <key>`
// (set in OmniRoute's encrypted connection config) is forwarded upstream as
// both `API-KEY` and `Authorization` headers. Never log or persist the key.
//
// Run: node server.mjs   (ONEMIN_SHIM_PORT=20130, binds 127.0.0.1 only)

import http from 'node:http';

const PORT = Number(process.env.ONEMIN_SHIM_PORT || 20130);
const HOST = process.env.ONEMIN_SHIM_HOST || '127.0.0.1';
const UPSTREAM = process.env.ONEMIN_UPSTREAM || 'https://api.1min.ai';
const TIMEOUT_MS = Number(process.env.ONEMIN_TIMEOUT_MS || 120000);

// Informative only — the `model` field is forwarded to 1min.ai verbatim, so any
// id the account supports works even if it is not listed here.
const KNOWN_MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'o3-mini',
  'claude-3-5-sonnet-20240620', 'claude-3-5-haiku-20241022',
  'gemini-2.0-flash', 'gemini-1.5-pro',
  'mistral-large-latest', 'meta/meta-llama-3.1-405b-instruct',
];

function openaiError(res, status, message, type = 'invalid_request_error') {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: { message, type, code: status } }));
}

function bearerFrom(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const xkey = req.headers['x-api-key'];
  return typeof xkey === 'string' && xkey.trim() ? xkey.trim() : null;
}

// Flatten an OpenAI messages[] array into 1min.ai's single prompt string.
function flattenMessages(messages) {
  const parts = [];
  for (const m of messages || []) {
    let text = '';
    if (typeof m.content === 'string') text = m.content;
    else if (Array.isArray(m.content)) {
      text = m.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n');
    }
    if (!text) continue;
    parts.push(m.role === 'user' && parts.length === 0 && (messages.length === 1)
      ? text
      : `${String(m.role || 'user').toUpperCase()}: ${text}`);
  }
  return parts.join('\n\n');
}

// Chars/4 heuristic — 1min.ai does not return token counts. Documented as
// ESTIMATED in the README; do not treat as billing truth.
const estTokens = (s) => Math.ceil((s || '').length / 4);

function chatCompletionBody(model, content, promptText) {
  return {
    id: `chatcmpl-onemin-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: {
      prompt_tokens: estTokens(promptText),
      completion_tokens: estTokens(content),
      total_tokens: estTokens(promptText) + estTokens(content),
    },
  };
}

async function handleChat(req, res, body) {
  const key = bearerFrom(req);
  if (!key) return openaiError(res, 401, 'Missing API key: send Authorization: Bearer <1min.ai key>', 'authentication_error');

  let parsed;
  try { parsed = JSON.parse(body); } catch { return openaiError(res, 400, 'Invalid JSON body'); }
  const { model, messages, stream } = parsed;
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return openaiError(res, 400, "Body must include 'model' and non-empty 'messages'");
  }

  const prompt = flattenMessages(messages);
  const upstreamBody = JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model,
    promptObject: { prompt },
  });
  const headers = {
    'content-type': 'application/json',
    'API-KEY': key,
    'authorization': `Bearer ${key}`,
  };

  const url = `${UPSTREAM}/api/chat-with-ai${stream ? '?isStreaming=true' : ''}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(url, { method: 'POST', headers, body: upstreamBody, signal: ac.signal });
  } catch (e) {
    clearTimeout(timer);
    return openaiError(res, 502, `1min.ai unreachable: ${e.message}`, 'api_error');
  }

  if (!upstream.ok) {
    clearTimeout(timer);
    const text = await upstream.text().catch(() => '');
    return openaiError(res, upstream.status === 401 ? 401 : 502,
      `1min.ai error ${upstream.status}: ${text.slice(0, 300)}`, 'api_error');
  }

  if (!stream) {
    let data;
    try { data = await upstream.json(); } catch {
      clearTimeout(timer);
      return openaiError(res, 502, '1min.ai returned non-JSON response', 'api_error');
    }
    clearTimeout(timer);
    const result = data?.aiRecord?.aiRecordDetail?.resultObject;
    const content = Array.isArray(result) ? result.join('') : (typeof result === 'string' ? result : '');
    if (!content) {
      // Fail closed like the ballot lesson: empty upstream payload is an error, not a silent ''.
      return openaiError(res, 502, '1min.ai returned an empty result payload', 'api_error');
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(chatCompletionBody(model, content, prompt)));
  }

  // Streaming: translate 1min SSE (event: content/result/done/error) to OpenAI chunks.
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  const chunkId = `chatcmpl-onemin-${Date.now().toString(36)}`;
  const sendChunk = (delta, finish = null) => {
    res.write(`data: ${JSON.stringify({
      id: chunkId, object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000), model,
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`);
  };
  sendChunk({ role: 'assistant' });

  const decoder = new TextDecoder();
  let buf = '';
  let sawError = false;
  try {
    for await (const raw of upstream.body) {
      buf += decoder.decode(raw, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const block = buf.slice(0, idx); buf = buf.slice(idx + 2);
        let event = 'message', data = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (event === 'content' && data) {
          try { sendChunk({ content: JSON.parse(data).content ?? '' }); } catch { /* skip bad chunk */ }
        } else if (event === 'error') {
          sawError = true;
          sendChunk({ content: '' }, 'stop');
        }
      }
    }
  } catch { sawError = true; }
  clearTimeout(timer);
  if (!sawError) sendChunk({}, 'stop');
  res.write('data: [DONE]\n\n');
  res.end();
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const url = (req.url || '').split('?')[0];
  try {
    if (req.method === 'GET' && (url === '/v1/models' || url === '/models')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        object: 'list',
        data: KNOWN_MODELS.map((id) => ({ id, object: 'model', owned_by: '1min.ai' })),
      }));
    } else if (req.method === 'GET' && url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'onemin-shim', upstream: UPSTREAM }));
    } else if (req.method === 'POST' && (url === '/v1/chat/completions' || url === '/chat/completions')) {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 10_000_000) req.destroy(); });
      req.on('end', () => handleChat(req, res, body).catch((e) => {
        if (!res.headersSent) openaiError(res, 500, e.message, 'api_error');
        else res.end();
      }));
      return;
    } else {
      openaiError(res, 404, `No route: ${req.method} ${url}`);
    }
  } finally {
    if (req.method !== 'POST') {
      console.log(`${req.method} ${url} ${Date.now() - started}ms`);
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`onemin-shim listening on http://${HOST}:${PORT} -> ${UPSTREAM} (loopback only)`);
});
