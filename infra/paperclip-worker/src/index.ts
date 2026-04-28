// SELF-HOSTED-ONLY GUARD: This non-self-hosted worker MUST NOT
// route MCP traffic. The PAPERCLIP_DB D1 binding declared in
// wrangler.toml is intentionally inert — never query env.PAPERCLIP_DB
// from this file. MCP routing + the cite-upstream registry live in
// /paperclip-mcp/server.py only. See briefings/REPOSITORY_RECORD.md.

const PAPERCLIP_ORIGIN = "http://127.0.0.1:3100";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = env.PAPERCLIP_ORIGIN || PAPERCLIP_ORIGIN;
    const url = new URL(request.url);
    const targetUrl = `${origin}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", url.hostname);
    headers.set("X-Forwarded-Proto", "https");

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
      });

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Paperclip server unreachable", detail: (err as Error).message }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};

interface Env {
  PAPERCLIP_ORIGIN?: string;
}
