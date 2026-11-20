import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_INSCRIPTION_YEAR, resolveYear } from '../app/src/lib/data.ts';

test('years before the first inscriptions are treated as missing', () => {
  assert.equal(resolveYear('Q1', '1960'), null);
  assert.equal(resolveYear('Q1', String(FIRST_INSCRIPTION_YEAR - 1)), null);
});

test('valid years pass through', () => {
  assert.equal(resolveYear('Q1', '1978'), 1978);
  assert.equal(resolveYear('Q1', '2019'), 2019);
});

test('missing or malformed years stay null', () => {
  assert.equal(resolveYear('Q1', undefined), null);
  assert.equal(resolveYear('Q1', 'abc'), null);
});

test('Serengeti is corrected to 1981 whatever Wikidata says', () => {
  assert.equal(resolveYear('Q11812902', '1960'), 1981);
  assert.equal(resolveYear('Q11812902', undefined), 1981);
});

import { applyUnescoFacts, unescoNumber } from '../app/src/lib/unesco.ts';

const baseSite = {
  id: 'Q1',
  name: 'banks of the Seine',
  altName: '',
  country: 'France',
  countries: ['France'],
  countryAlias: '',
  year: 1960,
  danger: false,
  unescoId: '600bis',
};

test('UNESCO facts replace name, countries, year and danger, keeping Wikidata aliases', () => {
  const [site] = applyUnescoFacts([baseSite], {
    600: { name: 'Paris, Banks of the Seine', countries: ['France'], year: 1991, danger: true },
  });
  assert.equal(site.name, 'Paris, Banks of the Seine');
  assert.equal(site.altName, 'banks of the Seine');
  assert.equal(site.year, 1991);
  assert.equal(site.danger, true);
});

test('sites missing from the UNESCO file are left untouched', () => {
  const [site] = applyUnescoFacts([{ ...baseSite, unescoId: '999999' }], {});
  assert.equal(site.name, 'banks of the Seine');
  assert.equal(site.year, 1960);
});

test('unescoNumber strips extension suffixes', () => {
  assert.equal(unescoNumber('710bis'), '710');
  assert.equal(unescoNumber('1133quinquies'), '1133');
  assert.equal(unescoNumber(null), null);
});
