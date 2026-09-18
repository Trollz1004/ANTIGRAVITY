/**
 * Local Ollama brain (127.0.0.1:11434, RX 6800 over Vulkan). The NDJSON chat
 * stream is converted to the same delta/result events the Claude bridge emits,
 * so the page has one stream reader. Pure helpers; fetch is injected.
 */
const MODEL_NAME = /^[A-Za-z0-9._:/-]{1,80}$/;

export function ollamaLineToEvent(line) {
  const t = String(line || '').trim();
  if (!t) return null;
  let j;
  try { j = JSON.parse(t); } catch { return null; }
  if (j.error) return { type: 'error', message: String(j.error) };
  if (j.done) return { type: 'result', ok: true, model: j.model || '', tokens: j.eval_count, durationNs: j.total_duration };
  const text = (j.message && j.message.content) || j.response || '';
  return { type: 'delta', text };
}

/** Base URL from JARVIS_OLLAMA_URL, then OLLAMA_HOST (Ollama's own variable), else loopback. A value
 *  that is not a URL (for example a cloud API key stored under a similar name) is ignored. */
export function resolveOllamaBase(values = {}) {
  for (const name of ['JARVIS_OLLAMA_URL', 'OLLAMA_HOST']) {
    let v = String(values[name] || '').trim();
    if (!v) continue;
    if (/^[A-Za-z0-9.-]+(:\d+)?$/.test(v)) v = 'http://' + v; // host:port form
    if (/^https?:\/\//.test(v)) return v.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:11434';
}

export function pickOllamaModel({ requested = '', configured = '', tags = [] } = {}) {
  if (requested && MODEL_NAME.test(requested)) return requested;
  if (configured && MODEL_NAME.test(configured)) return configured;
  const local = tags.filter((t) => !/[:-]cloud$/i.test(t));
  return local[0] || '';
}

export async function streamOllamaChat({ base = 'http://127.0.0.1:11434', model, messages, fetch: fetchImpl = globalThis.fetch, onEvent = () => {}, signal } = {}) {
  const r = await fetchImpl(base.replace(/\/$/, '') + '/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }), signal,
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  let buf = '';
  let text = '';
  let usedModel = model;
  const decoder = new TextDecoder();
  const handle = (line) => {
    const ev = ollamaLineToEvent(line);
    if (!ev) return;
    if (ev.type === 'delta') { if (!ev.text) return; text += ev.text; onEvent(ev); return; }
    if (ev.type === 'result') { usedModel = ev.model || usedModel; onEvent({ ...ev, text, model: usedModel }); return; }
    onEvent(ev);
  };
  for await (const chunk of r.body) {
    buf += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, nl)); buf = buf.slice(nl + 1); }
  }
  if (buf.trim()) handle(buf);
  return { text, model: usedModel };
}
