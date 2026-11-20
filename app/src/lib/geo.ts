import type { Site } from './types.ts';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface NearbySite {
  site: Site;
  km: number;
}

/** The closest other sites, nearest first. */
export function nearestSites(origin: Site, candidates: Site[], limit = 3): NearbySite[] {
  return candidates
    .filter((site) => site.id !== origin.id)
    .map((site) => ({ site, km: distanceKm(origin, site) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

const USES_MILES = typeof navigator !== 'undefined' && /^en-(US|GB)\b/.test(navigator.language);

/** "12 km" or "7 mi", with a floor so very close sites do not read as "0". */
export function formatDistance(km: number, miles = USES_MILES): string {
  const value = miles ? km * 0.621371 : km;
  const unit = miles ? 'mi' : 'km';
  if (value < 1) return `<1 ${unit}`;
  if (value < 10) return `${value.toFixed(1)} ${unit}`;
  return `${Math.round(value).toLocaleString('en-US')} ${unit}`;
}
