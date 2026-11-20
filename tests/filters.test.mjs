import test from 'node:test';
import assert from 'node:assert/strict';
import { NO_EXTRA, hasExtraFilters, matchesExtra, shareListUrl } from '../app/src/lib/filters.ts';
import { buildUrlHash, parseUrlState } from '../app/src/lib/urlState.ts';

const site = (id, danger = false) => ({ id, danger });

test('no extra filters matches everything', () => {
  assert.equal(hasExtraFilters(NO_EXTRA), false);
  assert.equal(matchesExtra(site('Q1'), NO_EXTRA, new Set()), true);
});

test('danger filter keeps only sites in danger', () => {
  const f = { ...NO_EXTRA, danger: true };
  assert.equal(matchesExtra(site('Q1', true), f, new Set()), true);
  assert.equal(matchesExtra(site('Q2', false), f, new Set()), false);
});

test('saved filter keeps only saved sites', () => {
  const f = { ...NO_EXTRA, savedOnly: true };
  assert.equal(matchesExtra(site('Q1'), f, new Set(['Q1'])), true);
  assert.equal(matchesExtra(site('Q2'), f, new Set(['Q1'])), false);
});

test('a shared list keeps only listed sites and combines with danger', () => {
  const f = { ...NO_EXTRA, listIds: new Set(['Q1', 'Q2']), danger: true };
  assert.equal(matchesExtra(site('Q1', true), f, new Set()), true);
  assert.equal(matchesExtra(site('Q1', false), f, new Set()), false);
  assert.equal(matchesExtra(site('Q3', true), f, new Set()), false);
});

test('shareListUrl sorts ids numerically', () => {
  assert.equal(
    shareListUrl(['Q20', 'Q3', 'Q100'], 'https://x.test/app/'),
    'https://x.test/app/#list=Q3,Q20,Q100',
  );
});

test('url state round-trips danger and a shared list', () => {
  const hash = buildUrlHash({
    site: null,
    query: '',
    types: new Set(),
    years: [1978, 2026],
    domain: [1978, 2026],
    danger: true,
    list: new Set(['Q5', 'Q9']),
  });
  assert.equal(hash, '#danger=1&list=Q5%2CQ9');
  const parsed = parseUrlState(hash);
  assert.equal(parsed.danger, true);
  assert.deepEqual(parsed.list, ['Q5', 'Q9']);
});

test('url state ignores malformed list ids', () => {
  const parsed = parseUrlState('#list=Q1,evil,Q2<script>,Q3');
  assert.deepEqual(parsed.list, ['Q1', 'Q3']);
});
