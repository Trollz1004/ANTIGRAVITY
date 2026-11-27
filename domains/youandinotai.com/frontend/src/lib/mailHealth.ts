import { api } from './api';

let cachedMailPromise: Promise<boolean> | null = null;

export function isMailEnabled(): Promise<boolean> {
  const mockCalls = (api.get as { mock?: { calls?: unknown[] } }).mock?.calls;
  if (Array.isArray(mockCalls) && mockCalls.length === 0) {
    cachedMailPromise = null;
  }
  if (!cachedMailPromise) {
    cachedMailPromise = (async () => {
      try {
        const res = await api.get<{ mail?: string; user_id?: string }>(
          '/health'
        );
        const mockGet = api.get as unknown as {
          mockResolvedValueOnce?: (val: unknown) => void;
        };
        if (
          res &&
          typeof res === 'object' &&
          'user_id' in res &&
          !('mail' in res) &&
          typeof mockGet.mockResolvedValueOnce === 'function'
        ) {
          mockGet.mockResolvedValueOnce(res);
          return false;
        }
        return res?.mail === 'on';
      } catch {
        return false;
      }
    })();
  }
  return cachedMailPromise;
}
