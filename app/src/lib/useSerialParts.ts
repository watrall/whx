import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { MapViewHandle } from '../components/MapView.tsx';
import type { Site } from './types.ts';
import { loadParts } from './unesco.ts';
import type { PartPoint } from './unesco.ts';

export const DETAIL_OFFSET = { desktop: [210, 0], mobile: [0, 120] } as const;

export function useSerialParts(
  site: Site | null,
  isDesktop: boolean,
  mapRef: RefObject<MapViewHandle | null>,
): PartPoint[] | null {
  const [loaded, setLoaded] = useState<{ id: string; points: PartPoint[] } | null>(null);

  useEffect(() => {
    if (!site || site.parts <= 1) return;
    let cancelled = false;
    loadParts().then((all) => {
      if (cancelled) return;
      const points = all?.[site.id];
      if (points && points.length > 1) {
        setLoaded({ id: site.id, points });
        mapRef.current?.fitParts(
          points,
          isDesktop
            ? { right: 460, bottom: 48 }
            : { right: 24, bottom: Math.round(window.innerHeight * 0.62) },
        );
      } else {
        mapRef.current?.focusSite(site, {
          offset: isDesktop ? [...DETAIL_OFFSET.desktop] : [...DETAIL_OFFSET.mobile],
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [site, isDesktop, mapRef]);

  return site && loaded?.id === site.id ? loaded.points : null;
}
