import { useEffect, useState } from 'react';
import { apiGet, type Envelope } from './api';

export function usePoll<T = any>(path: string, interval = 10000): Envelope<T> & { loading: boolean } {
  const [data, setData] = useState<Envelope<T> & { loading: boolean }>({
    status: 'unreachable',
    checked_at: '',
    latency_ms: 0,
    details: null as any,
    error: null,
    loading: true,
  });
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const tick = async () => {
      const result = await apiGet<T>(path);
      if (!cancelled) setData({ ...result, loading: false });
    };
    tick();
    const id = setInterval(tick, interval);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [path, interval]);
  return data;
}
