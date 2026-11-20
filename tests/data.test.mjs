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
