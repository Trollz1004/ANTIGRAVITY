import { describe, expect, it } from 'vitest';

import { resolveApiBase } from './apiBase';

describe('resolveApiBase', () => {
  it('uses the canonical API origin for production builds when VITE_API_URL is unset', () => {
    expect(resolveApiBase('', true)).toBe('https://api.youandinotai.com/api/v1');
  });

  it('keeps same-origin API paths available for local development', () => {
    expect(resolveApiBase('', false)).toBe('/api/v1');
  });

  it('honors an explicit VITE_API_URL override', () => {
    expect(resolveApiBase('https://staging.example.test/api/v1', true)).toBe(
      'https://staging.example.test/api/v1'
    );
  });
});
