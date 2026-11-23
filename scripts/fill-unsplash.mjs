#!/usr/bin/env node
/**
 * Adds Unsplash photos to sites that have few Commons photos, writing them to data/unsplash.json
 * (kept apart from data/gallery.json, which the Commons gallery build rewrites).
 *
 * Needs a free Unsplash API key (https://unsplash.com/developers) as UNSPLASH_ACCESS_KEY, in the
 * environment or in a .env file in the repository root (which is not committed).
 *
 * Usage: node scripts/fill-unsplash.mjs [--below 4] [--only 1,2,3] [--retry-empty]
 * Every search result is cached in .cache/unsplash-search.json, so changing the relevance rules and
 * running with --retry-empty re-judges sites that found nothing without spending API requests.
 * Fills sites that have fewer than `--below` photos (default 4) up to five. The free demo key is
 * limited to 50 requests an hour; when the limit is reached the script saves its progress and
 * stops, and running it again carries on where it left off.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PHOTOS_PER_SITE } from './gallery.mjs';
import { readBasePhotos } from './build-photos.mjs';
import { pickUnsplash, searchTerm } from './unsplash.mjs';

const API = 'https://api.unsplash.com';
const GALLERY = 'data/gallery.json';
const OUTPUT = 'data/unsplash.json';
const CACHE = '.cache/unsplash-search.json';
const UNESCO = 'data/unesco.json';

if (existsSync('.env')) process.loadEnvFile('.env');
const key = process.env.UNSPLASH_ACCESS_KEY;
if (!key) {
  console.error('Set UNSPLASH_ACCESS_KEY (in the environment or a .env file) to use this script.');
  process.exit(1);
}

const headers = { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' };

/** One API call. Returns { data, remaining }; remaining is how many calls are left this hour. */
async function unsplash(path, params = {}) {
  const url = new URL(path.startsWith('http') ? path : `${API}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, { headers });
  const remaining = Number(response.headers.get('x-ratelimit-remaining') ?? 1);
  if (response.status === 403 || response.status === 429) return { data: null, remaining: 0 };
  if (!response.ok) return { data: null, remaining };
  return { data: await response.json(), remaining };
}

const args = process.argv.slice(2);
const below = args.includes('--below') ? Number(args[args.indexOf('--below') + 1]) : 4;
const retryEmpty = args.includes('--retry-empty');
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

const gallery = JSON.parse(await readFile(GALLERY, 'utf8'));
const found = existsSync(OUTPUT) ? JSON.parse(await readFile(OUTPUT, 'utf8')) : {};
await mkdir('.cache', { recursive: true });
const cache = existsSync(CACHE) ? JSON.parse(await readFile(CACHE, 'utf8')) : {};

/** Only the fields the picker and the credit need, so the cache stays small. */
const slim = (photo) => ({
  id: photo.id,
  width: photo.width,
  height: photo.height,
  likes: photo.likes,
  description: photo.description,
  alt_description: photo.alt_description,
  tags: (photo.tags ?? []).map((tag) => ({ title: tag.title })),
  location: photo.location ? { name: photo.location.name, city: photo.location.city, country: photo.location.country } : null,
  user: { name: photo.user?.name, links: { html: photo.user?.links?.html } },
  urls: { raw: photo.urls?.raw },
  links: { html: photo.links?.html, download_location: photo.links?.download_location },
});
const base = await readBasePhotos();
const names = Object.fromEntries(
  Object.entries(JSON.parse(await readFile(UNESCO, 'utf8')).sites).map(([number, record]) => [number, record.name]),
);

// A site's Commons photos: its extras, plus Wikidata's own photo when it is not already one of them.
const commonsCount = (number) => (gallery.extras[number] ?? []).length + (base[number]?.image ? 1 : 0);

const todo = Object.keys(base).filter(
  (number) => names[number] && (!only || only.has(number)) && commonsCount(number) < below && (!(number in found) || (retryEmpty && found[number].length === 0)),
);
console.log(`${todo.length} sites need Unsplash photos`);

let filled = 0;
for (const number of todo) {
  const want = PHOTOS_PER_SITE - commonsCount(number);
  const term = searchTerm(names[number]);
  let results = cache[number];
  let remaining = Infinity;
  if (!results) {
    const response = await unsplash('/search/photos', {
      query: term,
      orientation: 'landscape',
      per_page: '30',
      content_filter: 'high',
    });
    remaining = response.remaining;
    if (!response.data) {
      console.log('Stopped (rate limit or error). Run again later to continue.');
      process.exitCode = 2;
      break;
    }
    results = (response.data.results ?? []).map(slim);
    cache[number] = results;
    await writeFile(CACHE, JSON.stringify(cache));
  }
  const picked = pickUnsplash(results, names[number], want);
  // Unsplash asks for a download to be reported when a photo is picked for use.
  for (const photo of results.filter((result) => picked.some((entry) => entry.id === result.id))) {
    if (photo.links?.download_location) await unsplash(photo.links.download_location);
  }
  found[number] = picked;
  if (picked.length > 0) filled += 1;
  await writeFile(OUTPUT, `${JSON.stringify(found)}\n`);
  if (remaining <= 1) {
    console.log('Hourly limit reached. Run again later to continue.');
    process.exitCode = 2;
    break;
  }
}
console.log(`Added Unsplash photos to ${filled} sites.`);
