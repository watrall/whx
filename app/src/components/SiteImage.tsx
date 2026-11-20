import { useEffect, useState } from 'react';
import type { Site } from '../lib/types.ts';
import { TYPE_COLOR } from '../lib/utils.ts';
import { TypeIcon } from './TypeIcon.tsx';

interface SiteImageProps {
  site: Site;
  alt?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}

export function SiteImage({ site, alt = '', loading = 'lazy', className = '' }: SiteImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [site.image]);

  if (!site.image || failed) {
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
      src={site.image}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

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
      <SiteImage site={site} className="h-full w-full" />
    </div>
  );
}
