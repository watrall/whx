import test from 'node:test';
import assert from 'node:assert/strict';
import {
  playbackHold,
  playbackPool,
  rangeAfterYearClick,
  staggerBatches,
  staggerWindow,
} from '../app/src/lib/timeline.ts';

const domain = [1978, 2026];

test('clicking a year selects just that year', () => {
  assert.deepEqual(rangeAfterYearClick(1990, [1978, 2026], domain, true), [1990, 1990]);
});

test('clicking replaces a narrower range too', () => {
  assert.deepEqual(rangeAfterYearClick(2001, [1985, 1995], domain, true), [2001, 2001]);
});

test('clicking the only selected year clears back to the full range', () => {
  assert.deepEqual(rangeAfterYearClick(1990, [1990, 1990], domain, true), [1978, 2026]);
});

test('a year with no inscriptions leaves the range alone', () => {
  assert.deepEqual(rangeAfterYearClick(1979, [1985, 1995], domain, false), [1985, 1995]);
});

test('stagger window grows with the batch but stays within bounds', () => {
  assert.equal(staggerWindow(0), 0);
  assert.equal(staggerWindow(1), 150);
  assert.equal(staggerWindow(30), 300);
  assert.equal(staggerWindow(67), 600);
});

test('playback rests on a year for its stagger window plus a pause', () => {
  assert.equal(playbackHold(0), 300);
  assert.equal(playbackHold(30), 600);
});

test('stagger batches add up to the count and never exceed eight steps', () => {
  for (const count of [0, 1, 3, 4, 9, 30, 67, 150]) {
    const sizes = staggerBatches(count);
    assert.equal(sizes.reduce((sum, size) => sum + size, 0), count);
    assert.ok(sizes.length <= 8);
    assert.ok(sizes.every((size) => size > 0));
  }
});

test('playback pool holds dated sites from the start year and undated ones with the last year', () => {
  const sites = [
    { id: 'a', year: 1978 },
    { id: 'b', year: 1990 },
    { id: 'c', year: null },
  ];
  assert.deepEqual(
    playbackPool(sites, 1978, [1978, 2026]).map((entry) => [entry.site.id, entry.at]),
    [['a', 1978], ['b', 1990], ['c', 2026]],
  );
  // Starting later leaves out earlier years, and undated sites are not part of a partial range.
  assert.deepEqual(
    playbackPool(sites, 1985, [1978, 2026]).map((entry) => entry.site.id),
    ['b'],
  );
});
