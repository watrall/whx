import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeAfterYearClick } from '../app/src/lib/timeline.ts';

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
