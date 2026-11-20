import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, toCsv, toGeoJson } from '../app/src/lib/export.ts';

const site = {
  id: 'Q1',
  name: 'Old Town, "Core" Zone',
  countries: ['Italy', 'France'],
  year: 1990,
  type: 'cultural',
  criteriaCodes: ['ii', 'iv'],
  danger: true,
  lat: 41.9,
  lon: 12.5,
  unescoId: '158',
  officialUrl: null,
};

test('csvCell quotes commas, quotes and newlines', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line\nbreak'), '"line\nbreak"');
  assert.equal(csvCell(null), '');
});

test('csvCell neutralises spreadsheet formulas', () => {
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell('+1'), "'+1");
  assert.equal(csvCell('@cmd'), "'@cmd");
  assert.equal(csvCell('-5'), "'-5");
});

test('toCsv writes a header, a BOM and one row per site', () => {
  const csv = toCsv([site]);
  assert.ok(csv.startsWith('﻿unesco_id,name,countries,'));
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 2);
  assert.equal(
    lines[1],
    '158,"Old Town, ""Core"" Zone",Italy; France,1990,Cultural,ii; iv,yes,41.9,12.5,https://whc.unesco.org/en/list/158/,Q1',
  );
});

test('toGeoJson puts longitude first and keeps properties', () => {
  const geo = JSON.parse(toGeoJson([site]));
  assert.equal(geo.type, 'FeatureCollection');
  assert.deepEqual(geo.features[0].geometry.coordinates, [12.5, 41.9]);
  assert.equal(geo.features[0].properties.in_danger, true);
  assert.deepEqual(geo.features[0].properties.countries, ['Italy', 'France']);
});
