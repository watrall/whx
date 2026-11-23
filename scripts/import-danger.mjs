/**
 * Imports the reason and start year for each site on the List of World Heritage
 * in Danger from Wikipedia's "List of World Heritage in Danger" page.
 *
 * UNESCO's own export only says whether a site is in danger. This adds why.
 * The text is Wikipedia's, under CC BY-SA 4.0, and the card credits it.
 *
 * Usage: node scripts/import-danger.mjs
 * Requires data/unesco.json (run scripts/import-unesco.mjs first) to match
 * sites by name when a row has no UNESCO link.
 *
 * Set WIKI_USER_AGENT to identify yourself to Wikimedia, as their policy asks
 * (a project name and contact address).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { normalizeName, parseDangerList } from './danger-parse.mjs';

const PAGE = 'List_of_World_Heritage_in_Danger';
const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = process.env.WIKI_USER_AGENT ?? 'danger-list-import/1.0';

const params = new URLSearchParams({
  action: 'parse',
  page: PAGE,
  prop: 'wikitext|revid',
  format: 'json',
  formatversion: '2',
});
const response = await fetch(`${API}?${params}`, { headers: { 'User-Agent': USER_AGENT } });
if (!response.ok) {
  console.error(`Wikipedia request failed (${response.status})`);
  process.exit(1);
}
const payload = await response.json();
const wikitext = payload?.parse?.wikitext;
const revid = payload?.parse?.revid;
if (typeof wikitext !== 'string') {
  console.error('Unexpected response from Wikipedia');
  process.exit(1);
}

const unesco = JSON.parse(await readFile('data/unesco.json', 'utf8')).sites;
const idByName = new Map(Object.entries(unesco).map(([id, site]) => [normalizeName(site.name), id]));

const { sites, unmatched } = parseDangerList(wikitext, idByName);
if (Object.keys(sites).length < 30) {
  console.error('Parsed suspiciously few sites; the page layout may have changed. Not writing.');
  process.exit(1);
}

const attribution = {
  holder: 'Wikipedia contributors',
  page: 'List of World Heritage in Danger',
  source: `https://en.wikipedia.org/wiki/${PAGE}`,
  revision: revid,
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  retrieved: new Date().toISOString().slice(0, 10),
};
await writeFile('data/danger.json', JSON.stringify({ attribution, sites }) + '\n');

const flagged = Object.entries(unesco)
  .filter(([, site]) => site.danger)
  .map(([id]) => id);
const missing = flagged.filter((id) => !sites[id]);
const extra = Object.keys(sites).filter((id) => !unesco[id]?.danger);
console.log(`Wrote ${Object.keys(sites).length} entries from revision ${revid}`);
console.log(`With a reason: ${Object.values(sites).filter((site) => site.reason).length}`);
if (unmatched.length) console.warn(`Could not match to a UNESCO ID: ${unmatched.join('; ')}`);
if (missing.length) {
  console.warn(
    `Flagged in danger by UNESCO but not in Wikipedia's list: ${missing.map((id) => unesco[id].name).join('; ')}`,
  );
}
if (extra.length) {
  console.warn(
    `In Wikipedia's list but not flagged by UNESCO (ignored by the app): ${extra.map((id) => unesco[id]?.name ?? id).join('; ')}`,
  );
}
