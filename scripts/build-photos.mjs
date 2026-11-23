#!/usr/bin/env node
/**
 * Writes data/photos.json from data/sites.json (the Wikidata query result).
 * Usage: node scripts/build-photos.mjs
 */
import { readJson, writeJson } from './io.mjs';
import { applyGalleryLeads, applyPhotoOverrides, buildPhotos } from './photos.mjs';

async function readOverrides(path) {
  return (await readJson(path))?.photos ?? {};
}

export async function readBasePhotos(
  sitesPath = 'data/sites.json',
  overridesPath = 'data/photo-overrides.json',
) {
  const data = await readJson(sitesPath, { results: { bindings: [] } });
  return applyPhotoOverrides(buildPhotos(data.results.bindings), await readOverrides(overridesPath));
}

export async function writePhotos(
  sitesPath = 'data/sites.json',
  outPath = 'data/photos.json',
  overridesPath = 'data/photo-overrides.json',
  galleryPath = 'data/gallery.json',
) {
  const base = await readBasePhotos(sitesPath, overridesPath);
  const photos = applyGalleryLeads(base, await readJson(galleryPath));
  await writeJson(outPath, { photos });
  const withImage = Object.values(photos).filter((entry) => entry.image).length;
  console.log(`Wrote ${Object.keys(photos).length} entries (${withImage} with a photo) to ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await writePhotos();
}
