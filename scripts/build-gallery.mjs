#!/usr/bin/env node
/**
 * Writes data/gallery.json: up to five Commons photographs per site (the Wikidata one plus
 * extras from the site's Commons category), with an author and licence for each.
 *
 * Usage: node scripts/build-gallery.mjs [--refresh] [--only 1,2,3]
 * Sites already in data/gallery.json are skipped unless --refresh is given, so an interrupted
 * run can be resumed. Photos named in data/photo-overrides.json under "hide" are never used.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dhash } from './dhash.mjs';
import {
  creditFrom,
  fileNameFromImage,
  isDuplicate,
  isUsablePhoto,
  pickExtras,
  PHOTOS_PER_SITE,
  scorePhoto,
} from './gallery.mjs';
import { readBasePhotos, writePhotos } from './build-photos.mjs';
import { parentRank, unescoNumber } from './photos.mjs';

const WIKIDATA = 'https://query.wikidata.org/sparql';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'WHX/1.0 (gallery update; https://github.com/watrall/whx)';
const OVERRIDES = 'data/photo-overrides.json';
const UNESCO = 'data/unesco.json';
const OUTPUT = 'data/gallery.json';
const HASH_CACHE = '.cache/gallery-hashes.json';
const WORKERS = 2;

const FEATURED = 'Featured pictures on Wikimedia Commons|Quality images';
const INFO = {
  action: 'query',
  prop: 'imageinfo',
  iiprop: 'size|mime|extmetadata',
  iiextmetadatafilter: 'Categories|Artist|LicenseShortName',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Perceptual hashes by file name, kept between runs so a rerun does not refetch them. */
let hashes = {};

/** A small thumbnail's hash, or null if it cannot be fetched or decoded. */
async function hashOf(name) {
  if (name in hashes) return hashes[name];
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=120`;
  let hash = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (response.status === 429 || response.status >= 500) throw new Error(String(response.status));
      if (response.ok) hash = dhash(Buffer.from(await response.arrayBuffer()));
      break;
    } catch (error) {
      // A file that cannot be decoded will not decode next time either.
      if (!/^\d+$/.test(error.message)) break;
      await sleep(1500 * 2 ** attempt);
    }
  }
  hashes[name] = hash;
  return hash;
}

/**
 * The first `limit` of `ranked` that are not near copies of each other or of the `seed` photos.
 * Hashes are fetched six at a time, only as far down the ranking as needed.
 */
async function distinct(ranked, seed, limit) {
  const kept = [];
  const keptHashes = (await Promise.all(seed.map(hashOf))).filter(Boolean);
  for (let start = 0; start < ranked.length && kept.length < limit; start += 6) {
    const batch = ranked.slice(start, start + 6);
    const batchHashes = await Promise.all(batch.map(hashOf));
    batch.forEach((name, index) => {
      const hash = batchHashes[index];
      if (kept.length >= limit || (hash && isDuplicate(hash, keptHashes))) return;
      kept.push(name);
      if (hash) keptHashes.push(hash);
    });
  }
  return kept;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

/** A Commons API call that waits out rate limits. Resolves to null if it keeps failing. */
async function commons(params) {
  const url = new URL(COMMONS);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (response.status === 429 || response.status >= 500) throw new Error(String(response.status));
      const data = await response.json();
      if (data.error?.code === 'maxlag') throw new Error('maxlag');
      return data.error ? null : data;
    } catch {
      await sleep(1500 * 2 ** attempt);
    }
  }
  return null;
}

/** The files in a Commons API response, with the fields the picker needs. */
function filesFrom(data) {
  const files = [];
  for (const page of data?.query?.pages ?? []) {
    const info = page.imageinfo?.[0];
    if (!info || !page.title?.startsWith('File:')) continue;
    files.push({
      title: page.title.slice(5),
      mime: info.mime,
      width: info.width,
      height: info.height,
      categories: info.extmetadata?.Categories?.value ?? '',
      credit: creditFrom(info.extmetadata),
    });
  }
  return files;
}

/** Candidate photographs for a Commons category: its best-marked files, its most relevant, its first. */
async function candidates(category) {
  const name = category.replace(/"/g, ' ');
  const [featured, relevant, members] = await Promise.all([
    commons({ ...INFO, generator: 'search', gsrnamespace: '6', gsrlimit: '50', gsrsearch: `deepcategory:"${name}" incategory:"${FEATURED}"` }),
    commons({ ...INFO, generator: 'search', gsrnamespace: '6', gsrlimit: '50', gsrsearch: `deepcategory:"${name}" filetype:bitmap` }),
    commons({ ...INFO, generator: 'categorymembers', gcmtitle: `Category:${name}`, gcmtype: 'file', gcmlimit: '50' }),
  ]);
  const byTitle = new Map();
  for (const file of [...filesFrom(featured), ...filesFrom(relevant), ...filesFrom(members)]) {
    byTitle.set(file.title, file);
  }
  return [...byTitle.values()];
}

/** Photographs whose text mentions the site by name, for sites with a thin or missing category. */
async function searchByName(siteName) {
  // "Frontiers of the Roman Empire: The Danube Limes" is better searched as its main title.
  const term = siteName.split(/[:(]/)[0].replace(/"/g, ' ').trim();
  if (term.length < 4) return [];
  const data = await commons({
    ...INFO,
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '50',
    gsrsearch: `"${term}" filetype:bitmap`,
  });
  return filesFrom(data);
}

/** How many Wikipedia articles use each of the best-looking candidates. */
async function addUsage(files) {
  const best = files
    .filter(isUsablePhoto)
    .sort((a, b) => scorePhoto(b) - scorePhoto(a))
    .slice(0, 24);
  if (best.length === 0) return;
  const titles = best.map((file) => `File:${file.title}`).join('|');
  const data = await commons({ action: 'query', prop: 'globalusage', gulimit: 'max', titles });
  const usage = new Map((data?.query?.pages ?? []).map((page) => [page.title, page.globalusage?.length ?? 0]));
  for (const file of best) file.usage = usage.get(`File:${file.title}`) ?? 0;
}

/** UNESCO number -> Commons category, preferring the property's own Wikidata item. */
async function categoriesByNumber(photos) {
  const query = 'SELECT ?item ?unescoId ?cat WHERE { ?item wdt:P757 ?unescoId . ?item wdt:P373 ?cat . }';
  const response = await fetch(WIKIDATA, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ query, format: 'json' }).toString(),
  });
  if (!response.ok) throw new Error(`Wikidata returned ${response.status}`);
  const best = new Map();
  for (const row of (await response.json()).results.bindings) {
    const id = row.unescoId.value.trim();
    const number = unescoNumber(id);
    if (!number) continue;
    const qid = row.item.value.split('/').pop();
    const rank = qid === photos[number]?.qid ? -1 : parentRank(id);
    if (!best.has(number) || rank < best.get(number).rank) best.set(number, { rank, category: row.cat.value });
  }
  return new Map([...best].map(([number, { category }]) => [number, category]));
}

/** Size, type, credit and categories for a list of Commons files, 50 to a request. */
async function infoFor(names) {
  const info = new Map();
  for (let start = 0; start < names.length; start += 50) {
    const titles = names.slice(start, start + 50).map((name) => `File:${name}`).join('|');
    for (const file of filesFrom(await commons({ ...INFO, titles }))) info.set(file.title, file);
  }
  return info;
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;

  // Work from Wikidata's own photos (plus hand overrides), not data/photos.json: that file has the
  // better leads from this gallery written into it.
  const overrides = await readJson(OVERRIDES, {});
  await mkdir('.cache', { recursive: true });
  hashes = await readJson(HASH_CACHE, {});
  const photos = await readBasePhotos();
  const hide = overrides.hide ?? {};
  const gallery = await readJson(OUTPUT, { extras: {}, credits: {}, demoted: {} });
  const categories = await categoriesByNumber(photos);
  const names = Object.fromEntries(
    Object.entries((await readJson(UNESCO, { sites: {} })).sites).map(([number, record]) => [number, record.name]),
  );

  const todo = Object.keys(photos).filter(
    (number) => (!only || only.has(number)) && (refresh || only || !(number in gallery.extras)),
  );
  console.log(`${todo.length} sites to fetch (${categories.size} have a Commons category)`);

  let done = 0;
  const save = () => writeFile(OUTPUT, `${JSON.stringify(gallery)}\n`);
  const queue = [...todo];
  const worker = async () => {
    while (queue.length > 0) {
      const number = queue.shift();
      const primary = photos[number].image ? fileNameFromImage(photos[number].image) : null;
      const category = categories.get(number);
      const skip = [...(primary ? [primary] : []), ...(hide[number] ?? [])];
      const limit = PHOTOS_PER_SITE - (primary ? 1 : 0);
      let files = category ? await candidates(category) : [];
      if (pickExtras(files, skip, limit).length < limit) {
        // The category had too little; add photos that name the site.
        const known = new Set(files.map((file) => file.title));
        files = [...files, ...(await searchByName(names[number] ?? '')).filter((file) => !known.has(file.title))];
      }
      await addUsage(files);
      // Rank more than needed, so near copies can be dropped and replaced by the next best.
      const extras = await distinct(pickExtras(files, skip, limit * 3), primary ? [primary] : [], limit);
      for (const file of files) if (extras.includes(file.title)) gallery.credits[file.title] = file.credit;
      gallery.extras[number] = extras;
      done += 1;
      if (done % 40 === 0) {
        await save();
        await writeFile(HASH_CACHE, JSON.stringify(hashes));
        console.log(`${done}/${todo.length}`);
      }
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));

  // The Wikidata photos need credits too, and a check: a satellite image, a map, a very wide
  // panorama or a small file makes a poor lead, so the best extra goes first instead.
  const primaries = Object.entries(photos)
    .map(([number, entry]) => [number, entry.image && fileNameFromImage(entry.image)])
    .filter(([, name]) => name);
  const info = await infoFor(primaries.map(([, name]) => name));
  gallery.demoted = {};
  for (const [number, name] of primaries) {
    const file = info.get(name);
    if (file) gallery.credits[name] = file.credit;
    if (file && !isUsablePhoto(file) && (gallery.extras[number] ?? []).length > 0) gallery.demoted[number] = name;
  }
  await save();
  await writeFile(HASH_CACHE, JSON.stringify(hashes));

  const counts = {};
  for (const [number, extras] of Object.entries(gallery.extras)) {
    const total = extras.length + (photos[number]?.image ? 1 : 0);
    counts[total] = (counts[total] ?? 0) + 1;
  }
  console.log('Photos per site (count of sites):', counts);
  console.log(`${Object.keys(gallery.demoted).length} sites lead with an extra because their Wikidata photo is a poor fit`);
  await writePhotos();
}

await main();
