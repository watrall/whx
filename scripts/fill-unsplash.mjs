#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { PHOTOS_PER_SITE } from './gallery.mjs';
import { readBasePhotos } from './build-photos.mjs';
import { readJson, writeJson } from './io.mjs';
import { pickUnsplash, searchTerm } from './unsplash.mjs';

const API = 'https://api.unsplash.com';
const GALLERY = 'data/gallery.json';
const OUTPUT = 'data/unsplash.json';
const CACHE = '.cache/unsplash.json';
const UNESCO = 'data/unesco.json';
const EXIT_RATE_LIMITED = 2;
const DEFAULT_BELOW = 4;
const SEARCH = { orientation: 'landscape', per_page: '30', content_filter: 'high' };

function parseArgs(argv) {
  const value = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const only = value('--only');
  return {
    below: Number(value('--below') ?? DEFAULT_BELOW),
    only: only ? new Set(only.split(',')) : null,
    retryEmpty: argv.includes('--retry-empty'),
  };
}

function slim(photo) {
  return {
    id: photo.id,
    width: photo.width,
    height: photo.height,
    likes: photo.likes,
    description: photo.description,
    alt_description: photo.alt_description,
    tags: (photo.tags ?? []).map((tag) => ({ title: tag.title })),
    location: photo.location
      ? { name: photo.location.name, city: photo.location.city, country: photo.location.country }
      : null,
    user: { name: photo.user?.name, links: { html: photo.user?.links?.html } },
    urls: { raw: photo.urls?.raw },
    links: { html: photo.links?.html, download_location: photo.links?.download_location },
  };
}

function createClient(key) {
  const headers = { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' };
  return async function request(path, params = {}) {
    const url = new URL(path.startsWith('http') ? path : `${API}${path}`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    const response = await fetch(url, { headers });
    const header = response.headers.get('x-ratelimit-remaining');
    const remaining = header === null ? Infinity : Number(header);
    if (response.status === 403 || response.status === 429) return { data: null, remaining: 0 };
    if (!response.ok) return { data: null, remaining };
    return { data: await response.json(), remaining };
  };
}

async function searchSite(request, store, number, name) {
  if (store.searches[number]) return { results: store.searches[number], remaining: Infinity };
  const response = await request('/search/photos', { ...SEARCH, query: searchTerm(name) });
  if (!response.data) return null;
  store.searches[number] = response.data.results.map(slim);
  await writeJson(CACHE, store);
  return { results: store.searches[number], remaining: response.remaining };
}

async function reportDownloads(picked, results, request, downloaded) {
  for (const entry of picked) {
    if (downloaded.has(entry.id)) continue;
    const photo = results.find((result) => result.id === entry.id);
    const response = await request(photo.links.download_location);
    if (!response.data) return false;
    downloaded.add(entry.id);
  }
  return true;
}

async function main() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.error('Set UNSPLASH_ACCESS_KEY (in the environment or a .env file) to use this script.');
    process.exitCode = 1;
    return;
  }
  const { below, only, retryEmpty } = parseArgs(process.argv.slice(2));
  const request = createClient(key);

  await mkdir('.cache', { recursive: true });
  const gallery = await readJson(GALLERY, { extras: {} });
  const found = await readJson(OUTPUT, {});
  const store = await readJson(CACHE, { searches: {}, downloads: [] });
  const downloaded = new Set(store.downloads);
  const base = await readBasePhotos();
  const unesco = await readJson(UNESCO, { sites: {} });
  const names = Object.fromEntries(Object.entries(unesco.sites).map(([number, record]) => [number, record.name]));

  const commonsCount = (number) => (gallery.extras[number] ?? []).length + (base[number]?.image ? 1 : 0);
  const needsFill = (number) =>
    !(number in found) || (retryEmpty && found[number].length === 0);
  const todo = Object.keys(base).filter(
    (number) => names[number] && (!only || only.has(number)) && commonsCount(number) < below && needsFill(number),
  );
  console.log(`${todo.length} sites need Unsplash photos`);

  let filled = 0;
  let limited = false;
  for (const number of todo) {
    const search = await searchSite(request, store, number, names[number]);
    if (!search) {
      limited = true;
      break;
    }
    const { results, remaining } = search;

    const picked = pickUnsplash(results, names[number], PHOTOS_PER_SITE - commonsCount(number));
    const reported = await reportDownloads(picked, results, request, downloaded);
    store.downloads = [...downloaded];
    await writeJson(CACHE, store);
    if (!reported) {
      limited = true;
      break;
    }

    found[number] = picked;
    if (picked.length > 0) filled += 1;
    await writeJson(OUTPUT, found);
    if (remaining <= 1) {
      limited = true;
      break;
    }
  }

  if (limited) {
    console.log('Rate limit reached. Run again later to continue.');
    process.exitCode = EXIT_RATE_LIMITED;
  }
  console.log(`Added Unsplash photos to ${filled} sites.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
