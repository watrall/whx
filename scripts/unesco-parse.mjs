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

/** Reads the flat <row><tag>value</tag>...</row> records into objects of raw strings. */
export function parseRows(xml) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const field of rowMatch[1].matchAll(/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/g)) {
      if (field[1] === 'geolocations') continue;
      row[field[1]] = field[2];
    }
    rows.push(row);
  }
  return rows;
}
