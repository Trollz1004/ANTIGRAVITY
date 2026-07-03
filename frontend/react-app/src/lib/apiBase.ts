const PRODUCTION_API_BASE = 'https://api.youandinotai.com/api/v1';
const LOCAL_API_BASE = '/api/v1';

export function resolveApiBase(
  configuredApiUrl: string | undefined,
  isProduction: boolean
): string {
  const configured = configuredApiUrl?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return isProduction ? PRODUCTION_API_BASE : LOCAL_API_BASE;
}

export const API_BASE = resolveApiBase(
  import.meta.env.VITE_API_URL,
  import.meta.env.PROD
);
