'use client';

import React from 'react';
import { useTheme, ThemePreset } from '../lib/theme';

export default function ThemeCustomizer() {
  const {
    config,
    setPreset,
    setAccentIntensity,
    setDensity,
    setRadiusScale,
    setFontScale,
    reset,
    presets,
  } = useTheme();

  return (
    <div className="premium-card max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-primary)]">Live Customization</div>
          <div className="text-2xl font-black tracking-[-0.04em]">Make it yours</div>
        </div>
        <button onClick={reset} className="btn-secondary text-sm">Reset to Default</button>
      </div>

      {/* Presets */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-2 text-[var(--text-muted)]">Theme Presets</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value as ThemePreset)}
              className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold border transition-all ${
                config.preset === p.value
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                  : 'border-[var(--border-strong)] hover:border-[var(--accent-primary)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders — improved desktop layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest block mb-1.5">Accent Intensity</label>
          <input
            type="range"
            min={0.6}
            max={1.4}
            step={0.05}
            value={config.accentIntensity}
            onChange={(e) => setAccentIntensity(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent-primary)]"
          />
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{config.accentIntensity.toFixed(2)}</div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest block mb-1.5">Density</label>
          <input
            type="range"
            min={0.8}
            max={1.2}
            step={0.05}
            value={config.density}
            onChange={(e) => setDensity(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent-primary)]"
          />
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{config.density.toFixed(2)}</div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest block mb-1.5">Corner Radius</label>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={config.radiusScale}
            onChange={(e) => setRadiusScale(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent-primary)]"
          />
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{config.radiusScale.toFixed(2)}</div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest block mb-1.5">Font Scale</label>
          <input
            type="range"
            min={0.9}
            max={1.15}
            step={0.02}
            value={config.fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent-primary)]"
          />
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{config.fontScale.toFixed(2)}</div>
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)]">
        Changes apply instantly and persist in your browser. This is the state-of-the-art customizable experience for YouAndINotAI.
      </p>
    </div>
  );
}
