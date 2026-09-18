import { describe, it, expect, vi, beforeEach } from 'vitest';

function freshStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

beforeEach(() => {
  globalThis.localStorage = freshStorage();
  vi.resetModules();
});

async function load() {
  return await import('../js/jarvis/tts-client.js');
}

describe('tts-client — mute + voice preference', () => {
  it('defaults to unmuted and the default voice', async () => {
    const { isMuted, getEdgeVoice, DEFAULT_EDGE_VOICE } = await load();
    expect(isMuted()).toBe(false);
    expect(getEdgeVoice()).toBe(DEFAULT_EDGE_VOICE);
  });

  it('persists mute + voice choice', async () => {
    const { setMuted, isMuted, setEdgeVoice, getEdgeVoice } = await load();
    setMuted(true);
    expect(isMuted()).toBe(true);
    setEdgeVoice('en-US-AriaNeural');
    expect(getEdgeVoice()).toBe('en-US-AriaNeural');
  });
});

describe('tts-client — speak()', () => {
  it('is a silent no-op when muted', async () => {
    const { speak } = await load();
    const fallbackSpeak = vi.fn();
    const fetchImpl = vi.fn();
    const r = await speak('hello', { muted: true, fallbackSpeak, fetchImpl });
    expect(r.via).toBe('muted');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fallbackSpeak).not.toHaveBeenCalled();
  });

  it('is a silent no-op for empty text', async () => {
    const { speak } = await load();
    const fetchImpl = vi.fn();
    const r = await speak('   ', { muted: false, fetchImpl });
    expect(r.via).toBe('empty');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('plays server audio on a 200 response', async () => {
    const { speak } = await load();
    const playMock = vi.fn().mockResolvedValue(undefined);
    const AudioCtor = vi.fn(function (url) { this.url = url; this.play = playMock; });
    const createObjectURL = vi.fn(() => 'blob:fake');
    const fetchImpl = vi.fn(async () => ({ status: 200, ok: true, blob: async () => new Blob(['x']) }));
    const fallbackSpeak = vi.fn();
    const r = await speak('status report', { fetchImpl, AudioCtor, createObjectURL, fallbackSpeak, muted: false });
    expect(r.via).toBe('edge-tts');
    expect(fetchImpl).toHaveBeenCalledWith('/api/tts', expect.objectContaining({ method: 'POST' }));
    expect(playMock).toHaveBeenCalled();
    expect(fallbackSpeak).not.toHaveBeenCalled();
  });

  it('falls back to the browser voice on a 204 (no engine available)', async () => {
    const { speak } = await load();
    const fetchImpl = vi.fn(async () => ({ status: 204, ok: false, headers: { get: () => 'edge-tts unavailable' } }));
    const fallbackSpeak = vi.fn();
    const r = await speak('hi', { fetchImpl, fallbackSpeak, muted: false });
    expect(r.via).toBe('browser-fallback');
    expect(fallbackSpeak).toHaveBeenCalledWith('hi');
  });

  it('falls back to the browser voice on a network error', async () => {
    const { speak } = await load();
    const fetchImpl = vi.fn(async () => { throw new Error('ECONNREFUSED'); });
    const fallbackSpeak = vi.fn();
    const r = await speak('hi', { fetchImpl, fallbackSpeak, muted: false });
    expect(r.via).toBe('browser-fallback');
    expect(fallbackSpeak).toHaveBeenCalledWith('hi');
  });

  it('falls back when no Audio element is available in this environment', async () => {
    const { speak } = await load();
    const fetchImpl = vi.fn(async () => ({ status: 200, ok: true, blob: async () => new Blob(['x']) }));
    const fallbackSpeak = vi.fn();
    const r = await speak('hi', { fetchImpl, fallbackSpeak, muted: false, AudioCtor: null, createObjectURL: null });
    expect(r.via).toBe('browser-fallback');
    expect(fallbackSpeak).toHaveBeenCalled();
  });
});
