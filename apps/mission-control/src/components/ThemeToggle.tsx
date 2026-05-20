import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Theme Toggle Button
 *
 * Cycles through light → dark → system modes on click.
 * Shows the current mode's icon (sun/moon/monitor).
 */
export const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useTheme();

  const cycle = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('system');
    else setMode('light');
  };

  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const label = mode === 'light' ? 'Light mode' : mode === 'dark' ? 'Dark mode' : 'System theme';

  return (
    <button
      onClick={cycle}
      aria-label={label}
      title={label}
      className="p-1.5 rounded border border-border hover:border-accentCyan/50 transition text-gray-400 hover:text-accentCyan"
    >
      <Icon size={14} />
    </button>
  );
};
