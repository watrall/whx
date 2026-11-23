#!/usr/bin/env node
/**
 * Writes data/photos.json from data/sites.json (the Wikidata query result).
 * Usage: node scripts/build-photos.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { applyGalleryLeads, applyPhotoOverrides, buildPhotos } from './photos.mjs';

/** A JSON file, or null if it does not exist yet. */
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/** The hand-picked replacements; a missing file means there are none. */
async function readOverrides(path) {
  return (await readJson(path))?.photos ?? {};
}

/**
 * Wikidata's photo for each site, plus the hand overrides, before any gallery lead is applied.
 * The gallery scripts count and compare against this, not against data/photos.json.
 */
export async function readBasePhotos(
  sitesPath = 'data/sites.json',
  overridesPath = 'data/photo-overrides.json',
) {
  const data = (await readJson(sitesPath)) ?? { results: { bindings: [] } };
  return applyPhotoOverrides(buildPhotos(data.results.bindings), await readOverrides(overridesPath));
}

export async function writePhotos(
  sitesPath = 'data/sites.json',
  outPath = 'data/photos.json',
  overridesPath = 'data/photo-overrides.json',
  galleryPath = 'data/gallery.json',
) {
  const data = JSON.parse(await readFile(sitesPath, 'utf8'));
  const photos = applyGalleryLeads(
    applyPhotoOverrides(buildPhotos(data.results.bindings), await readOverrides(overridesPath)),
    await readJson(galleryPath),
  );
  await writeFile(outPath, JSON.stringify({ photos }) + '\n');
  const withImage = Object.values(photos).filter((entry) => entry.image).length;
  console.log(`Wrote ${Object.keys(photos).length} entries (${withImage} with a photo) to ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await writePhotos();
}
