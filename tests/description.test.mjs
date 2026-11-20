import test from 'node:test';
import assert from 'node:assert/strict';
import { countryLabel, directionsUrl, isUsableDescription, unescoUrl } from '../app/src/lib/utils.ts';

test('boilerplate Wikidata descriptions are rejected', () => {
  assert.equal(isUsableDescription('World Heritage site in Iran and Azerbaijan', 'Hyrcanian Forests'), false);
  assert.equal(isUsableDescription('UNESCO World Heritage Site in Italy, a very long boilerplate line', 'X'), false);
  assert.equal(isUsableDescription('national park', 'Serengeti'), false);
});

test('a description that repeats the name is rejected', () => {
  const name = 'The Historic Centre of a Rather Long Named Place in Europe';
  assert.equal(isUsableDescription(name.toLowerCase(), name), false);
});

test('a real description passes', () => {
  assert.equal(
    isUsableDescription('area of subtropical rainforest in eastern Australia with rare species', 'Gondwana'),
    true,
  );
});

test('countryLabel shortens long serial lists', () => {
  assert.equal(countryLabel({ countries: ['Canada'], country: 'Canada' }), 'Canada');
  assert.equal(countryLabel({ countries: ['A', 'B'], country: 'A' }), 'A & B');
  assert.equal(countryLabel({ countries: ['A', 'B', 'C', 'D'], country: 'A' }), 'A +3 more');
  assert.equal(countryLabel({ countries: [], country: 'Peru' }), 'Peru');
});

test('canonical UNESCO URLs use the numeric id with a trailing slash', () => {
  assert.equal(unescoUrl({ unescoId: '158', officialUrl: null }), 'https://whc.unesco.org/en/list/158/');
  assert.equal(unescoUrl({ unescoId: '710bis', officialUrl: null }), 'https://whc.unesco.org/en/list/710/');
  assert.equal(unescoUrl({ unescoId: null, officialUrl: 'https://example.org/x' }), 'https://example.org/x');
});

test('directions link to the right maps app for the platform', () => {
  const site = { lat: 41.9, lon: 12.45, name: 'Vatican City' };
  assert.equal(directionsUrl(site, false), 'https://www.google.com/maps/dir/?api=1&destination=41.9,12.45');
  assert.equal(directionsUrl(site, true), 'https://maps.apple.com/?daddr=41.9,12.45&q=Vatican%20City');
});
