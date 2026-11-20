import type { Site, SiteType } from './types.ts';

const SITES_URL = 'data/unesco.json';
const PHOTOS_URL = 'data/photos.json';

export interface LoadResult {
  sites: Site[];
  recordCount: number;
}

const TYPES: SiteType[] = ['cultural', 'natural', 'mixed'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-cache', signal });
  if (!response.ok) throw new Error(`Data request failed (${response.status})`);
  return response.json();
}

/**
 * Builds the site list from UNESCO's records and, optionally, the Wikidata photo list.
 * Records that are malformed are skipped rather than failing the whole load.
 */
export function buildSites(unesco: unknown, photos: unknown): Site[] {
  if (!isRecord(unesco) || !isRecord(unesco.sites)) {
    throw new Error('Unexpected site data format');
  }
  const photoById = isRecord(photos) && isRecord(photos.photos) ? photos.photos : {};

  const sites: Site[] = [];
  for (const [id, raw] of Object.entries(unesco.sites)) {
    if (!/^\d+$/.test(id) || !isRecord(raw)) continue;
    const { name, countries, year, type, criteria, danger, lat, lon, parts } = raw;
    if (typeof name !== 'string' || !name.trim()) continue;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    if (typeof type !== 'string' || !TYPES.includes(type as SiteType)) continue;

    const countryList = Array.isArray(countries)
      ? countries.filter((entry): entry is string => typeof entry === 'string')
      : [];
    const photo = photoById[id];
    const photoRecord = isRecord(photo) ? photo : null;

    sites.push({
      id,
      qid: typeof photoRecord?.qid === 'string' ? photoRecord.qid : null,
      name: name.trim(),
      country: countryList[0] ?? '',
      countries: countryList,
      lat,
      lon,
      year: typeof year === 'number' ? year : null,
      danger: danger === true,
      type: type as SiteType,
      image: typeof photoRecord?.image === 'string' ? photoRecord.image : null,
      criteriaCodes: Array.isArray(criteria)
        ? criteria.filter((entry): entry is string => typeof entry === 'string')
        : [],
      parts: typeof parts === 'number' && parts > 1 ? parts : 1,
    });
  }
  return sites;
}

export async function loadSites(signal?: AbortSignal): Promise<LoadResult> {
  const [unesco, photos] = await Promise.all([
    fetchJson(SITES_URL, signal),
    // Photos are an enhancement: without them every site shows its type icon.
    fetchJson(PHOTOS_URL, signal).catch((error: unknown) => {
      if (signal?.aborted) throw error;
      return null;
    }),
  ]);

  const sites = buildSites(unesco, photos);
  if (sites.length === 0) throw new Error('No usable site records found');
  const recordCount = isRecord(unesco) && isRecord(unesco.sites) ? Object.keys(unesco.sites).length : 0;
  return { sites, recordCount };
}
