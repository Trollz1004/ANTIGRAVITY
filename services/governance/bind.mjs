function isLoopbackBindHost(host) {
  const h = String(host || '').trim().toLowerCase();
  return h === '127.0.0.1' || h === 'localhost' || h === '::1';
}

export function isLoopbackRemote(addr) {
  const r = String(addr || '').trim();
  return r === '127.0.0.1' || r === '::1' || r === '::ffff:127.0.0.1';
}

export function readGuardToken(env = process.env) {
  if (!env) return '';
  return String(env.OFFICIAL_VOTE_TOKEN || env.MISSION_OS_TOKEN || env.FLEET_SHARED_TOKEN || '').trim();
}

export function resolveVoteBind(
  env = process.env,
  { port = Number(env?.OFFICIAL_VOTE_PORT || 9134), warn = console.warn } = {}
) {
  const token = readGuardToken(env);
  const explicit = String(env?.OFFICIAL_VOTE_HOST || '').trim();
  if (explicit) {
    if (!token && !isLoopbackBindHost(explicit)) {
      throw new Error(
        `[official-vote-service] Refusing to bind ${explicit} on port ${port} without OFFICIAL_VOTE_TOKEN or MISSION_OS_TOKEN configured.`
      );
    }
    return explicit;
  }
  if (!token) {
    warn?.(
      `[official-vote-service] WARNING: OFFICIAL_VOTE_TOKEN / MISSION_OS_TOKEN is not set; binding 127.0.0.1 on port ${port} (this machine only).`
    );
    return '127.0.0.1';
  }
  return '0.0.0.0';
}
