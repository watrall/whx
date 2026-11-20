/**
 * Parsing helpers for the UNESCO World Heritage Centre XML export
 * (https://whc.unesco.org/en/syndication/). Pure functions, no I/O, so they
 * can be tested without the source file.
 */

const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  ndash: '–', mdash: '—', hellip: '…',
  eacute: 'é', egrave: 'è', ecirc: 'ê', aacute: 'á', agrave: 'à', acirc: 'â',
  iacute: 'í', oacute: 'ó', ocirc: 'ô', uacute: 'ú', ccedil: 'ç', ntilde: 'ñ',
  scaron: 'š', yacute: 'ý', uuml: 'ü', ouml: 'ö', auml: 'ä',
};

/** Decodes numeric entities and the five predefined XML entities. */
export function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Decodes the HTML entities left inside a description after XML decoding. */
export function decodeHtmlEntities(text, onUnknown = () => {}) {
  return text.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name) => {
    if (name in NAMED_ENTITIES) return NAMED_ENTITIES[name];
    onUnknown(name);
    return match;
  });
}

/**
 * Turns a description's HTML into plain paragraphs. Formatting is simplified
 * (emphasis, links and spans are dropped) and the wording is untouched.
 */
export function htmlToParagraphs(html, onUnknown) {
  const text = decodeHtmlEntities(
    decodeXml(html)
      .replace(/<sup>\s*2\s*<\/sup>/gi, '²')
      .replace(/<sup>\s*3\s*<\/sup>/gi, '³')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
    onUnknown,
  );
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/[\s ]+/g, ' ').trim())
    .filter(Boolean);
}

/** Plain text from a short HTML fragment, such as a name with <i>italics</i>. */
export function htmlToText(html, onUnknown) {
  return htmlToParagraphs(html, onUnknown).join(' ');
}

/** Splits "Albania,Austria,Iran (Islamic Republic of)" into country names. */
export function splitStates(value) {
  return decodeXml(value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Reads the <row><tag>value</tag>...</row> records into objects of raw strings (geolocations stay as raw XML). */
export function parseRows(xml) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const field of rowMatch[1].matchAll(/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/g)) {
      row[field[1]] = field[2];
    }
    rows.push(row);
  }
  return rows;
}

/** The component points of a property from its <geolocations> XML. */
export function parsePois(geolocations) {
  const points = [];
  for (const match of (geolocations ?? '').matchAll(
    /<latitude>\s*(-?[\d.]+)\s*<\/latitude>\s*<longitude>\s*(-?[\d.]+)\s*<\/longitude>/g,
  )) {
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      points.push([lat, lon]);
    }
  }
  return points;
}

function toVector([lat, lon]) {
  const p = (lat * Math.PI) / 180;
  const l = (lon * Math.PI) / 180;
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
}

/**
 * The real point nearest the middle of a set of points. A serial property needs one
 * representative pin; the average could fall in the sea or another country, so the pin
 * is the component closest to the average (computed on the sphere, so the antimeridian
 * is safe).
 */
export function medoid(points) {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];
  const vectors = points.map(toVector);
  const mean = [0, 1, 2].map((axis) => vectors.reduce((sum, v) => sum + v[axis], 0) / vectors.length);
  let best = 0;
  let bestDot = -Infinity;
  vectors.forEach((v, index) => {
    const dot = v[0] * mean[0] + v[1] * mean[1] + v[2] * mean[2];
    if (dot > bestDot) {
      bestDot = dot;
      best = index;
    }
  });
  return points[best];
}

/** "(viii)(ix)(x)" or "(ii)|(iv)" to ["viii", "ix", "x"], in criteria order. */
export function parseCriteriaCodes(text) {
  const order = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  const found = new Set();
  for (const match of (text ?? '').matchAll(/\(([ivx]+)\)/gi)) {
    const code = match[1].toLowerCase();
    if (order.includes(code)) found.add(code);
  }
  return order.filter((code) => found.has(code));
}

/** UNESCO's category label to the app's site type. */
export function categoryToType(category) {
  const value = (category ?? '').trim().toLowerCase();
  if (value === 'natural') return 'natural';
  if (value === 'mixed') return 'mixed';
  return 'cultural';
}

/** Rounds to 4 decimal places (about 10 m), enough for a map pin and much smaller on disk. */
export function round4(value) {
  return Math.round(value * 10000) / 10000;
}
