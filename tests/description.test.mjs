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

import { distanceKm, formatDistance, nearestSites } from '../app/src/lib/geo.ts';

test('distanceKm matches a known city pair', () => {
  // Paris to London is about 344 km.
  const km = distanceKm({ lat: 48.8566, lon: 2.3522 }, { lat: 51.5074, lon: -0.1278 });
  assert.ok(km > 340 && km < 348, `got ${km}`);
  assert.equal(distanceKm({ lat: 10, lon: 10 }, { lat: 10, lon: 10 }), 0);
});

test('nearestSites excludes the origin and sorts by distance', () => {
  const mk = (id, lat, lon) => ({ id, lat, lon });
  const out = nearestSites(mk('a', 0, 0), [mk('a', 0, 0), mk('far', 0, 50), mk('near', 0, 1), mk('mid', 0, 10)], 2);
  assert.deepEqual(out.map((x) => x.site.id), ['near', 'mid']);
});

test('formatDistance picks sensible precision and units', () => {
  assert.equal(formatDistance(0.4, false), '<1 km');
  assert.equal(formatDistance(4.26, false), '4.3 km');
  assert.equal(formatDistance(1234, false), '1,234 km');
  assert.equal(formatDistance(100, true), '62 mi');
});

import { NEARBY_KM, nearbyOrNearest } from '../app/src/lib/geo.ts';

test('nearbyOrNearest keeps only sites within day-trip distance', () => {
  const mk = (id, lon) => ({ id, lat: 0, lon });
  // 1 degree of longitude at the equator is about 111 km.
  const out = nearbyOrNearest(mk('a', 0), [mk('a', 0), mk('close', 1), mk('mid', 2), mk('far', 40)], 3);
  assert.equal(out.mode, 'nearby');
  assert.deepEqual(out.items.map((x) => x.site.id), ['close', 'mid']);
  assert.ok(out.items.every((x) => x.km <= NEARBY_KM));
});

test('nearbyOrNearest falls back to the nearest sites when none are close', () => {
  const mk = (id, lon) => ({ id, lat: 0, lon });
  const out = nearbyOrNearest(mk('island', 0), [mk('island', 0), mk('x', 30), mk('y', 60), mk('z', 90), mk('w', 120)], 3);
  assert.equal(out.mode, 'nearest');
  assert.deepEqual(out.items.map((x) => x.site.id), ['x', 'y', 'z']);
});
