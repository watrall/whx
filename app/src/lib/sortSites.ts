import { distanceKm } from './geo.ts';
import type { Site } from './types.ts';

export type SortKey = 'name' | 'year' | 'country' | 'distance';

export interface Origin {
  lat: number;
  lon: number;
}

export function sortSites(sites: Site[], sort: SortKey, origin: Origin | null): Site[] {
  const copy = [...sites];
  const km = new Map<string, number>();
  if (sort === 'distance' && origin) {
    for (const site of copy) km.set(site.id, distanceKm(origin, site));
  }
  copy.sort((a, b) => {
    if (sort === 'distance' && origin) return (km.get(a.id) ?? 0) - (km.get(b.id) ?? 0);
    if (sort === 'year') return (a.year ?? 9999) - (b.year ?? 9999);
    if (sort === 'country') return a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
  return copy;
}
