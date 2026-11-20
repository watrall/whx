/**
 * Picks a photo and a Wikidata item for each UNESCO site from the Wikidata query result.
 * Wikidata is used only for this: UNESCO's file supplies everything else about a site.
 * Pure functions, no I/O.
 */

const FILE_PATH = '/wiki/Special:FilePath/';

/** A Commons file URL on https, without any size parameter; anything else is rejected. */
export function normalizeCommonsImage(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.hostname !== 'commons.wikimedia.org' || !url.pathname.startsWith(FILE_PATH)) return null;
    url.protocol = 'https:';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

/** Leading digits of a UNESCO ID such as "710bis" or "669bis-007". */
export function unescoNumber(unescoId) {
  return typeof unescoId === 'string' ? (unescoId.match(/^\d+/)?.[0] ?? null) : null;
}

/** How much a Wikidata record looks like the property itself, not one of its components. */
function parentRank(unescoId) {
  if (/-\d+/.test(unescoId)) return 2; // "669bis-007": one component of a serial site
  if (/^\d+$/.test(unescoId)) return 0; // the plain number
  return 1; // an extension or revision such as "710bis"
}

/** Returns { [unescoNumber]: { qid, image? } }. */
export function buildPhotos(bindings) {
  const groups = new Map();
  for (const binding of bindings) {
    const unescoId = binding.unescoId?.value?.trim();
    const number = unescoNumber(unescoId);
    const qid = binding.item?.value?.split('/').pop();
    if (!number || !qid) continue;
    const entry = {
      qid,
      rank: parentRank(unescoId),
      image: normalizeCommonsImage(binding.image?.value),
    };
    if (!groups.has(number)) groups.set(number, []);
    groups.get(number).push(entry);
  }

  const photos = {};
  for (const [number, entries] of groups) {
    entries.sort((a, b) => a.rank - b.rank);
    const withImage = entries.find((entry) => entry.image);
    photos[number] = withImage
      ? { qid: entries[0].qid, image: withImage.image }
      : { qid: entries[0].qid };
  }
  return photos;
}
