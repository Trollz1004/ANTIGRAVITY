export function isLoopbackRemote(addr: string | undefined): boolean;
export function constantTimeEqualSecret(expected: string, candidate: string): boolean;
export function readMcpGuardToken(env?: Record<string, string | undefined>): string;
export function resolveMissionMcpBind(
  env?: Record<string, string | undefined>,
  opts?: { port?: number; warn?: ((msg: string) => void) | null }
): string;
export function verifyTokenHeader(
  headers: Record<string, string | string[] | undefined>,
  opts?: { env?: Record<string, string | undefined>; remoteAddress?: string }
): { ok: boolean; status: number; error?: string };
