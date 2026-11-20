/**
 * Imports the official UNESCO World Heritage Centre XML export into two small
 * JSON files the app loads:
 *
 *   data/unesco.json       facts: every country, inscription year, in-danger flag
 *   data/unesco-text.json  UNESCO's short description for each site, as paragraphs
 *
 * Usage: node scripts/import-unesco.mjs path/to/heritage.xml
 *
 * Download the English XML from https://whc.unesco.org/en/syndication/ . The
 * source file is not stored in the repo. Descriptions are published by UNESCO
 * under CC BY-SA 3.0 IGO; see the attribution block written into the output.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { htmlToParagraphs, parseRows, splitStates } from './unesco-parse.mjs';

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

const unknownEntities = new Set();
const facts = {};
const text = {};

for (const row of rows) {
  const id = row.id_number?.trim();
  if (!id || !/^\d+$/.test(id)) continue;

  const year = Number.parseInt(row.date_inscribed ?? '', 10);
  facts[id] = {
    countries: splitStates(row.states),
    year: Number.isFinite(year) ? year : null,
    // On the List of World Heritage in Danger.
    danger: row.danger?.trim() === '1',
  };

  const paragraphs = htmlToParagraphs(row.short_description ?? '', (name) => unknownEntities.add(name));
  if (paragraphs.length > 0) text[id] = paragraphs;
}

const attribution = {
  holder: 'UNESCO/World Heritage Centre',
  source: 'https://whc.unesco.org/en/list/',
  license: 'CC BY-SA 3.0 IGO',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/igo/',
  note: 'Formatting simplified; wording unchanged.',
};

await writeFile('data/unesco.json', JSON.stringify({ attribution, sites: facts }) + '\n');
await writeFile('data/unesco-text.json', JSON.stringify({ attribution, text }) + '\n');

console.log(`Read ${rows.length} rows`);
console.log(`Wrote ${Object.keys(facts).length} fact records and ${Object.keys(text).length} descriptions`);
if (unknownEntities.size > 0) {
  console.warn(`Unhandled HTML entities (left as-is): ${[...unknownEntities].join(', ')}`);
}
