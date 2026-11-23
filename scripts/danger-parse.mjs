/**
 * Parsing helpers for Wikipedia's "List of World Heritage in Danger" wikitext.
 * Pure functions, no I/O, so they can be tested without network access.
 */

const ENTITIES = { nbsp: ' ', amp: '&', ndash: '–', mdash: '—', quot: '"', rsquo: '’', lsquo: '‘' };

/** Reduces a wikitext fragment to plain text: no refs, templates, links or markup. */
export function cleanWikitext(raw) {
  let text = raw
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, ' ');
  // Templates nest, so strip the innermost ones repeatedly.
  for (let i = 0; i < 6 && /\{\{[^{}]*\}\}/.test(text); i += 1) {
    text = text.replace(/\{\{[^{}]*\}\}/g, '');
  }
  return text
    .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

/** The "since" year from a "Years endangered" cell such as "1992–" or "1996–2007, 2018–". */
export function sinceYear(cell) {
  const text = cleanWikitext(cell.replace(/^[^|]*\|/, (m) => (m.includes('=') ? '' : m)));
  let since = null;
  for (const match of text.matchAll(/(\d{4})\s*[–-]\s*(\d{4})?/g)) {
    if (!match[2]) since = Number(match[1]);
  }
  return since;
}

/** Splits one wikitext table into rows of { name, cells[], raw }. */
export function parseTable(tableText) {
  const rows = [];
  for (const chunk of tableText.split(/\n\|-[^\n]*\n/).slice(1)) {
    const lines = chunk.split('\n');
    const nameLine = lines.find((line) => line.startsWith('!'));
    if (!nameLine) continue;
    const cells = [];
    for (const line of lines) {
      if (line.startsWith('|') && !line.startsWith('|}') && !line.startsWith('|-')) {
        cells.push(line.slice(1).trim());
      } else if (cells.length > 0 && !line.startsWith('!')) {
        cells[cells.length - 1] += ` ${line.trim()}`; // continuation of a cell
      }
    }
    rows.push({ name: nameLine.replace(/^![^|]*\|/, '').trim(), cells, raw: chunk });
  }
  return rows;
}

/** The first table in the page, which lists the sites that are endangered today. */
export function currentTable(wikitext) {
  const start = wikitext.indexOf('{|');
  const end = wikitext.indexOf('\n|}', start);
  if (start < 0 || end < 0) throw new Error('Could not find the current-list table');
  return wikitext.slice(start, end);
}

/** UNESCO's numeric ID, taken from the whc.unesco.org/en/list/NNN reference in a row. */
export function unescoIdFromRow(raw) {
  return raw.match(/whc\.unesco\.org\/en\/list\/(\d+)/)?.[1] ?? null;
}

/** Lower-case, accent-free, punctuation-free form of a name, for matching across sources. */
export function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Turns the page into { [unescoId]: { since, reason } } for sites endangered today.
 *
 * Cells are recognised by content, not position: Wikipedia omits a cell when the row
 * above spans it, so "years endangered" and the reason are carried forward when absent.
 * `idByName` (normalised UNESCO name to ID) rescues rows with no UNESCO link.
 */
export function parseDangerList(wikitext, idByName = new Map()) {
  const sites = {};
  const unmatched = [];
  let lastYears = null;
  let lastReason = '';

  for (const row of parseTable(currentTable(wikitext))) {
    const criteriaAt = row.cells.findIndex((cell) =>
      /^(cultural|natural|mixed)\b/i.test(cleanWikitext(cell)),
    );
    if (criteriaAt < 0) continue;

    const before = row.cells.slice(0, criteriaAt); // image, location, year listed, years endangered
    const yearsCell = before.length >= 4 ? before[3] : null;
    const since = yearsCell ? sinceYear(yearsCell) : lastYears;
    if (yearsCell) lastYears = since;

    const reasonCell = row.cells[criteriaAt + 1];
    const reason = reasonCell === undefined ? lastReason : cleanWikitext(reasonCell);
    if (reasonCell !== undefined) lastReason = reason;

    if (!since) continue;
    const name = cleanWikitext(row.name);
    const id = unescoIdFromRow(row.raw) ?? idByName.get(normalizeName(name)) ?? null;
    if (!id) {
      unmatched.push(name);
      continue;
    }
    sites[id] = reason ? { since, reason } : { since };
  }
  return { sites, unmatched };
}
