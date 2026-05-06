export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export type Envelope<T = any> = {
  status: 'ok' | 'degraded' | 'unreachable';
  checked_at: string;
  latency_ms: number;
  details: T;
  error: string | null;
};

const UNREACHABLE: Envelope = {
  status: 'unreachable',
  checked_at: '',
  latency_ms: 0,
  details: null,
  error: 'no response',
};

export async function apiGet<T = any>(path: string, timeout = 2500): Promise<Envelope<T>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return { ...UNREACHABLE, error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e: any) {
    clearTimeout(id);
    return { ...UNREACHABLE, error: e?.message ?? 'fetch failed' };
  }
}

export async function apiPost<T = any>(path: string, body: any, timeout = 5000): Promise<T | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(id);
    return null;
  }
}

export async function fetchWithTimeout(url: string, init?: RequestInit, timeout = 2500): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error('Network response not ok');
    return await response.json();
  } catch {
    clearTimeout(id);
    return { status: 'unreachable' };
  }
}
