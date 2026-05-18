/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const cdnBase = env.VITE_CDN_BASE_URL || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Plugin to inject resource hints (dns-prefetch, preconnect) into HTML
      // when a CDN base URL is configured for production builds.
      cdnResourceHintsPlugin(cdnBase),
    ],
    define: {
      // Make CDN base URL available in client code if needed
      __CDN_BASE_URL__: JSON.stringify(cdnBase),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // CDN base URL — set VITE_CDN_BASE_URL in production to serve static assets
    // from a CDN (e.g. https://cdn.youandinotai.com or R2 public bucket URL).
    // When empty, assets are served relative to the app origin.
    base: cdnBase || undefined,
    build: {
      // Asset fingerprinting: Vite already hashes by default, but we make it
      // explicit here so the policy is visible and auditable.
      rollupOptions: {
        output: {
          // Use content hash for all chunks and assets.
          // Vite default is [name]-[hash].js — we keep that pattern.
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // Keep fingerprinted pattern for all asset types.
            // Images/fonts go to assets/ with hash; CSS stays with hash.
            const info = assetInfo.name || '';
            if (/\.(css)$/i.test(info)) {
              return 'assets/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico|avif)$/i.test(info)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(info)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Ensure source maps are generated for production (optional, useful for debugging)
      sourcemap: isProduction ? 'hidden' : true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

/**
 * Vite plugin that injects CDN resource hints into the HTML <head>.
 *
 * When a CDN base URL is configured, adds:
 *   <link rel="dns-prefetch" href="//cdn.youandinotai.com">
 *   <link rel="preconnect" href="https://cdn.youandinotai.com" crossorigin>
 *
 * This allows the browser to resolve DNS and establish a connection to the
 * CDN domain before the first asset request, reducing latency.
 */
function cdnResourceHintsPlugin(cdnBaseUrl) {
  return {
    name: 'cdn-resource-hints',
    transformIndexHtml(html) {
      if (!cdnBaseUrl) {
        return html;
      }

      try {
        const cdnUrl = new URL(cdnBaseUrl);
        const dnsPrefetch = `<link rel="dns-prefetch" href="//${cdnUrl.hostname}">`;
        const preconnect = `<link rel="preconnect" href="${cdnUrl.origin}" crossorigin>`;

        // Inject after the viewport meta tag (early in <head>)
        return html.replace(
          /(<meta name="viewport"[^>]*>)/,
          `$1\n  ${dnsPrefetch}\n  ${preconnect}`,
        );
      } catch {
        // Invalid URL — skip resource hints
        return html;
      }
    },
  };
}
