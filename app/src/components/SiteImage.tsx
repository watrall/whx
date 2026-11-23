import { useState } from 'react';
import type { Site } from '../lib/types.ts';
import { TYPE_COLOR } from '../lib/utils.ts';
import { TypeIcon } from './TypeIcon.tsx';

interface SiteImageProps {
  site: Site;
  image?: string | null;
  alt?: string;
  loading?: 'lazy' | 'eager';
  /** Requested pixel width. Commons resizes server-side, so small slots stay small. */
  width?: number;
  className?: string;
}

export function withWidth(image: string, width?: number): string {
  if (!width) return image;
  try {
    const url = new URL(image);
    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', '75');
      url.searchParams.set('fm', 'jpg');
      url.searchParams.set('fit', 'max');
      return url.toString();
    }
    if (!url.pathname.startsWith('/wiki/Special:FilePath/')) return image;
    url.searchParams.set('width', String(width));
    return url.toString();
  } catch {
    return image;
  }
}

export function SiteImage({
  site,
  image: imageOverride,
  alt = '',
  loading = 'lazy',
  width,
  className = '',
}: SiteImageProps) {
  const image = imageOverride === undefined ? site.image : imageOverride;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const failed = failedImage === image;
  const loaded = loadedImage === image;

  if (!image || failed) {
    return (
      <div
        className={`grid place-items-center bg-canvas ${className}`}
        style={{ color: TYPE_COLOR[site.type] }}
        role="img"
        aria-label={alt || `${site.name} placeholder`}
      >
        <TypeIcon type={site.type} className="h-7 w-7" />
      </div>
    );
  }

  return (
    <img
      ref={(element) => {
        if (element?.complete && element.naturalWidth > 0) setLoadedImage(image ?? null);
      }}
      src={withWidth(image, width ?? 900)}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setLoadedImage(image ?? null)}
      onError={() => setFailedImage(image ?? null)}
      className={`object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}

// 2x the rendered size (40, 48 and 64px) so thumbnails stay sharp on retina screens.
const THUMB_WIDTH = { sm: 96, md: 120, lg: 160 } as const;

const THUMB_SIZE = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
} as const;

export function SiteThumb({
  site,
  size = 'md',
  className = '',
}: {
  site: Site;
  size?: keyof typeof THUMB_SIZE;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border border-line bg-canvas ${THUMB_SIZE[size]} ${className}`}
    >
      <SiteImage site={site} width={THUMB_WIDTH[size]} className="h-full w-full" />
    </div>
  );
}
