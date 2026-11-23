import type { Site, SitePhoto, SiteType } from './types.ts';

const SITES_URL = 'data/unesco.json';
const PHOTOS_URL = 'data/photos.json';
const GALLERY_URL = 'data/gallery.json';
const UNSPLASH_URL = 'data/unsplash.json';

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
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/** The Commons file name inside a Special:FilePath URL, as the gallery data spells it. */
function fileName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '').replace(/_/g, ' ');
  } catch {
    return '';
  }
}

function commonsUrl(name: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`;
}

/**
 * A site's photos: its main one, then the gallery's extras. When the Wikidata photo was a poor
 * fit, the main one is already a better extra and `original` is put back at the end.
 */
function photosFor(
  main: string | null,
  extras: string[],
  credits: Record<string, unknown>,
  original: string | null,
  unsplash: unknown[] = [],
): SitePhoto[] {
  const commonsPhoto = (url: string): SitePhoto => {
    const credit = credits[fileName(url)];
    const record = isRecord(credit) ? credit : {};
    return {
      url,
      by: typeof record.by === 'string' && record.by ? record.by : null,
      license: typeof record.license === 'string' && record.license ? record.license : null,
      source: 'commons',
      page: null,
      byUrl: null,
    };
  };
  const urls = [...new Set([...(main ? [main] : []), ...extras.map(commonsUrl)])];
  const commons = urls.map(commonsPhoto);
  // Unsplash photos fill in where Commons had too few. A poor Wikidata photo still goes last.
  const fromUnsplash = unsplash.flatMap((entry): SitePhoto[] => {
    if (!isRecord(entry) || typeof entry.url !== 'string') return [];
    return [
      {
        url: entry.url,
        by: typeof entry.by === 'string' ? entry.by : null,
        license: 'Unsplash',
        source: 'unsplash',
        page: typeof entry.link === 'string' ? entry.link : null,
        byUrl: typeof entry.byUrl === 'string' ? entry.byUrl : null,
      },
    ];
  });
  const last = original && !urls.includes(commonsUrl(original)) ? [commonsPhoto(commonsUrl(original))] : [];
  return [...commons, ...fromUnsplash, ...last];
}

interface Gallery {
  extras: Record<string, unknown>;
  credits: Record<string, unknown>;
  demoted: Record<string, unknown>;
  unsplash: Record<string, unknown>;
}

function galleryFrom(value: unknown): Gallery {
  const part = (key: string): Record<string, unknown> =>
    isRecord(value) && isRecord(value[key]) ? (value[key] as Record<string, unknown>) : {};
  return { extras: part('extras'), credits: part('credits'), demoted: part('demoted'), unsplash: part('unsplash') };
}

function sitePhotos(site: Pick<Site, 'id' | 'image'>, gallery: Gallery): SitePhoto[] {
  const original = gallery.demoted[site.id];
  return photosFor(
    site.image,
    strings(gallery.extras[site.id]),
    gallery.credits,
    typeof original === 'string' ? original : null,
    Array.isArray(gallery.unsplash[site.id]) ? (gallery.unsplash[site.id] as unknown[]) : [],
  );
}

/** Adds each site's extra photos and credits once the gallery data has arrived. */
export function applyGallery(sites: Site[], gallery: unknown): Site[] {
  const parsed = galleryFrom(gallery);
  return sites.map((site) => {
    const photos = sitePhotos(site, parsed);
    return { ...site, photos, image: photos[0]?.url ?? null };
  });
}

export function buildSites(unesco: unknown, photos: unknown, gallery: unknown = null): Site[] {
  if (!isRecord(unesco) || !isRecord(unesco.sites)) {
    throw new Error('Unexpected site data format');
  }
  const photoById = isRecord(photos) && isRecord(photos.photos) ? photos.photos : {};
  const parsedGallery = galleryFrom(gallery);

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
    const mainImage = typeof photoRecord?.image === 'string' ? photoRecord.image : null;
    const photoList = sitePhotos({ id, image: mainImage }, parsedGallery);

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
      image: photoList[0]?.url ?? null,
      photos: photoList,
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

/**
 * The extra photos and credits. They are large next to the rest of the data, so they load after
 * the map is up; null if they cannot be fetched, in which case each site keeps its main photo.
 */
export async function loadGallery(signal?: AbortSignal): Promise<unknown> {
  const optional = (url: string) =>
    fetchJson(url, signal).catch((error: unknown) => {
      if (signal?.aborted) throw error;
      return null;
    });
  const [gallery, unsplash] = await Promise.all([optional(GALLERY_URL), optional(UNSPLASH_URL)]);
  if (!gallery && !unsplash) return null;
  return { ...(isRecord(gallery) ? gallery : {}), unsplash: isRecord(unsplash) ? unsplash : {} };
}
