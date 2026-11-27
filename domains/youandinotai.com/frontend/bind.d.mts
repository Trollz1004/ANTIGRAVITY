export interface DateAppFrontendConfig {
  host: string;
  port: number;
  bind: string;
}

export interface ResolveFrontendBindOptions {
  port?: number;
  bind?: string;
  warn?: ((msg: string) => void) | null;
}

export function loadDateAppFrontendConfig(): DateAppFrontendConfig;

/**
 * Resolves the bind address for the public date-app-web frontend.
 * Never throws: uses an explicit HOST as given (token or not); when HOST is unset,
 * returns 127.0.0.1 without FLEET_SHARED_TOKEN and the fleet bind with it.
 */
export function resolveFrontendBind(
  env?: Record<string, string | undefined>,
  opts?: ResolveFrontendBindOptions
): string;