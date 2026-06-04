const UPSTREAM_BASE = 'https://dateapp-backend-io5tscl75a-ue.a.run.app';

function buildUpstreamPath(pathname) {
  if (pathname.startsWith('/webhooks/')) {
    return `/api/v1${pathname}`;
  }
  return pathname;
}

async function proxyUpstream(url, request) {
  const headers = new Headers(request.headers);
  const requestUrl = new URL(request.url);
  headers.set('x-forwarded-host', requestUrl.host);
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''));
  headers.set('x-original-url', request.url);

  return fetch(url, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/v1/') && !url.pathname.startsWith('/webhooks/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      const upstreamUrl = new URL(buildUpstreamPath(url.pathname), UPSTREAM_BASE);
      upstreamUrl.search = url.search;
      return proxyUpstream(upstreamUrl.toString(), request);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unexpected worker error';
      return new Response(JSON.stringify({ detail }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
  },
};
