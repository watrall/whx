/**
 * Picks a handful of photographs per site from Wikimedia Commons, and works out how to credit
 * each one. Pure functions, no I/O: build-gallery.mjs does the fetching.
 */

/** Photos a card header aims for, counting the Wikidata one. Four is acceptable if five are not there. */
export const PHOTOS_PER_SITE = 5;

const MIN_WIDTH = 1200;
const MIN_HEIGHT = 700;
// The card header is 3:2 or 16:9, so portrait shots crop badly and panoramas are mostly cut away.
const MIN_ASPECT = 1.1;
const MAX_ASPECT = 2.6;

// Words in a file name that mean it is not a photograph of the place.
const NAME_REJECT =
  /\b(maps?|plans?|diagrams?|logos?|flags?|locator|location|coat of arms|stamps?|seals?|icons?|charts?|graphs?|schematic|drawings?|engravings?|lithographs?|posters?|brochures?|screenshots?|signs?|plaques?)\b/i;

// Commons categories that mean the same thing.
const CATEGORY_REJECT =
  /\b(maps?|diagrams?|logos?|flags?|coats of arms|drawings?|paintings?|engravings?|lithographs?|postage stamps?|posters?|screenshots?|icons?|floor plans?|scanned)\b/i;

/** The Commons file name inside a Special:FilePath URL, with spaces rather than underscores. */
export function fileNameFromImage(image) {
  try {
    const name = decodeURIComponent(new URL(image).pathname.split('/').pop() ?? '');
    return name.replace(/_/g, ' ') || null;
  } catch {
    return null;
  }
}

/** A Special:FilePath URL for a Commons file name. */
export function imageFromFileName(name) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Plain text from the HTML snippets Commons returns for author and licence. */
export function cleanText(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
      if (code[0] === '#') {
        const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(point) ? String.fromCodePoint(point) : match;
      }
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** { by, license } for a file, from its Commons metadata. Either can be empty. */
export function creditFrom(extmetadata) {
  const value = (key) => cleanText(extmetadata?.[key]?.value);
  let by = value('Artist');
  // "Unknown author" and similar say nothing; a very long value is a wall of markup, not a name.
  if (/^(unknown|anonymous|n\/a|see below)/i.test(by) || by.length > 80) by = '';
  return { by, license: value('LicenseShortName') };
}

/** Whether a Commons file is a photograph worth showing in a card header. */
export function isUsablePhoto({ title, mime, width, height, categories }) {
  if (mime !== 'image/jpeg') return false;
  if (!(width >= MIN_WIDTH && height >= MIN_HEIGHT)) return false;
  const aspect = width / height;
  if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) return false;
  if (NAME_REJECT.test(title)) return false;
  return !CATEGORY_REJECT.test(categories ?? '');
}

/**
 * Higher is better. Commons' own featured and quality marks count most; then how many
 * Wikipedia articles use the photo (the iconic shot of a place is the one editors reach for),
 * then resolution, then a shape that suits the card header.
 */
export function scorePhoto({ width, height, categories, usage }) {
  const cats = categories ?? '';
  let score = 0;
  if (/Featured pictures/i.test(cats)) score += 1000;
  if (/Quality images/i.test(cats)) score += 500;
  if (/Valued images/i.test(cats)) score += 200;
  score += Math.log2(1 + (usage ?? 0)) * 40;
  score += Math.min((width * height) / 1e6, 24) * 10;
  score -= Math.abs(width / height - 1.5) * 10;
  return score;
}

/** "Kanton Day 3 (37).jpg" and "Kanton Day 3 (38).jpg" are the same shot. */
export function groupKey(title) {
  return title
    .replace(/\.[a-z]+$/i, '')
    .replace(/[\s_-]*[(\d)]+\s*$/g, '')
    .toLowerCase();
}

/**
 * The best extra photos for a site. `files` are { title, mime, width, height, categories };
 * `skip` holds file names not to repeat (the main photo, and any hidden by hand).
 */
export function pickExtras(files, skip = [], limit = PHOTOS_PER_SITE - 1) {
  const skipped = new Set(skip.map((name) => name.replace(/_/g, ' ')));
  const seen = new Set(skip.map((name) => groupKey(name)));
  const picked = [];
  const ranked = files
    .filter((file) => !skipped.has(file.title) && isUsablePhoto(file))
    .sort((a, b) => scorePhoto(b) - scorePhoto(a) || a.title.localeCompare(b.title));
  for (const file of ranked) {
    const key = groupKey(file.title);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(file.title);
    if (picked.length === limit) break;
  }
  return picked;
}

/**
 * Hashes this close (out of 64 bits) are treated as the same photo. Measured on real galleries:
 * different frames of one scene land at 16 to 19, different scenes at 22 and up.
 */
export const DUPLICATE_DISTANCE = 18;

/** How many of the 64 bits differ between two hashes from dhash.mjs. */
export function hamming(a, b) {
  let bits = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (bits > 0n) {
    count += Number(bits & 1n);
    bits >>= 1n;
  }
  return count;
}

/** Whether `hash` is a near copy of any in `kept`. */
export function isDuplicate(hash, kept, distance = DUPLICATE_DISTANCE) {
  return kept.some((other) => hamming(hash, other) <= distance);
}
