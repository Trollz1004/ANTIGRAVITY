/**
 * Image optimization utilities for responsive, performant image delivery.
 *
 * @module imageOptimizer
 * @see {@link /docs/IMAGE_OPTIMIZATION.md | Image Optimization Guide}
 */

/** Default responsive breakpoints (widths in pixels) */
export const DEFAULT_WIDTHS = [320, 640, 1024, 1920] as const;

/** Default sizes attribute for responsive images */
export const DEFAULT_SIZES =
  '(max-width: 480px) 100vw, (max-width: 768px) 80vw, (max-width: 1200px) 60vw, 1200px';

export interface SrcSetEntry {
  path: string;
  width: number;
}

/**
 * Extract the file extension from an image path.
 * @param src - e.g. "/hero-bg.png"
 * @returns e.g. ".png"
 */
function getExtension(src: string): string {
  const match = src.match(/\.([a-zA-Z]+)$/);
  return match ? `.${match[1]}` : '';
}

/**
 * Extract the base path (without extension) from an image path.
 * @param src - e.g. "/hero-bg.png"
 * @returns e.g. "/hero-bg"
 */
function getBasePath(src: string): string {
  const ext = getExtension(src);
  return ext ? src.slice(0, -ext.length) : src;
}

/**
 * Generate a srcset string for a given base image path and set of widths.
 *
 * Produces entries in the format: `/image-320w.png 320w, /image-640w.png 640w, ...`
 *
 * If a width-specific file does not exist at runtime, the browser will skip it.
 * The naming convention assumes optimized variants follow the pattern:
 *   `{base}-{width}w.{ext}`
 *
 * @param src - Original image path (e.g. "/hero-bg.png")
 * @param widths - Array of target widths (defaults to DEFAULT_WIDTHS)
 * @returns A srcset string ready for use in `<img srcset="...">`
 *
 * @example
 * ```ts
 * generateSrcSet('/hero-bg.png');
 * // => "/hero-bg-320w.png 320w, /hero-bg-640w.png 640w, /hero-bg-1024w.png 1024w, /hero-bg-1920w.png 1920w"
 *
 * generateSrcSet('/logo.png', [320, 640]);
 * // => "/logo-320w.png 320w, /logo-640w.png 640w"
 * ```
 */
export function generateSrcSet(
  src: string,
  widths: readonly number[] = DEFAULT_WIDTHS
): string {
  const base = getBasePath(src);
  const ext = getExtension(src);
  return widths
    .map(w => `${base}-${w}w.${ext.replace('.', '')} ${w}w`)
    .join(', ');
}

/**
 * Generate a srcset string for WebP variants of the given image.
 *
 * @param src - Original image path (e.g. "/hero-bg.png")
 * @param widths - Array of target widths (defaults to DEFAULT_WIDTHS)
 * @returns A srcset string for WebP variants
 *
 * @example
 * ```ts
 * generateWebPSrcSet('/hero-bg.png');
 * // => "/hero-bg-320w.webp 320w, /hero-bg-640w.webp 640w, ..."
 * ```
 */
export function generateWebPSrcSet(
  src: string,
  widths: readonly number[] = DEFAULT_WIDTHS
): string {
  const base = getBasePath(src);
  return widths.map(w => `${base}-${w}w.webp ${w}w`).join(', ');
}

/**
 * Get the WebP equivalent path for a given image.
 * @param src - e.g. "/hero-bg.png"
 * @returns e.g. "/hero-bg.webp"
 */
export function getWebPPath(src: string): string {
  return `${getBasePath(src)}.webp`;
}

/**
 * Check whether the current browser supports WebP via a synchronous
 * canvas feature-detection heuristic.
 *
 * For SSR / non-browser environments, returns `true` (assume support).
 *
 * @returns `true` if WebP is supported
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true; // Assume modern browser on server
  }

  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Get the optimal image width for the current viewport.
 * Useful for picking a single src when srcset is not applicable.
 *
 * @param widths - Available widths (defaults to DEFAULT_WIDTHS)
 * @returns The best matching width for the current viewport
 */
export function getOptimalWidth(
  widths: readonly number[] = DEFAULT_WIDTHS
): number {
  if (typeof window === 'undefined') {
    return widths[Math.floor(widths.length / 2)];
  }

  const vw = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = vw * dpr;

  for (const w of widths) {
    if (w >= targetWidth) return w;
  }
  return widths[widths.length - 1];
}

/**
 * Build a complete set of responsive image sources for use with `<picture>`.
 * Returns both WebP and fallback entries.
 */
export interface ResponsiveImageSources {
  webpSrcSet: string;
  fallbackSrcSet: string;
  fallbackSrc: string;
  sizes: string;
}

/**
 * Build all responsive image source data in one call.
 *
 * @param src - Original image path
 * @param widths - Target widths (defaults to DEFAULT_WIDTHS)
 * @param sizes - sizes attribute string (defaults to DEFAULT_SIZES)
 * @returns Complete source data for responsive image rendering
 */
export function buildResponsiveSources(
  src: string,
  widths: readonly number[] = DEFAULT_WIDTHS,
  sizes: string = DEFAULT_SIZES
): ResponsiveImageSources {
  return {
    webpSrcSet: generateWebPSrcSet(src, widths),
    fallbackSrcSet: generateSrcSet(src, widths),
    fallbackSrc: src,
    sizes,
  };
}
