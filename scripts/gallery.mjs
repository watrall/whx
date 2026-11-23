export const PHOTOS_PER_SITE = 5;

const MIN_WIDTH = 1200;
const MIN_HEIGHT = 700;
const MIN_ASPECT = 1.1;
const MAX_ASPECT = 2.6;

const NAME_REJECT =
  /\b(maps?|plans?|diagrams?|logos?|flags?|locator|location|coat of arms|stamps?|seals?|icons?|charts?|graphs?|schematic|drawings?|engravings?|lithographs?|posters?|brochures?|screenshots?|signs?|plaques?)\b/i;

const CATEGORY_REJECT =
  /\b(maps?|diagrams?|logos?|flags?|coats of arms|drawings?|paintings?|engravings?|lithographs?|postage stamps?|posters?|screenshots?|icons?|floor plans?|scanned)\b/i;

export function fileNameFromImage(image) {
  try {
    const name = decodeURIComponent(new URL(image).pathname.split('/').pop() ?? '');
    return name.replace(/_/g, ' ') || null;
  } catch {
    return null;
  }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

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

export function creditFrom(extmetadata) {
  const value = (key) => cleanText(extmetadata?.[key]?.value);
  let by = value('Artist');
  if (/^(unknown|anonymous|n\/a|see below)/i.test(by) || by.length > 80) by = '';
  return { by, license: value('LicenseShortName') };
}

export function isUsablePhoto({ title, mime, width, height, categories }) {
  if (mime !== 'image/jpeg') return false;
  if (!(width >= MIN_WIDTH && height >= MIN_HEIGHT)) return false;
  const aspect = width / height;
  if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) return false;
  if (NAME_REJECT.test(title)) return false;
  return !CATEGORY_REJECT.test(categories ?? '');
}

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

export function groupKey(title) {
  return title
    .replace(/\.[a-z]+$/i, '')
    .replace(/[\s_-]*[(\d)]+\s*$/g, '')
    .toLowerCase();
}

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

export const DUPLICATE_DISTANCE = 18;

export function hamming(a, b) {
  let bits = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (bits > 0n) {
    count += Number(bits & 1n);
    bits >>= 1n;
  }
  return count;
}

export function isDuplicate(hash, kept, distance = DUPLICATE_DISTANCE) {
  return kept.some((other) => hamming(hash, other) <= distance);
}

export function pruneCredits(credits, keep) {
  const wanted = new Set(keep);
  return Object.fromEntries(Object.entries(credits).filter(([name]) => wanted.has(name)));
}
