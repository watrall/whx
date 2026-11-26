import test from 'node:test';
import assert from 'node:assert/strict';
import { pickPreviews } from '../app/src/lib/previewPicks.ts';

const sites = Array.from({ length: 40 }, (_, index) => ({
  id: String(index),
  image: index % 4 === 0 ? null : `https://example.test/${index}.jpg`,
}));

test('only sites with a photo are picked', () => {
  const picks = pickPreviews(sites, 1, 12);
  assert.equal(picks.length, 12);
  assert.ok(picks.every((site) => site.image));
});

test('the same seed gives the same picks, in the same order', () => {
  const ids = (seed) => pickPreviews(sites, seed, 12).map((site) => site.id);
  assert.deepEqual(ids(7), ids(7));
});

test('different seeds give different picks', () => {
  const ids = (seed) =>
    pickPreviews(sites, seed, 12)
      .map((site) => site.id)
      .join(',');
  assert.notEqual(ids(1), ids(2));
});

test('fewer photos than the count gives what there is, and none gives nothing', () => {
  assert.equal(pickPreviews(sites.slice(0, 3), 1, 12).length, 2);
  assert.deepEqual(pickPreviews([{ id: 'a', image: null }], 1, 12), []);
});
