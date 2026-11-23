import test from 'node:test';
import assert from 'node:assert/strict';
import { sortSites } from '../app/src/lib/sortSites.ts';

const site = (id, name, country, year, lat = 0, lon = 0) => ({ id, name, country, year, lat, lon });
const sites = [
  site('1', 'Beta', 'Peru', 2001, 0, 50),
  site('2', 'Alpha', 'Italy', null, 0, 10),
  site('3', 'Gamma', 'Italy', 1990, 0, 30),
];

test('sorts by name', () => {
  assert.deepEqual(
    sortSites(sites, 'name', null).map((s) => s.id),
    ['2', '1', '3'],
  );
});

test('sorts by year with undated sites last', () => {
  assert.deepEqual(
    sortSites(sites, 'year', null).map((s) => s.id),
    ['3', '1', '2'],
  );
});

test('sorts by country then name', () => {
  assert.deepEqual(
    sortSites(sites, 'country', null).map((s) => s.id),
    ['2', '3', '1'],
  );
});

test('sorts by distance from an origin, and falls back to name without one', () => {
  assert.deepEqual(
    sortSites(sites, 'distance', { lat: 0, lon: 0 }).map((s) => s.id),
    ['2', '3', '1'],
  );
  assert.deepEqual(
    sortSites(sites, 'distance', null).map((s) => s.id),
    ['2', '1', '3'],
  );
});

test('does not change the input', () => {
  const before = sites.map((s) => s.id);
  sortSites(sites, 'year', null);
  assert.deepEqual(
    sites.map((s) => s.id),
    before,
  );
});
