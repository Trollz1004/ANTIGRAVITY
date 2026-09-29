import { describe, it, expect, beforeEach, vi } from 'vitest';

// We import the module under test by path. The harness below mocks
// window.speechSynthesis and window.speechSynthesisUtterance so we can
// observe which voice the picker chose.

const voicePicks = [];
function makeVoice(name, lang, localService = false) {
  return { name, lang, localService, default: false };
}

const VOICES = [
  makeVoice('Microsoft Aria Online - English (United States)', 'en-US', false),
  makeVoice('Microsoft Guy Online - English (United States)', 'en-US', false),
  makeVoice('Google US English', 'en-US', false),
  makeVoice('Samantha', 'en-US', true),
];

function freshStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    _store: store,
  };
}

beforeEach(() => {
  voicePicks.length = 0;
  globalThis.localStorage = freshStorage();
  // Fresh speechSynthesis mock per test.
  globalThis.window = {
    speechSynthesis: {
      getVoices: vi.fn(() => VOICES.slice()),
      speak: vi.fn((utt) => { voicePicks.push(utt.voice && utt.voice.name); }),
      cancel: vi.fn(),
      onvoiceschanged: null,
      paused: false,
      pending: false,
      speaking: false,
    },
    SpeechSynthesisUtterance: function (text) {
      this.text = text;
      this.voice = null;
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
    },
  };
  // Reset module cache so each test gets a fresh picker.
  vi.resetModules();
});

async function loadPicker() {
  return await import('../js/jarvis/voice-picker.js');
}

describe('voice picker — enumeration', () => {
  it('lists every voice the browser reports', async () => {
    const { listVoices } = await loadPicker();
    const voices = listVoices();
    expect(voices).toHaveLength(4);
    expect(voices.map(v => v.name)).toEqual([
      'Microsoft Aria Online - English (United States)',
      'Microsoft Guy Online - English (United States)',
      'Google US English',
      'Samantha',
    ]);
  });
});

describe('voice picker — preference', () => {
  it('persists a chosen voice name in localStorage', async () => {
    const { pickVoice, getPickedVoiceName } = await loadPicker();
    expect(getPickedVoiceName()).toBeNull();
    pickVoice('Samantha');
    expect(getPickedVoiceName()).toBe('Samantha');
    expect(localStorage.getItem('jarvis.voice.pick')).toBe('Samantha');
  });

  it('clears the stored pick when pickVoice(null) is called', async () => {
    const { pickVoice, getPickedVoiceName } = await loadPicker();
    pickVoice('Samantha');
    pickVoice(null);
    expect(getPickedVoiceName()).toBeNull();
    expect(localStorage.getItem('jarvis.voice.pick')).toBeNull();
  });

  it('falls back to the existing female heuristic when no pick is stored', async () => {
    const { resolveSpeakVoice } = await loadPicker();
    // The heuristic used by selectFemaleVoice() should prefer "female" named voices.
    const voice = resolveSpeakVoice();
    expect(voice).toBeTruthy();
    expect(voice.name.toLowerCase()).toMatch(/aria|female|samantha|zira/);
  });

  it('honors the stored pick over the heuristic', async () => {
    const { pickVoice, resolveSpeakVoice } = await loadPicker();
    pickVoice('Google US English');
    const voice = resolveSpeakVoice();
    expect(voice.name).toBe('Google US English');
  });
});

describe('voice picker — local pack', () => {
  it('registers an offline/local pack and prefers it when localOnly is on', async () => {
    const { setLocalVoice, resolveSpeakVoice, isLocalPackAvailable } = await loadPicker();
    const localVoice = makeVoice('Hermes Local v1', 'en-US', true);
    setLocalVoice(localVoice);
    expect(isLocalPackAvailable()).toBe(true);
    const voice = resolveSpeakVoice({ localOnly: true });
    expect(voice.name).toBe('Hermes Local v1');
  });

  it('still returns a non-local voice when localOnly is off even if a local pack is registered', async () => {
    const { setLocalVoice, resolveSpeakVoice } = await loadPicker();
    setLocalVoice(makeVoice('Hermes Local v1', 'en-US', true));
    const voice = resolveSpeakVoice();
    expect(voice.name).not.toBe('Hermes Local v1');
  });
});

describe('voice picker — speak() integration', () => {
  it('the speak() helper uses the picked voice name', async () => {
    const { pickVoice, speak } = await loadPicker();
    pickVoice('Samantha');
    speak('hello world');
    expect(voicePicks).toEqual(['Samantha']);
  });
});

describe('hermes-voice.js imports resolve (browser SyntaxError guard, 2026-09-29)', () => {
  it('every name hermes-voice.js imports from voice-picker.js is a real export', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const url = await import('node:url')
    const here = path.dirname(url.fileURLToPath(import.meta.url))
    const src = fs.readFileSync(path.join(here, '..', 'js', 'hermes-voice.js'), 'utf8')
    const m = /import\s*\{([^}]*)\}\s*from\s*'\.\/jarvis\/voice-picker\.js'/.exec(src)
    expect(m, 'hermes-voice.js imports from voice-picker.js').toBeTruthy()
    const names = m[1].split(',').map((n) => n.trim()).filter(Boolean)
    const mod = await import('../js/jarvis/voice-picker.js')
    for (const n of names) expect(typeof mod[n], n + ' is exported by voice-picker.js').toBe('function')
  })
  it('the local pack surface round-trips', async () => {
    const mod = await import('../js/jarvis/voice-picker.js')
    expect(mod.getLocalPack()).toBeNull()
    expect(mod.setLocalPack({ voices: ['Nova'] })).toBe(true)
    expect(mod.getLocalPack().voices).toEqual(['Nova'])
    expect(mod.setLocalPack(null)).toBe(false)
    expect(mod.getLocalPack()).toBeNull()
  })

  // A minimal DOM: enough for populateVoiceSelect to append <option>s.
  function fakeSelect() {
    const sel = { children: [], value: '', appendChild(o) { this.children.push(o); return o } }
    Object.defineProperty(sel, 'innerHTML', { set(v) { if (v === '') sel.children = [] }, get() { return '' } })
    return sel
  }
  it('populateVoiceSelect fills the select from the browser voices, filtered to the local pack on request', async () => {
    const mod = await import('../js/jarvis/voice-picker.js')
    const prevDoc = globalThis.document
    globalThis.document = { createElement: () => ({ value: '', textContent: '', selected: false }) }
    try {
      const sel = fakeSelect()
      expect(mod.populateVoiceSelect(sel)).toBe(VOICES.length)
      expect(sel.children.map((o) => o.value)).toEqual(['', ...VOICES.map((v) => v.name)])
      mod.setLocalPack({ voices: ['Samantha'] })
      expect(mod.populateVoiceSelect(sel, { preferLocal: true })).toBe(1)
      expect(sel.children.map((o) => o.value)).toEqual(['', 'Samantha'])
      mod.setLocalPack(null)
    } finally {
      globalThis.document = prevDoc
    }
  })
  it('every element id hermes-voice.js wires exists in index.html (Copilot, PR 260)', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const url = await import('node:url')
    const here = path.dirname(url.fileURLToPath(import.meta.url))
    const src = fs.readFileSync(path.join(here, '..', 'js', 'hermes-voice.js'), 'utf8')
    const html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8')
    const ids = [...src.matchAll(/vEl\('([^']+)'\)/g)].map((m) => m[1])
    expect(ids.length).toBeGreaterThan(5)
    for (const id of ids) expect(html, `index.html has #${id}`).toContain(`id="${id}"`)
    expect(src, 'speak() resolves the voice once').not.toMatch(/applyPickToUtterance\(/)
  })
})
