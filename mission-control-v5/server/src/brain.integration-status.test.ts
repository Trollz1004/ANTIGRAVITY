import { describe, expect, it } from 'vitest';
import { buildHumanTools } from './brain.js';

describe('buildHumanTools', () => {
  it('reports Supabase and Obsidian as not configured without project variables', () => {
    const tools = buildHumanTools({});

    expect(tools.find((tool) => tool.id === 'supabase')).toMatchObject({
      state: 'not-configured',
      humanFacing: true,
    });
    expect(tools.find((tool) => tool.id === 'obsidian')).toMatchObject({
      state: 'not-configured',
      humanFacing: true,
    });
  });

  it('reports an unavailable Obsidian vault without treating it as a configured workspace', () => {
    const tools = buildHumanTools({ OBSIDIAN_VAULT_PATH: '/definitely/missing/vault' });

    expect(tools.find((tool) => tool.id === 'obsidian')).toMatchObject({
      state: 'unavailable',
      humanFacing: true,
    });
  });

  it('reports a configured Supabase workspace link without exposing credentials', () => {
    const tools = buildHumanTools({ SUPABASE_DASHBOARD_URL: 'https://supabase.example/dashboard/project/demo' });
    const supabase = tools.find((tool) => tool.id === 'supabase');

    expect(supabase).toMatchObject({ state: 'configured', humanFacing: true });
    expect(supabase?.openUrl).toBe('https://supabase.example/dashboard/project/demo');
    expect(JSON.stringify(supabase)).not.toContain('secret');
  });
});
