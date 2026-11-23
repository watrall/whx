#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dhash } from './dhash.mjs';
import {
  countLanguages,
  creditFrom,
  fileNameFromImage,
  isDuplicate,
  isUsablePhoto,
  pickExtras,
  PHOTOS_PER_SITE,
  pruneCredits,
  scorePhoto,
} from './gallery.mjs';
import { readBasePhotos, writePhotos } from './build-photos.mjs';
import { fetchWithRetry, queryWikidata, readJson, sleep, writeJson } from './io.mjs';
import { commonsFileUrl, parentRank, unescoNumber } from './photos.mjs';

const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const OVERRIDES = 'data/photo-overrides.json';
const UNESCO = 'data/unesco.json';
const OUTPUT = 'data/gallery.json';
const HASH_CACHE = '.cache/gallery-hashes.json';

const WORKERS = 2;
const ARTICLE_FILL_BELOW = 4;
const ARTICLE_PACE_MS = 80;
const SAVE_EVERY = 40;
const SEARCH_LIMIT = '50';
const INFO_BATCH = 50;
const USAGE_CANDIDATES = 24;
const HASH_BATCH = 6;
const HASH_THUMB_WIDTH = 120;
const RANK_DEPTH = 3;
const MAXLAG_RETRIES = 5;

const FEATURED = 'Featured pictures on Wikimedia Commons|Quality images';
const INFO = {
  action: 'query',
  prop: 'imageinfo',
  iiprop: 'size|mime|extmetadata',
  iiextmetadatafilter: 'Categories|Artist|LicenseShortName',
};

function createHasher(cache) {
  return async function hashOf(name) {
    if (name in cache) return cache[name];
    const response = await fetchWithRetry(`${commonsFileUrl(name)}?width=${HASH_THUMB_WIDTH}`, {}, 4);
    if (!response) return null;
    let hash = null;
    if (response.ok) {
      try {
        hash = dhash(Buffer.from(await response.arrayBuffer()));
      } catch {
        hash = null;
      }
    }
    cache[name] = hash;
    return hash;
  };
}

async function distinct(ranked, seed, limit, hashOf) {
  const kept = [];
  const keptHashes = (await Promise.all(seed.map(hashOf))).filter(Boolean);
  for (let start = 0; start < ranked.length && kept.length < limit; start += HASH_BATCH) {
    const batch = ranked.slice(start, start + HASH_BATCH);
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

async function commons(params) {
  const url = new URL(COMMONS);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params });
  for (let attempt = 0; attempt < MAXLAG_RETRIES; attempt += 1) {
    const response = await fetchWithRetry(url);
    if (!response) return null;
    const data = await response.json();
    if (data.error?.code !== 'maxlag') return data.error ? null : data;
    await sleep(1500 * 2 ** attempt);
  }
  return null;
}

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

function searchFiles(search) {
  return commons({ ...INFO, generator: 'search', gsrnamespace: '6', gsrlimit: SEARCH_LIMIT, gsrsearch: search });
}

async function candidates(category) {
  const name = category.replace(/"/g, ' ');
  const [featured, relevant, members] = await Promise.all([
    searchFiles(`deepcategory:"${name}" incategory:"${FEATURED}"`),
    searchFiles(`deepcategory:"${name}" filetype:bitmap`),
    commons({ ...INFO, generator: 'categorymembers', gcmtitle: `Category:${name}`, gcmtype: 'file', gcmlimit: SEARCH_LIMIT }),
  ]);
  const byTitle = new Map();
  for (const file of [...filesFrom(featured), ...filesFrom(relevant), ...filesFrom(members)]) {
    byTitle.set(file.title, file);
  }
  return [...byTitle.values()];
}

async function searchByName(siteName) {
  const term = siteName.split(/[:(]/)[0].replace(/"/g, ' ').trim();
  if (term.length < 4) return [];
  return filesFrom(await searchFiles(`"${term}" filetype:bitmap`));
}

async function addUsage(files) {
  const best = files
    .filter(isUsablePhoto)
    .sort((a, b) => scorePhoto(b) - scorePhoto(a))
    .slice(0, USAGE_CANDIDATES);
  if (best.length === 0) return;
  const titles = best.map((file) => `File:${file.title}`).join('|');
  const data = await commons({ action: 'query', prop: 'globalusage', gulimit: 'max', titles });
  const usage = new Map((data?.query?.pages ?? []).map((page) => [page.title, page.globalusage?.length ?? 0]));
  for (const file of best) file.usage = usage.get(`File:${file.title}`) ?? 0;
}

async function categoriesByNumber(photos) {
  const query = 'SELECT ?item ?unescoId ?cat WHERE { ?item wdt:P757 ?unescoId . ?item wdt:P373 ?cat . }';
  const best = new Map();
  for (const row of (await queryWikidata(query)).results.bindings) {
    const id = row.unescoId.value.trim();
    const number = unescoNumber(id);
    if (!number) continue;
    const qid = row.item.value.split('/').pop();
    const rank = qid === photos[number]?.qid ? -1 : parentRank(id);
    if (!best.has(number) || rank < best.get(number).rank) best.set(number, { rank, category: row.cat.value });
  }
  return new Map([...best].map(([number, { category }]) => [number, category]));
}

async function infoFor(names) {
  const info = new Map();
  for (let start = 0; start < names.length; start += INFO_BATCH) {
    const titles = names.slice(start, start + INFO_BATCH).map((name) => `File:${name}`).join('|');
    for (const file of filesFrom(await commons({ ...INFO, titles }))) info.set(file.title, file);
  }
  return info;
}

function mediaListUrl(lang, title) {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`;
}

async function articlesFor(numbers) {
  const byNumber = new Map();
  if (numbers.length === 0) return byNumber;
  const ids = numbers.map((number) => `"${number}"`).join(',');
  const query = `SELECT ?unescoId ?article WHERE { ?item wdt:P757 ?unescoId . FILTER(?unescoId IN (${ids})) ?article schema:about ?item ; schema:isPartOf ?site . FILTER(CONTAINS(STR(?site), ".wikipedia.org")) }`;
  for (const row of (await queryWikidata(query)).results.bindings) {
    const number = unescoNumber(row.unescoId.value.trim());
    const url = new URL(row.article.value);
    const article = { lang: url.hostname.split('.')[0], title: decodeURIComponent(url.pathname.replace('/wiki/', '')) };
    byNumber.set(number, [...(byNumber.get(number) ?? []), article]);
  }
  return byNumber;
}

async function articleFiles(articles) {
  const lists = [];
  for (const { lang, title } of articles) {
    const response = await fetchWithRetry(mediaListUrl(lang, title));
    if (response?.ok) lists.push(await response.json());
    await sleep(ARTICLE_PACE_MS);
  }
  const counts = countLanguages(lists);
  const info = await infoFor([...counts.keys()]);
  return [...info.values()].map((file) => ({ ...file, languages: counts.get(file.title) ?? 0 }));
}

async function fillFromArticles(number, articles, context, gallery) {
  const { photos, types, hide, hashOf } = context;
  const primary = photos[number].image ? fileNameFromImage(photos[number].image) : null;
  const have = gallery.extras[number];
  const seed = [...(primary ? [primary] : []), ...have];
  const limit = PHOTOS_PER_SITE - seed.length;
  const files = await articleFiles(articles);
  const options = { allowAnimals: types[number] !== 'cultural' };
  const ranked = pickExtras(files, [...seed, ...(hide[number] ?? [])], limit * RANK_DEPTH, options);
  const added = await distinct(ranked, seed, limit, hashOf);
  const credits = Object.fromEntries(files.filter((file) => added.includes(file.title)).map((file) => [file.title, file.credit]));
  return { extras: [...have, ...added], credits };
}

function parseArgs(argv) {
  const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
  return { refresh: argv.includes('--refresh'), only: only ? new Set(only.split(',')) : null };
}

async function pickForSite(number, context) {
  const { photos, categories, names, types, hide, hashOf } = context;
  const primary = photos[number].image ? fileNameFromImage(photos[number].image) : null;
  const category = categories.get(number);
  const skip = [...(primary ? [primary] : []), ...(hide[number] ?? [])];
  const limit = PHOTOS_PER_SITE - (primary ? 1 : 0);
  const options = { allowAnimals: types[number] !== 'cultural' };

  let files = category ? await candidates(category) : [];
  if (pickExtras(files, skip, limit, options).length < limit) {
    const known = new Set(files.map((file) => file.title));
    const named = await searchByName(names[number] ?? '');
    files = [...files, ...named.filter((file) => !known.has(file.title))];
  }
  await addUsage(files);

  const ranked = pickExtras(files, skip, limit * RANK_DEPTH, options);
  const extras = await distinct(ranked, primary ? [primary] : [], limit, hashOf);
  const credits = Object.fromEntries(files.filter((file) => extras.includes(file.title)).map((file) => [file.title, file.credit]));
  return { extras, credits };
}

async function findDemoted(photos, gallery) {
  const primaries = Object.entries(photos)
    .map(([number, entry]) => [number, entry.image && fileNameFromImage(entry.image)])
    .filter(([, name]) => name);
  const info = await infoFor(primaries.map(([, name]) => name));
  const demoted = {};
  for (const [number, name] of primaries) {
    const file = info.get(name);
    if (file) gallery.credits[name] = file.credit;
    if (file && !isUsablePhoto(file) && (gallery.extras[number] ?? []).length > 0) demoted[number] = name;
  }
  return { demoted, primaryNames: primaries.map(([, name]) => name) };
}

function countPhotos(gallery, photos) {
  const counts = {};
  for (const [number, extras] of Object.entries(gallery.extras)) {
    const total = extras.length + (photos[number]?.image ? 1 : 0);
    counts[total] = (counts[total] ?? 0) + 1;
  }
  return counts;
}

async function main() {
  const { refresh, only } = parseArgs(process.argv.slice(2));

  await mkdir('.cache', { recursive: true });
  const hashCache = await readJson(HASH_CACHE, {});
  const photos = await readBasePhotos();
  const gallery = await readJson(OUTPUT, { extras: {}, credits: {}, demoted: {} });
  const unesco = await readJson(UNESCO, { sites: {} });
  const context = {
    photos,
    categories: await categoriesByNumber(photos),
    names: Object.fromEntries(Object.entries(unesco.sites).map(([number, record]) => [number, record.name])),
    types: Object.fromEntries(Object.entries(unesco.sites).map(([number, record]) => [number, record.type])),
    hide: (await readJson(OVERRIDES, {})).hide ?? {},
    hashOf: createHasher(hashCache),
  };

  const todo = Object.keys(photos).filter(
    (number) => (!only || only.has(number)) && (refresh || only || !(number in gallery.extras)),
  );
  console.log(`${todo.length} sites to fetch (${context.categories.size} have a Commons category)`);

  let done = 0;
  const queue = [...todo];
  const worker = async () => {
    while (queue.length > 0) {
      const number = queue.shift();
      const { extras, credits } = await pickForSite(number, context);
      Object.assign(gallery.credits, credits);
      gallery.extras[number] = extras;
      done += 1;
      if (done % SAVE_EVERY === 0) {
        await writeJson(OUTPUT, gallery);
        await writeJson(HASH_CACHE, hashCache);
        console.log(`${done}/${todo.length}`);
      }
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));

  const total = (number) => gallery.extras[number].length + (photos[number].image ? 1 : 0);
  const thin = todo.filter((number) => total(number) < ARTICLE_FILL_BELOW);
  const articles = await articlesFor(thin);
  let gained = 0;
  for (const number of thin) {
    if (!articles.get(number)?.length) continue;
    const before = gallery.extras[number].length;
    const filled = await fillFromArticles(number, articles.get(number), context, gallery);
    Object.assign(gallery.credits, filled.credits);
    gallery.extras[number] = filled.extras;
    if (filled.extras.length > before) gained += 1;
  }
  console.log(`${thin.length} sites had fewer than ${ARTICLE_FILL_BELOW} photos; ${gained} gained some from Wikipedia articles`);

  const { demoted, primaryNames } = await findDemoted(photos, gallery);
  gallery.demoted = demoted;
  gallery.credits = pruneCredits(gallery.credits, [...Object.values(gallery.extras).flat(), ...primaryNames]);
  await writeJson(OUTPUT, gallery);
  await writeJson(HASH_CACHE, hashCache);

  console.log('Photos per site (count of sites):', countPhotos(gallery, photos));
  console.log(`${Object.keys(demoted).length} sites lead with an extra because their Wikidata photo is a poor fit`);
  await writePhotos();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
