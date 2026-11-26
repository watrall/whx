import type { Site } from './types.ts';

/** A fast, well-spread 32-bit hash of a string (FNV-1a). */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/**
 * The sites to preview: only ones with a photo, in an order set by the seed. A site's rank depends
 * only on the seed and its id, so panning or filtering changes who is eligible, never the order.
 */
export function pickPreviews(sites: Site[], seed: number, count: number): Site[] {
  return sites
    .filter((site) => site.image)
    .map((site) => ({ site, rank: hash(`${seed}:${site.id}`) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map((entry) => entry.site);
}
