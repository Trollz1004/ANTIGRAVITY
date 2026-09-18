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
