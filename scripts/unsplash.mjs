/**
 * Choosing Unsplash photos for sites that Wikimedia Commons does not cover well. Pure functions,
 * no I/O: fill-unsplash.mjs does the fetching.
 *
 * Unsplash's licence lets the photos be used freely, and its API terms ask for the photo to be
 * hotlinked, for the photographer and Unsplash to be credited with links (carrying a utm_source),
 * and for a download to be reported when a photo is picked for use.
 */

const UTM = 'utm_source=whx&utm_medium=referral';

/** Words that appear in many site names and say nothing about which site it is. */
const GENERIC = new Set([
  'the', 'of', 'and', 'de', 'la', 'le', 'del', 'des', 'du', 'in', 'at', 'on',
  'historic', 'historical', 'ancient', 'old', 'centre', 'center', 'city', 'town', 'site', 'sites',
  'national', 'park', 'area', 'region', 'cultural', 'natural', 'heritage', 'world', 'landscape',
  'monument', 'monuments', 'zone', 'reserve', 'protected', 'archaeological',
]);

/** Lower-case, accent-free text for matching. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The part of a site name worth searching for: "Danube Limes" style subtitles are dropped. */
export function searchTerm(siteName) {
  return String(siteName ?? '').split(/[:(]/)[0].replace(/\s+/g, ' ').trim();
}

/** The words of a site name that tell it apart from other sites. */
export function distinctiveWords(siteName) {
  return normalize(searchTerm(siteName))
    .split(' ')
    .filter((word) => word.length >= 3 && !GENERIC.has(word));
}

/** All the text Unsplash holds about a photo, normalised, for checking it is of the right place. */
function haystack(photo) {
  const tags = (photo.tags ?? []).map((tag) => tag.title);
  const place = photo.location ? [photo.location.name, photo.location.city, photo.location.country] : [];
  return normalize([photo.description, photo.alt_description, ...tags, ...place].join(' '));
}

/**
 * Whether a search result is plausibly a photograph of this site. Search is loose, so this is
 * strict: at least two thirds of the name's distinctive words (all of them, for one or two words)
 * must appear in what Unsplash says about the photo.
 */
export function isRelevant(photo, siteName) {
  const words = distinctiveWords(siteName);
  if (words.length === 0) return false;
  const text = ` ${haystack(photo)} `;
  const found = words.filter((word) => text.includes(` ${word}`)).length;
  return found >= Math.ceil((words.length * 2) / 3);
}

/** A large landscape photo suits the card header. */
export function isUsableSize(photo) {
  const { width, height } = photo;
  if (!(width >= 2000 && height >= 1000)) return false;
  const aspect = width / height;
  return aspect >= 1.2 && aspect <= 2.4;
}

/** The stored form of a chosen photo. `url` keeps Unsplash's own tracking parameter. */
export function toEntry(photo) {
  const user = photo.user ?? {};
  return {
    id: photo.id,
    url: photo.urls?.raw ?? photo.urls?.regular,
    by: user.name ?? null,
    byUrl: user.links?.html ? `${user.links.html}?${UTM}` : null,
    link: photo.links?.html ? `${photo.links.html}?${UTM}` : null,
  };
}

/** The unsplash.com address to link "Unsplash" to in a credit. */
export const UNSPLASH_URL = `https://unsplash.com/?${UTM}`;

/** Up to `limit` relevant, well-sized photos, most liked first, skipping ids already used. */
export function pickUnsplash(results, siteName, limit, usedIds = []) {
  const used = new Set(usedIds);
  return results
    .filter((photo) => !used.has(photo.id) && isUsableSize(photo) && isRelevant(photo, siteName))
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map(toEntry);
}
