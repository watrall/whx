import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readJson, writeJson } from '../scripts/io.mjs';

test('readJson returns the fallback for a missing file and throws for bad JSON', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'whx-io-'));
  try {
    assert.deepEqual(await readJson(join(dir, 'none.json'), { empty: true }), { empty: true });
    assert.equal(await readJson(join(dir, 'none.json')), null);
    await writeFile(join(dir, 'bad.json'), '{not json');
    await assert.rejects(readJson(join(dir, 'bad.json')));
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('writeJson writes complete JSON with a trailing newline and leaves no temporary file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'whx-io-'));
  try {
    const path = join(dir, 'data.json');
    await writeJson(path, { a: [1, 2] });
    assert.equal(await readFile(path, 'utf8'), '{"a":[1,2]}\n');
    await writeJson(path, { b: 1 });
    assert.deepEqual(await readJson(path), { b: 1 });
    assert.deepEqual(await readdir(dir), ['data.json']);
  } finally {
    await rm(dir, { recursive: true });
  }
});
