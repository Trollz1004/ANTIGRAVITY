'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemePreset = 'noir-romance' | 'precision' | 'cinematic' | 'warm-heritage' | 'futuristic-intimacy';

interface ThemeConfig {
  preset: ThemePreset;
  accentIntensity: number; // 0.6 – 1.4
  density: number;         // 0.8 – 1.2
  radiusScale: number;     // 0.7 – 1.3
  fontScale: number;       // 0.9 – 1.15
}

const defaultConfig: ThemeConfig = {
  preset: 'noir-romance',
  accentIntensity: 1,
  density: 1,
  radiusScale: 1,
  fontScale: 1,
};

interface ThemeContextType {
  config: ThemeConfig;
  setPreset: (preset: ThemePreset) => void;
  setAccentIntensity: (v: number) => void;
  setDensity: (v: number) => void;
  setRadiusScale: (v: number) => void;
  setFontScale: (v: number) => void;
  reset: () => void;
  presets: { label: string; value: ThemePreset }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'yaini-theme-config';

const presets = [
  { label: 'Noir Romance', value: 'noir-romance' as const },
  { label: 'Precision Human', value: 'precision' as const },
  { label: 'Cinematic Luxury', value: 'cinematic' as const },
  { label: 'Warm Heritage', value: 'warm-heritage' as const },
  { label: 'Futuristic Intimacy', value: 'futuristic-intimacy' as const },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch {}
  }, []);

  // Apply to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Preset (data-theme)
    root.setAttribute('data-theme', config.preset);

    // Live vars
    root.style.setProperty('--accent-intensity', config.accentIntensity.toString());
    root.style.setProperty('--density', config.density.toString());
    root.style.setProperty('--radius-scale', config.radiusScale.toString());
    root.style.setProperty('--font-scale', config.fontScale.toString());

    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  const updateConfig = (partial: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const value: ThemeContextType = {
    config,
    setPreset: (preset) => updateConfig({ preset }),
    setAccentIntensity: (v) => updateConfig({ accentIntensity: Math.max(0.6, Math.min(1.4, v)) }),
    setDensity: (v) => updateConfig({ density: Math.max(0.8, Math.min(1.2, v)) }),
    setRadiusScale: (v) => updateConfig({ radiusScale: Math.max(0.7, Math.min(1.3, v)) }),
    setFontScale: (v) => updateConfig({ fontScale: Math.max(0.9, Math.min(1.15, v)) }),
    reset: () => setConfig(defaultConfig),
    presets,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
