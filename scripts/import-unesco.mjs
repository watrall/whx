/**
 * Builds the app's list of World Heritage Sites from the official UNESCO World Heritage
 * Centre XML export. UNESCO's file is the backbone: every site, its official name, every
 * country, year, category, criteria, danger flag, description and coordinates come from it.
 *
 *   data/unesco.json        one record per site
 *   data/unesco-text.json   UNESCO's short description for each site, as paragraphs
 *   data/unesco-parts.json  the component points of serial sites (two or more places)
 *
 * Usage: node scripts/import-unesco.mjs path/to/heritage.xml
 *
 * Download the English XML from https://whc.unesco.org/en/syndication/ . The source file
 * is not stored in the repo. Descriptions are published by UNESCO under CC BY-SA 3.0 IGO;
 * see the attribution block written into the output.
 *
 * A site's pin is the component nearest the middle of its parts. Three sites lack
 * coordinates in the export: two are filled from Wikidata (data/sites.json, if present)
 * and one has an approximate point below.
 */
import { readFile, writeFile } from 'node:fs/promises';
import {
  categoryToType,
  htmlToParagraphs,
  htmlToText,
  medoid,
  parseCriteriaCodes,
  parsePois,
  parseRows,
  round4,
  splitStates,
} from './unesco-parse.mjs';

/**
 * Approximate points for sites with no coordinates in UNESCO's export or in Wikidata.
 * 1567: Funerary and memory sites of the First World War (Western Front), 139 places
 * across northern France and Belgium; this is a point in the middle of that area.
 */
const MANUAL_COORDINATES = { 1567: [50.55, 2.9] };

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/import-unesco.mjs path/to/heritage.xml');
  process.exit(1);
}

const xml = await readFile(input, 'utf8');
const rows = parseRows(xml);
if (rows.length === 0) {
  console.error('No <row> records found. Is this the WHC XML export?');
  process.exit(1);
}

/** Wikidata coordinates by UNESCO number, used only where UNESCO's export has none. */
async function wikidataCoordinates() {
  const found = new Map();
  try {
    const data = JSON.parse(await readFile('data/sites.json', 'utf8'));
    for (const binding of data.results.bindings) {
      const number = binding.unescoId?.value?.match(/^\d+/)?.[0];
      const point = binding.coordinate?.value?.match(/^Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/);
      if (number && point && !found.has(number)) found.set(number, [Number(point[2]), Number(point[1])]);
    }
  } catch {
    // No Wikidata file: the manual list below is the only fallback.
  }
  return found;
}
const fallback = await wikidataCoordinates();

const unknownEntities = new Set();
const onUnknown = (name) => unknownEntities.add(name);
const sites = {};
const text = {};
const parts = {};
const unplaced = [];
const filled = [];

for (const row of rows) {
  const id = row.id_number?.trim();
  if (!id || !/^\d+$/.test(id)) continue;

  const points = parsePois(row.geolocations);
  let pin = medoid(points);
  if (!pin) {
    pin = fallback.get(id) ?? MANUAL_COORDINATES[id] ?? null;
    if (pin) filled.push(id);
  }
  const name = htmlToText(row.site ?? '', onUnknown);
  if (!pin) {
    unplaced.push(`${id} ${name}`);
    continue;
  }

  const year = Number.parseInt(row.date_inscribed ?? '', 10);
  const record = {
    name,
    countries: splitStates(row.states),
    year: Number.isFinite(year) ? year : null,
    type: categoryToType(row.category),
    criteria: parseCriteriaCodes(row.criteria_txt),
    danger: row.danger?.trim() === '1', // on the List of World Heritage in Danger
    lat: round4(pin[0]),
    lon: round4(pin[1]),
  };
  if (points.length > 1) {
    record.parts = points.length;
    parts[id] = points.map(([lat, lon]) => [round4(lat), round4(lon)]);
  }
  sites[id] = record;

  const paragraphs = htmlToParagraphs(row.short_description ?? '', onUnknown);
  if (paragraphs.length > 0) text[id] = paragraphs;
}

const attribution = {
  holder: 'UNESCO/World Heritage Centre',
  source: 'https://whc.unesco.org/en/list/',
  license: 'CC BY-SA 3.0 IGO',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/igo/',
  note: 'Formatting simplified; wording unchanged.',
};

await writeFile('data/unesco.json', JSON.stringify({ attribution, sites }) + '\n');
await writeFile('data/unesco-text.json', JSON.stringify({ attribution, text }) + '\n');
await writeFile('data/unesco-parts.json', JSON.stringify({ parts }) + '\n');

console.log(`Read ${rows.length} rows`);
console.log(
  `Wrote ${Object.keys(sites).length} sites, ${Object.keys(text).length} descriptions, ${Object.keys(parts).length} serial sites with parts`,
);
if (filled.length) console.log(`Coordinates filled from a fallback for: ${filled.join(', ')}`);
if (unplaced.length) console.warn(`No coordinates, left out: ${unplaced.join('; ')}`);
if (unknownEntities.size > 0) {
  console.warn(`Unhandled HTML entities (left as-is): ${[...unknownEntities].join(', ')}`);
}
