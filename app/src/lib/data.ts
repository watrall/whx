import { parseCriteria } from './criteria.ts';
import type { Site, SiteType } from './types.ts';
import { applyUnescoFacts, loadUnescoFacts } from './unesco.ts';

const DATA_URL = 'data/sites.json';

interface BindingValue {
  value?: unknown;
}

interface Binding {
  item?: BindingValue;
  itemLabel?: BindingValue;
  country?: BindingValue;
  description?: BindingValue;
  coordinate?: BindingValue;
  inscriptionYear?: BindingValue;
  image?: BindingValue;
  criteria?: BindingValue;
  officialUrl?: BindingValue;
  unescoId?: BindingValue;
}

export interface LoadResult {
  sites: Site[];
  recordCount: number;
}

function readValue(binding: Binding, key: keyof Binding): string | undefined {
  const field = binding[key];
  return typeof field?.value === 'string' ? field.value : undefined;
}

export async function loadSites(signal?: AbortSignal): Promise<LoadResult> {
  const response = await fetch(DATA_URL, { cache: 'no-cache', signal });
  if (!response.ok) {
    throw new Error(`Data request failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('results' in payload)) {
    throw new Error('Unexpected site data format');
  }
  const results = payload.results;
  if (typeof results !== 'object' || results === null || !('bindings' in results)) {
    throw new Error('Unexpected site data format');
  }
  const bindings = results.bindings;
  if (!Array.isArray(bindings)) {
    throw new Error('Unexpected site data format');
  }

  // The update script writes SPARQL bindings; each field is validated by readValue.
  const records = bindings as Binding[];
  const [wikidataSites, facts] = await Promise.all([
    Promise.resolve(normalizeBindings(records)),
    loadUnescoFacts(signal),
  ]);
  const sites = applyUnescoFacts(wikidataSites, facts);
  if (sites.length === 0) {
    throw new Error('No usable site records found');
  }

  return { sites, recordCount: records.length };
}

/**
 * Collapse extension records (`bis`, `ter`, `rev`, numeric suffixes) onto the
 * parent UNESCO ID so the map and list show one marker per site. Records with
 * no ID fall back to their QID.
 */
export function normalizeBindings(bindings: Binding[]): Site[] {
  const seen = new Set<string>();
  const sites: Site[] = [];

  for (const binding of bindings) {
    if (binding === null || typeof binding !== 'object') continue;

    const coordinate = parseCoordinate(readValue(binding, 'coordinate'));
    if (!coordinate) continue;

    const name = readValue(binding, 'itemLabel')?.trim();
    if (!name) continue;

    const item = readValue(binding, 'item');
    const qid = item?.split('/').pop() ?? name;
    const unescoId = readValue(binding, 'unescoId')?.trim() || null;
    const key = unescoId ? normalizeUnescoId(unescoId) : qid;
    if (seen.has(key)) continue;
    seen.add(key);

    const country = readValue(binding, 'country')?.trim() ?? '';
    sites.push({
      id: qid,
      name,
      altName: '',
      country,
      countries: country ? [country] : [],
      countryAlias: '',
      description: readValue(binding, 'description')?.trim() ?? '',
      lat: coordinate.lat,
      lon: coordinate.lon,
      year: resolveYear(qid, readValue(binding, 'inscriptionYear')),
      danger: false,
      type: resolveType(readValue(binding, 'criteria'), readValue(binding, 'description')),
      image: normalizeImage(readValue(binding, 'image')),
      officialUrl: safeUrl(readValue(binding, 'officialUrl')),
      unescoId,
      criteria: readValue(binding, 'criteria')?.trim() || null,
      criteriaCodes: parseCriteria(readValue(binding, 'criteria') ?? null).map((item) => item.code),
    });
  }

  return sites;
}

export function parseCoordinate(value?: string): { lat: number; lon: number } | null {
  if (!value) return null;
  const match = /^Point\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i.exec(value.trim());
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/** UNESCO's first inscriptions were made in 1978; anything earlier is bad data. */
export const FIRST_INSCRIPTION_YEAR = 1978;

/**
 * Known-wrong years in Wikidata, keyed by QID. Fix these upstream on Wikidata
 * and delete the entry once the correction has propagated.
 */
export const YEAR_OVERRIDES: Record<string, number> = {
  // Serengeti National Park: Wikidata says 1960 (likely the park's creation); inscribed 1981.
  Q11812902: 1981,
};

export function resolveYear(qid: string, value?: string): number | null {
  const override = YEAR_OVERRIDES[qid];
  if (override !== undefined) return override;
  const year = parseYear(value);
  return year !== null && year < FIRST_INSCRIPTION_YEAR ? null : year;
}

export function parseYear(value?: string): number | null {
  if (!value) return null;
  const year = Number.parseInt(value, 10);
  if (!Number.isFinite(year) || year < 1000 || year > 3000) return null;
  return year;
}

export function normalizeUnescoId(value: string): string {
  return value
    .toLowerCase()
    .replace(/(bis|ter|quater|rev|-\d+)$/g, '')
    .trim();
}

const CULTURAL_CRITERIA = new Set(['i', 'ii', 'iii', 'iv', 'v', 'vi']);
const NATURAL_CRITERIA = new Set(['vii', 'viii', 'ix', 'x']);

export function resolveType(criteria?: string, description?: string): SiteType {
  const matches = [...(criteria ?? '').matchAll(/\(([ivx]+)\)/gi)].map((match) =>
    match[1].toLowerCase(),
  );
  const hasCultural = matches.some((criterion) => CULTURAL_CRITERIA.has(criterion));
  const hasNatural = matches.some((criterion) => NATURAL_CRITERIA.has(criterion));
  if (hasCultural && hasNatural) return 'mixed';
  if (hasNatural) return 'natural';
  if (hasCultural) return 'cultural';

  const text = (description ?? '').toLowerCase();
  if (text.includes('mixed')) return 'mixed';
  if (text.includes('natural')) return 'natural';
  return 'cultural';
}

function normalizeImage(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== 'commons.wikimedia.org') return null;
    // Commons is served over HTTPS; avoid mixed-content blocking on Pages.
    url.protocol = 'https:';
    if (url.pathname.startsWith('/wiki/Special:FilePath/')) {
      url.searchParams.set('width', '900');
    }
    return url.toString();
  } catch {
    return null;
  }
}

function safeUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}
