#!/usr/bin/env node
/**
 * Writes data/photos.json from data/sites.json (the Wikidata query result).
 * Usage: node scripts/build-photos.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { buildPhotos } from './photos.mjs';

export async function writePhotos(sitesPath = 'data/sites.json', outPath = 'data/photos.json') {
  const data = JSON.parse(await readFile(sitesPath, 'utf8'));
  const photos = buildPhotos(data.results.bindings);
  await writeFile(outPath, JSON.stringify({ photos }) + '\n');
  const withImage = Object.values(photos).filter((entry) => entry.image).length;
  console.log(`Wrote ${Object.keys(photos).length} entries (${withImage} with a photo) to ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await writePhotos();
}
