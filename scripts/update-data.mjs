#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writePhotos } from './build-photos.mjs';
import { queryWikidata, writeJson } from './io.mjs';
import { UNESCO_SITES_QUERY } from './sites-query.mjs';

const OUTPUT = 'data/sites.json';

async function main() {
  const data = await queryWikidata(UNESCO_SITES_QUERY);
  const bindings = data?.results?.bindings;
  if (!Array.isArray(bindings) || bindings.length === 0) {
    throw new Error('WDQS returned no bindings');
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeJson(OUTPUT, data);
  console.log(`Wrote ${bindings.length} bindings to ${OUTPUT}`);
  await writePhotos(OUTPUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
