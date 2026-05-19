import { type ImgHTMLAttributes } from 'react';
import {
  generateSrcSet,
  generateWebPSrcSet,
  DEFAULT_WIDTHS,
  DEFAULT_SIZES,
} from '../utils/imageOptimizer';

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Image path relative to /public (e.g. "/hero-bg.png") */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS class names */
  className?: string;
  /**
   * Responsive widths for srcset.
   * @default [320, 640, 1024, 1920]
   */
  widths?: readonly number[];
  /**
   * sizes attribute controlling which srcset candidate the browser picks.
   * @default "(max-width: 480px) 100vw, (max-width: 768px) 80vw, (max-width: 1200px) 60vw, 1200px"
   */
  sizes?: string;
  /** Loading strategy. Defaults to "lazy" for off-screen images. */
  loading?: 'lazy' | 'eager';
  /** Decoding hint for the browser. Defaults to "async". */
  decoding?: 'async' | 'sync' | 'auto';
  /** Whether to render WebP <source> with fallback. Defaults to true. */
  webp?: boolean;
}

/**
 * OptimizedImage — responsive image component with WebP support and lazy loading.
 *
 * Renders a `<picture>` element containing:
 * 1. A `<source>` with a WebP srcset (modern browsers)
 * 2. A fallback `<img>` with the original format srcset
 *
 * Both use responsive `srcset` / `sizes` so the browser downloads only the
 * appropriately-sized variant for the user's viewport and DPR.
 *
 * @example
 * ```tsx
 * <OptimizedImage src="/hero-bg.png" alt="Hero background" />
 *
 * <OptimizedImage
 *   src="/founder-josh.jpg"
 *   alt="Founder"
 *   className="rounded-2xl"
 *   widths={[320, 640, 1024]}
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  className,
  widths = DEFAULT_WIDTHS,
  sizes = DEFAULT_SIZES,
  loading = 'lazy',
  decoding = 'async',
  webp = true,
  ...rest
}: OptimizedImageProps) {
  const webpSrcSet = generateWebPSrcSet(src, widths);
  const fallbackSrcSet = generateSrcSet(src, widths);

  return (
    <picture>
      {webp && (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      )}
      <source
        type={getMimeType(src)}
        srcSet={fallbackSrcSet}
        sizes={sizes}
      />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        srcSet={fallbackSrcSet}
        sizes={sizes}
        {...rest}
      />
    </picture>
  );
}

/**
 * Derive a MIME type string from the file extension.
 * Falls back to `image/jpeg` for unknown extensions.
 */
function getMimeType(src: string): string {
  const ext = src.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

export default OptimizedImage;
