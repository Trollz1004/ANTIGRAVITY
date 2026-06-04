import { useState, useEffect, useCallback } from 'react';

export interface RateLimitData {
  requestsThisMinute: number;
  requestsPerMinute: number;
  resetInSeconds: number;
  totalRequestsToday: number;
  topEndpoints: Array<{ path: string; count: number }>;
}

export interface RateLimitHookResult {
  data: RateLimitData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE = '/api/v1/rate-limits';

export function useRateLimits(): RateLimitHookResult {
  const [data, setData] = useState<RateLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      setData(json as RateLimitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Provide fallback data so the UI still renders
      setData({
        requestsThisMinute: 0,
        requestsPerMinute: 60,
        resetInSeconds: 60,
        totalRequestsToday: 0,
        topEndpoints: [
          { path: '/api/v1/health', count: 0 },
          { path: '/api/v1/auth/login', count: 0 },
          { path: '/api/v1/users/me', count: 0 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
