#!/usr/bin/env node
/**
 * Refreshes data/sites.json from Wikidata, then rebuilds data/photos.json from it.
 *
 * The SPARQL query lives in scripts/sites-query.mjs. Run manually with
 * `node scripts/update-data.mjs`; the GitHub Action runs it daily.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writePhotos } from './build-photos.mjs';
import { UNESCO_SITES_QUERY } from './sites-query.mjs';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const OUTPUT = 'data/sites.json';
const USER_AGENT = 'WHX/1.0 (data update; https://github.com/watrall/whx)';
const REQUEST_TIMEOUT_MS = 60000;

async function main() {
  const query = UNESCO_SITES_QUERY;

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
