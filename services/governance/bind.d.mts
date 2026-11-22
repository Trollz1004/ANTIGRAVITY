export function isLoopbackRemote(addr: string | undefined): boolean;
export function readGuardToken(env?: Record<string, string | undefined>): string;
export function resolveVoteBind(
  env?: Record<string, string | undefined>,
  opts?: { port?: number; warn?: ((msg: string) => void) | null }
): string;
