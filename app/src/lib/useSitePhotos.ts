import { useEffect, useMemo, useState } from 'react';
import { loadSitePhotos } from './data.ts';
import type { Site, SitePhoto } from './types.ts';

const cache = new Map<string, SitePhoto[]>();

export function useSitePhotos(site: Site): SitePhoto[] {
  const [loaded, setLoaded] = useState<{ id: string; photos: SitePhoto[] } | null>(null);
  const main = useMemo<SitePhoto[]>(
    () => (site.image ? [{ source: 'commons', url: site.image, by: null, license: null }] : []),
    [site.image],
  );

  useEffect(() => {
    if (cache.has(site.id)) return;
    const controller = new AbortController();
    loadSitePhotos(site.id, controller.signal)
      .then((photos) => {
        if (!photos) return;
        cache.set(site.id, photos);
        setLoaded({ id: site.id, photos });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [site.id]);

  if (loaded?.id === site.id) return loaded.photos;
  return cache.get(site.id) ?? main;
}
