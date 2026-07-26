const http = require('http');
const net = require('net');

const listenHost = process.env.PAPERCLIP_PRIVATE_PROXY_HOST || '127.0.0.1';
const listenPort = Number(process.env.PAPERCLIP_PRIVATE_PROXY_PORT || 3110);
const targetHost = process.env.PAPERCLIP_TARGET_HOST || '127.0.0.1';
const targetPort = Number(process.env.PAPERCLIP_TARGET_PORT || 3100);
const user = process.env.PAPERCLIP_BASIC_USER || 'codex';
const basicPass = process.env.PAPERCLIP_BASIC_PASSWORD || process.env.PAPERCLIP_CODEX_AUTH_TOKEN;
const codexToken = process.env.PAPERCLIP_CODEX_AUTH_TOKEN || basicPass;

if (!basicPass && !codexToken) {
  console.error('PAPERCLIP_CODEX_AUTH_TOKEN or PAPERCLIP_BASIC_PASSWORD is required');
  process.exit(1);
}

function basic(value) {
  return 'Basic ' + Buffer.from(`${user}:${value}`, 'utf8').toString('base64');
}

function acceptedAuthHeaders() {
  const accepted = new Set();
  if (basicPass) accepted.add(basic(basicPass));
  if (codexToken) {
    accepted.add(`Bearer ${codexToken}`);
    accepted.add(basic(codexToken));
  }
  return accepted;
}

function isAuthed(req) {
  const header = req.headers.authorization;
  return Boolean(header && acceptedAuthHeaders().has(header));
}

function deny(res) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Paperclip Codex"',
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Paperclip Codex sign in required.');
}

function scrubHopByHop(headers) {
  const next = { ...headers, host: `${targetHost}:${targetPort}` };
  delete next['proxy-authorization'];
  delete next['authorization'];
  return next;
}

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('ok');
    return;
  }

  if (!isAuthed(req)) {
    deny(res);
    return;
  }

  const upstream = http.request({
    host: targetHost,
    port: targetPort,
    method: req.method,
    path: req.url,
    headers: scrubHopByHop(req.headers),
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Paperclip upstream unavailable.');
  });

  req.pipe(upstream);
});

server.on('upgrade', (req, socket, head) => {
  if (!isAuthed(req)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Basic realm="Paperclip Codex"\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }

  const upstream = net.connect(targetPort, targetHost, () => {
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const name = req.rawHeaders[i];
      const value = req.rawHeaders[i + 1];
      lines.push(`${name}: ${value}`);
    }
    upstream.write(lines.join('\r\n') + '\r\n\r\n');
    if (head && head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });

  upstream.on('error', () => socket.destroy());
});

server.listen(listenPort, listenHost, () => {
  console.log(`paperclip codex auth proxy listening on http://${listenHost}:${listenPort}`);
});

