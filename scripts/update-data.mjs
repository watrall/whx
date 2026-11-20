#!/usr/bin/env node
/**
 * Refreshes data/sites.json from Wikidata, then rebuilds data/photos.json from it.
 *
 * The SPARQL query is read from scripts.js so there is a single source of
 * truth. Run manually with `node scripts/update-data.mjs`; the GitHub Action
 * runs it daily.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writePhotos } from './build-photos.mjs';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const SOURCE = 'scripts.js';
const OUTPUT = 'data/sites.json';
const USER_AGENT = 'WikidataWorldHeritageExplorer/1.0 (data update; https://github.com/watrall/wikidata-world-heritage)';
const REQUEST_TIMEOUT_MS = 60000;

async function main() {
  const source = await readFile(SOURCE, 'utf8');
  const match = source.match(/const UNESCO_SITES_QUERY = `([\s\S]*?)`;/);
  if (!match) {
    throw new Error(`Could not find UNESCO_SITES_QUERY in ${SOURCE}`);
  }
  const query = match[1];

  const params = new URLSearchParams({ query, format: 'json' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
        'User-Agent': USER_AGENT,
      },
      body: params.toString(),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WDQS returned ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const bindings = data?.results?.bindings;
  if (!Array.isArray(bindings) || bindings.length === 0) {
    throw new Error('WDQS returned no bindings');
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(data), 'utf8');
  console.log(`Wrote ${bindings.length} bindings to ${OUTPUT}`);
  await writePhotos(OUTPUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
