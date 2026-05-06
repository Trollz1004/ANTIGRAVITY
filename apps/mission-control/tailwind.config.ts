import type { Config } from 'tailwindcss'

export default <Config>{
  content: ['./index.html', './src/**/*.{tsx,ts,jsx,js}'],
  theme: {
    extend: {
      colors: {
        background: '#0b0f1a',
        panel: '#0f1421',
        border: '#1f2740',
        accentCyan: '#22d3ee',
        accentTeal: '#14b8a6',
        accentMagenta: '#e879f9',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
