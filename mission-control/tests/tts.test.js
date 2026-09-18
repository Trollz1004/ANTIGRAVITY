import { describe, it, expect, vi } from 'vitest';
import { cacheKey, readCached, runEdgeTts, piperAvailable, synthesizeSpeech, EDGE_VOICE_IDS, DEFAULT_VOICE } from '../lib/tts.mjs';

describe('cacheKey', () => {
  it('is stable for the same text+voice and differs otherwise', () => {
    expect(cacheKey('hello', 'en-US-GuyNeural')).toBe(cacheKey('hello', 'en-US-GuyNeural'));
    expect(cacheKey('hello', 'en-US-GuyNeural')).not.toBe(cacheKey('hello', 'en-US-AriaNeural'));
    expect(cacheKey('hello', 'en-US-GuyNeural')).not.toBe(cacheKey('bye', 'en-US-GuyNeural'));
  });
});

describe('readCached', () => {
  it('returns the file when younger than 24h', () => {
    const buf = Buffer.from('audio-bytes');
    const r = readCached({
      cacheDir: '/x', key: 'k', now: () => 1000 * 60 * 60,
      exists: () => true, stat: () => ({ mtimeMs: 0 }), readFile: () => buf,
    });
    expect(r).toBe(buf);
  });

  it('returns null when older than 24h', () => {
    const r = readCached({
      cacheDir: '/x', key: 'k', now: () => 1000 * 60 * 60 * 25,
      exists: () => true, stat: () => ({ mtimeMs: 0 }), readFile: () => Buffer.from('x'),
    });
    expect(r).toBeNull();
  });

  it('returns null when the file does not exist', () => {
    expect(readCached({ cacheDir: '/x', key: 'k', exists: () => false })).toBeNull();
  });
});

describe('runEdgeTts', () => {
  it('resolves ok on a clean exit', async () => {
    const exec = (bin, args, opts, cb) => { cb(null, '', ''); return { on() {} }; };
    const r = await runEdgeTts({ text: 'hi', voice: 'en-US-GuyNeural', outFile: '/x.mp3', exec });
    expect(r.ok).toBe(true);
  });

  it('resolves a trimmed error, never throws, on failure', async () => {
    const exec = (bin, args, opts, cb) => { cb(new Error('boom'), '', 'edge-tts: network error'); return { on() {} }; };
    const r = await runEdgeTts({ text: 'hi', voice: 'en-US-GuyNeural', outFile: '/x.mp3', exec });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/network error/);
  });
});

describe('piperAvailable', () => {
  it('is false with no vendor dir', () => {
    expect(piperAvailable({ vendorDir: '', exists: () => false })).toBe(false);
  });
  it('is false when the dir exists but has no .onnx model', () => {
    expect(piperAvailable({ vendorDir: '/v', exists: () => true, readdir: () => ['README.md'] })).toBe(false);
  });
  it('is true only with an actual .onnx model file', () => {
    expect(piperAvailable({ vendorDir: '/v', exists: () => true, readdir: () => ['en_US-model.onnx'] })).toBe(true);
  });
});

describe('synthesizeSpeech', () => {
  function fakeFs({ cached = null } = {}) {
    return {
      exists: () => Boolean(cached),
      mkdir: () => {},
      stat: () => ({ mtimeMs: Date.now() }),
      readFile: () => cached || Buffer.from('rendered-audio'),
    };
  }

  it('serves a fresh cache hit without shelling out', async () => {
    const exec = vi.fn();
    const r = await synthesizeSpeech({ text: 'status report', voice: 'en-US-AriaNeural', cacheDir: '/c', exec, fsImpl: fakeFs({ cached: Buffer.from('cached-audio') }) });
    expect(r.ok).toBe(true);
    expect(r.cached).toBe(true);
    expect(exec).not.toHaveBeenCalled();
  });

  it('falls back to the default voice for an unknown voice id', async () => {
    const exec = (bin, args, opts, cb) => cb(null, '', '');
    const r = await synthesizeSpeech({ text: 'hi', voice: 'not-a-real-voice', cacheDir: '/c', exec, fsImpl: fakeFs() });
    expect(r.voice).toBe(DEFAULT_VOICE);
  });

  it('runs edge-tts on a cache miss and returns the rendered buffer', async () => {
    const exec = (bin, args, opts, cb) => cb(null, '', '');
    const r = await synthesizeSpeech({ text: 'hello there', voice: 'en-US-GuyNeural', cacheDir: '/c', exec, fsImpl: fakeFs() });
    expect(r.ok).toBe(true);
    expect(r.engine).toBe('edge-tts');
    expect(r.cached).toBe(false);
    expect(Buffer.isBuffer(r.buffer)).toBe(true);
  });

  it('reports no engine (204 case) when edge-tts fails and no piper model exists', async () => {
    const exec = (bin, args, opts, cb) => cb(new Error('ENOENT'), '', 'edge-tts not found');
    const r = await synthesizeSpeech({ text: 'hi', cacheDir: '/c', vendorDir: '/nope', exec, fsImpl: { ...fakeFs(), exists: () => false } });
    expect(r.ok).toBe(false);
    expect(r.engine).toBeNull();
    expect(r.reason).toMatch(/no piper model/);
  });

  it('rejects empty text before touching the filesystem or a process', async () => {
    const exec = vi.fn();
    const r = await synthesizeSpeech({ text: '   ', cacheDir: '/c', exec, fsImpl: fakeFs() });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/text is required/);
    expect(exec).not.toHaveBeenCalled();
  });

  it('exposes exactly the six dispatch-named voices', () => {
    expect(EDGE_VOICE_IDS.sort()).toEqual([
      'en-US-AndrewNeural', 'en-US-AriaNeural', 'en-US-BrianNeural',
      'en-US-ChristopherNeural', 'en-US-GuyNeural', 'en-US-JennyNeural',
    ]);
  });
});
