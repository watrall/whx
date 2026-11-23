import type { CommonsPhoto, Site, SitePhoto, SiteType, UnsplashPhoto } from './types.ts';

const SITES_URL = '/data/unesco.json';
const PHOTOS_URL = '/data/photos.json';
const GALLERY_URL = '/data/gallery';

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

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

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

interface Gallery {
  extras: Record<string, unknown>;
  credits: Record<string, unknown>;
  demoted: Record<string, unknown>;
  unsplash: Record<string, unknown>;
}

function galleryFrom(value: unknown): Gallery {
  const section = (key: string): Record<string, unknown> => {
    const part = isRecord(value) ? value[key] : null;
    return isRecord(part) ? part : {};
  };
  return {
    extras: section('extras'),
    credits: section('credits'),
    demoted: section('demoted'),
    unsplash: section('unsplash'),
  };
}

function commonsPhoto(url: string, credits: Record<string, unknown>): CommonsPhoto {
  const credit = credits[fileName(url)];
  const record = isRecord(credit) ? credit : {};
  return { source: 'commons', url, by: text(record.by), license: text(record.license) };
}

function unsplashPhoto(entry: unknown): UnsplashPhoto | null {
  if (!isRecord(entry)) return null;
  const url = text(entry.url);
  if (!url) return null;
  return { source: 'unsplash', url, by: text(entry.by), page: text(entry.link), byUrl: text(entry.byUrl) };
}

function photosFor(site: Pick<Site, 'id' | 'image'>, gallery: Gallery): SitePhoto[] {
  const urls = [
    ...new Set([...(site.image ? [site.image] : []), ...strings(gallery.extras[site.id]).map(commonsUrl)]),
  ];
  const originalName = text(gallery.demoted[site.id]);
  const original = originalName && !urls.includes(commonsUrl(originalName)) ? [commonsUrl(originalName)] : [];
  const unsplashEntries = gallery.unsplash[site.id];
  const fromUnsplash = (Array.isArray(unsplashEntries) ? unsplashEntries : [])
    .map(unsplashPhoto)
    .filter((photo): photo is UnsplashPhoto => photo !== null);
  return [
    ...urls.map((url) => commonsPhoto(url, gallery.credits)),
    ...fromUnsplash,
    ...original.map((url) => commonsPhoto(url, gallery.credits)),
  ];
}

export function siteGalleries(photos: unknown, gallery: unknown): Record<string, SitePhoto[]> {
  const parsed = galleryFrom(gallery);
  const byId = isRecord(photos) && isRecord(photos.photos) ? photos.photos : {};
  return Object.fromEntries(
    Object.entries(byId).map(([id, record]) => [
      id,
      photosFor({ id, image: isRecord(record) ? text(record.image) : null }, parsed),
    ]),
  );
}

function isSitePhoto(value: unknown): value is SitePhoto {
  return (
    isRecord(value) &&
    (value.source === 'commons' || value.source === 'unsplash') &&
    typeof value.url === 'string'
  );
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
    const mainImage = typeof photoRecord?.image === 'string' ? photoRecord.image : null;

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
      image: mainImage,
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

export async function loadSitePhotos(id: string, signal?: AbortSignal): Promise<SitePhoto[] | null> {
  try {
    const data = await fetchJson(`${GALLERY_URL}/${id}.json`, signal);
    return Array.isArray(data) && data.every(isSitePhoto) ? data : null;
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}
