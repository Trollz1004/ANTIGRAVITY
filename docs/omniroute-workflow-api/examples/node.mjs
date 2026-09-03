// OmniRoute gateway examples — Node.js (ESM), no dependencies beyond global fetch.
// Reads the key from process.env.OMNI_ROUTE_API_KEY at runtime. Never hardcode it.
//
// Usage:
//   OMNI_ROUTE_API_KEY=... node node.mjs
// (or export it beforehand from your own secret store)

const BASE_URL = process.env.OPENAI_COMPAT_BASE_URL || "http://192.168.0.8:20128/v1";
const API_KEY = process.env.OMNI_ROUTE_API_KEY;

if (!API_KEY) {
  console.error("OMNI_ROUTE_API_KEY is not set in the environment. Aborting.");
  process.exit(1);
}

const authHeaders = { Authorization: `Bearer ${API_KEY}` };

async function listModels() {
  console.log("== List models ==");
  const res = await fetch(`${BASE_URL}/models`, { headers: authHeaders });
  const json = await res.json();
  console.log(`status=${res.status} model_count=${json.data?.length}`);
}

async function nonStreamingChat() {
  console.log("== Non-streaming chat completion ==");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto/best-coding",
      messages: [{ role: "user", content: "Say OK." }],
      max_tokens: 5,
      stream: false,
    }),
  });
  console.log(`status=${res.status}`);
  console.log(await res.text());
}

async function streamingChat() {
  console.log("== Streaming chat completion (SSE) ==");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: "auto/best-coding",
      messages: [{ role: "user", content: "Count to 3." }],
      stream: true,
    }),
  });

  console.log(`status=${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }
}

await listModels();
await nonStreamingChat();
await streamingChat();
