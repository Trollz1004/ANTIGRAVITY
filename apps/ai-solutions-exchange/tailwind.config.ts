import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          50: '#fdfbf7',
          100: '#f7f6f2',
          200: '#edeae5',
          300: '#d4d1ca',
          400: '#b3aea2',
          500: '#8a8372',
          600: '#6d6555',
          700: '#554f3f',
          800: '#474136',
          900: '#3d3830',
          950: '#211e18',
        },
        hydra: {
          50: '#eef5f5',
          100: '#d1e3e3',
          200: '#a3c7c7',
          300: '#6aa5a5',
          400: '#3d8484',
          500: '#1f6a6a',
          600: '#0f5252',
          700: '#083d3d',
          800: '#063131',
          900: '#012727',
          950: '#011616',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
