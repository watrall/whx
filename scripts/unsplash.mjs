const UTM = 'utm_source=whx&utm_medium=referral';

const GENERIC = new Set([
  'the', 'of', 'and', 'de', 'la', 'le', 'del', 'des', 'du', 'in', 'at', 'on',
  'historic', 'historical', 'ancient', 'old', 'centre', 'center', 'city', 'town', 'site', 'sites',
  'national', 'park', 'area', 'region', 'cultural', 'natural', 'heritage', 'world', 'landscape',
  'monument', 'monuments', 'zone', 'reserve', 'protected', 'archaeological',
]);

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function searchTerm(siteName) {
  return String(siteName ?? '').split(/[:(]/)[0].replace(/\s+/g, ' ').trim();
}

export function distinctiveWords(siteName) {
  return normalize(searchTerm(siteName))
    .split(' ')
    .filter((word) => word.length >= 3 && !GENERIC.has(word));
}

function haystack(photo) {
  const tags = (photo.tags ?? []).map((tag) => tag.title);
  const place = photo.location ? [photo.location.name, photo.location.city, photo.location.country] : [];
  return normalize([photo.description, photo.alt_description, ...tags, ...place].join(' '));
}

export function isRelevant(photo, siteName) {
  const words = distinctiveWords(siteName);
  if (words.length === 0) return false;
  const text = ` ${haystack(photo)} `;
  const found = words.filter((word) => text.includes(` ${word}`)).length;
  return found >= Math.ceil((words.length * 2) / 3);
}

export function isUsableSize(photo) {
  const { width, height } = photo;
  if (!(width >= 2000 && height >= 1000)) return false;
  const aspect = width / height;
  return aspect >= 1.2 && aspect <= 2.4;
}

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

export function pickUnsplash(results, siteName, limit, usedIds = []) {
  const used = new Set(usedIds);
  return results
    .filter((photo) => !used.has(photo.id) && isUsableSize(photo) && isRelevant(photo, siteName))
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map(toEntry);
}
