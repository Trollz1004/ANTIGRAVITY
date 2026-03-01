/**
 * Cloudflare Worker: Gemini API Proxy
 * Transparently proxies @google/genai SDK calls to Gemini API
 * with the real API key stored as a Worker secret.
 *
 * The SDK sends: https://this-worker.dev/v1beta/models/gemini-2.0-flash:generateContent?key=DUMMY
 * We forward:    https://generativelanguage.googleapis.com/v1beta/models/...?key=REAL_KEY
 */
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-goog-api-key, x-goog-api-client',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Build the real Gemini URL, replacing any client-provided key
    const geminiUrl = new URL(`https://generativelanguage.googleapis.com${url.pathname}`);
    geminiUrl.searchParams.set('key', env.GEMINI_API_KEY);
    // Copy other query params except key
    for (const [k, v] of url.searchParams) {
      if (k !== 'key') geminiUrl.searchParams.set(k, v);
    }

    const headers = new Headers(request.headers);
    headers.delete('x-goog-api-key');
    headers.set('x-goog-api-key', env.GEMINI_API_KEY);

    const response = await fetch(geminiUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...corsHeaders,
      },
    });
  },
};
