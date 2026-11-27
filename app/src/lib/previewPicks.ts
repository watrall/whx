import { hashString } from './hash.ts';
import type { Site } from './types.ts';

/**
 * The sites to preview: only ones with a photo, in an order set by the seed. A site's rank depends
 * only on the seed and its id, so panning or filtering changes who is eligible, never the order.
 */
export function pickPreviews(sites: Site[], seed: number, count: number): Site[] {
  return sites
    .filter((site) => site.image)
    .map((site) => ({ site, rank: hashString(`${seed}:${site.id}`) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map((entry) => entry.site);
}
