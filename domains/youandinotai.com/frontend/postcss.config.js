// Tailwind is handled by the @tailwindcss/vite plugin in vite.config.ts.
// This local empty config exists only to override the parent frontend/postcss.config.js
// from being picked up by Vite's directory walk (which requires tailwindcss as a PostCSS
// plugin and breaks the build for this Vite-native setup).
export default {
  plugins: {},
};
