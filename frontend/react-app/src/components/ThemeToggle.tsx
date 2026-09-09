/**
 * ThemeToggle — OPU-17
 *
 * A button component that toggles between light and dark themes.
 * Renders a sun icon in dark mode (click to switch to light) and
 * a moon icon in light mode (click to switch to dark).
 *
 * New file created for OPU-17 dark/light theme toggle.
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface ThemeToggleProps {
  /** Additional CSS classes for the button */
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      }
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] border-[var(--app-line,#111111)] transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent,#ff4f00)] focus-visible:ring-offset-2 ${
        theme === 'dark'
          ? 'bg-[#111111] text-white shadow-[4px_4px_0_0_rgba(255,255,255,0.15)]'
          : 'bg-[#fffaf2] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="transition-transform group-hover:rotate-45" />
      ) : (
        <Moon
          size={18}
          className="transition-transform group-hover:-rotate-12"
        />
      )}
    </button>
  );
}
