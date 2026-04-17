export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === '/health') {
      return json(
        {
          ok: true,
          surface: 'api.aidoesitall.website',
          status: 'guarded',
          mode: 'metadata-only',
          timestamp: new Date().toISOString(),
        },
        200,
      );
    }

    return json(
      {
        name: 'ANTIGRAVITY API Guard',
        version: '2026-04-01',
        public_api: false,
        status: 'reserved',
        message:
          'This hostname is not an active public customer API. Use the authenticated workspace or the live public product sites instead.',
        workspace: 'https://mcp.youandinotai.com',
        gateway: 'https://dashboard.aidoesitall.website',
        public_sites: ['https://youandinotai.com', 'https://onlinerecycle.org', 'https://ai-solutions.store'],
        timestamp: new Date().toISOString(),
      },
      200,
    );
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
  };
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}
