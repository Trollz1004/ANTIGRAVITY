import crypto from 'node:crypto';

function isLoopbackBindHost(host) {
  const h = String(host || '').trim().toLowerCase();
  return h === '127.0.0.1' || h === 'localhost' || h === '::1';
}

export function isLoopbackRemote(addr) {
  const r = String(addr || '').trim();
  return r === '127.0.0.1' || r === '::1' || r === '::ffff:127.0.0.1';
}

export function constantTimeEqualSecret(expected, candidate) {
  const a = Buffer.from(String(expected || ''), 'utf8');
  const b = Buffer.from(String(candidate || ''), 'utf8');
  const len = Math.max(a.length, b.length, 1);
  const padA = Buffer.alloc(len);
  const padB = Buffer.alloc(len);
  a.copy(padA);
  b.copy(padB);
  return crypto.timingSafeEqual(padA, padB) && a.length === b.length;
}

export function readMcpGuardToken(env = process.env) {
  if (!env) return '';
  return String(env.MISSION_MCP_TOKEN || env.MISSION_OS_TOKEN || env.FLEET_SHARED_TOKEN || '').trim();
}

export function resolveMissionMcpBind(
  env = process.env,
  { port = parseInt(env?.MISSION_MCP_PORT ?? '3901', 10), warn = console.warn } = {}
) {
  const token = readMcpGuardToken(env);
  const explicit = String(env?.MISSION_MCP_HOST || '').trim();
  if (explicit) {
    if (!token && !isLoopbackBindHost(explicit)) {
      throw new Error(
        `[mission-mcp] Refusing to bind ${explicit} on port ${port} without MISSION_MCP_TOKEN or MISSION_OS_TOKEN configured.`
      );
    }
    return explicit;
  }
  if (!token) {
    warn?.(
      `[mission-mcp] WARNING: MISSION_MCP_TOKEN / MISSION_OS_TOKEN is not set; binding 127.0.0.1 on port ${port} (this machine only).`
    );
    return '127.0.0.1';
  }
  return '0.0.0.0';
}

export function verifyTokenHeader(headers, { env = process.env, remoteAddress } = {}) {
  const expected = readMcpGuardToken(env);
  const loopbackCaller = isLoopbackRemote(remoteAddress);
  if (!expected) {
    if (loopbackCaller) {
      return { ok: true, status: 200 };
    }
    return { ok: false, status: 503, error: 'MISSION_MCP_TOKEN / MISSION_OS_TOKEN not configured' };
  }
  const direct = headers?.['x-mission-os-token'] ?? headers?.['x-mcp-token'] ?? headers?.['x-fleet-token'];
  const directStr = Array.isArray(direct) ? direct[0] : direct;
  const authHeader = headers?.authorization;
  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const trimmed = String(auth || '').trim();
  const bearer = trimmed.slice(0, 7).toLowerCase() === 'bearer ' ? trimmed.slice(7).trim() : '';
  const candidate = (directStr ? directStr.trim() : '') || bearer;
  if (!candidate || !constantTimeEqualSecret(expected, candidate)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true, status: 200 };
}
