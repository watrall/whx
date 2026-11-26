import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { MapViewHandle } from '../components/MapView.tsx';
import { PHONE } from './layout.ts';
import type { Site } from './types.ts';
import { loadParts } from './unesco.ts';
import type { PartPoint } from './unesco.ts';

const DESKTOP_DETAIL_OFFSET = [210, 0] as const;

/** How far to shift the map centre so a selected site sits in the middle of the map the card leaves visible. */
export function detailOffset(isDesktop: boolean): [number, number] {
  if (isDesktop) return [...DESKTOP_DETAIL_OFFSET];
  const height = window.innerHeight;
  const cardTop = height * (1 - PHONE.cardMaxVh / 100);
  return [0, Math.round(height / 2 - (PHONE.topInset + cardTop) / 2)];
}

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
            : {
                top: PHONE.topInset + 16,
                right: 24,
                bottom: Math.round((window.innerHeight * PHONE.cardMaxVh) / 100),
              },
        );
      } else {
        mapRef.current?.focusSite(site, { offset: detailOffset(isDesktop) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [site, isDesktop, mapRef]);

  return site && loaded?.id === site.id ? loaded.points : null;
}
