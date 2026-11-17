export function loadDateAppFrontendConfig(): {
  host: string;
  port: number;
  bind: string;
};
export function resolveFrontendBind(
  env?: Record<string, string | undefined>,
  opts?: { port?: number; bind?: string; warn?: ((msg: string) => void) | null }
): string;
