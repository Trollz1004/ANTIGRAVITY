import { useState, useCallback } from 'react';

export interface TweakValues {
  theme: 'antigravity' | 'gravity';
  hermesMode: boolean;
  density: 'compact' | 'default' | 'roomy';
  accent: 'odoo' | 'steel' | 'ember' | 'ink';
}

export const TWEAK_DEFAULTS: TweakValues = {
  theme: 'antigravity',
  hermesMode: true,
  density: 'compact',
  accent: 'odoo',
};

export function useTweaks(defaults: TweakValues = TWEAK_DEFAULTS) {
  const [values, setValues] = useState<TweakValues>(defaults);

  const setTweak = useCallback(<K extends keyof TweakValues>(
    keyOrEdits: K | Partial<TweakValues>,
    val?: TweakValues[K],
  ) => {
    const edits: Partial<TweakValues> =
      typeof keyOrEdits === 'object' && keyOrEdits !== null
        ? keyOrEdits
        : { [keyOrEdits as K]: val } as Partial<TweakValues>;
    setValues(prev => ({ ...prev, ...edits }));
  }, []);

  return [values, setTweak] as const;
}
