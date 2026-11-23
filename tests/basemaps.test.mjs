import test from 'node:test';
import assert from 'node:assert/strict';
import { createBasemaps } from '../app/src/lib/basemaps.ts';

test('Atlas is always on offer and needs no key', () => {
  const basemaps = createBasemaps({});
  assert.deepEqual(
    basemaps.map((basemap) => basemap.id),
    ['atlas'],
  );
});

test('keyed styles appear only when their key is set', () => {
  assert.deepEqual(
    createBasemaps({ cartoKey: 'k' }).map((basemap) => basemap.id),
    ['atlas', 'streets'],
  );
  assert.deepEqual(
    createBasemaps({ arcgisToken: 't' }).map((basemap) => basemap.id),
    ['atlas', 'satellite'],
  );
  assert.deepEqual(
    createBasemaps({ cartoKey: 'k', arcgisToken: 't' }).map((basemap) => basemap.id),
    ['atlas', 'streets', 'satellite'],
  );
});

test('every style has a tile template, credits and a unique id', () => {
  const basemaps = createBasemaps({ cartoKey: 'k', arcgisToken: 't' });
  assert.equal(new Set(basemaps.map((basemap) => basemap.id)).size, basemaps.length);
  for (const basemap of basemaps) {
    for (const part of ['{z}', '{x}', '{y}']) assert.ok(basemap.url.includes(part), `${basemap.id} ${part}`);
    assert.ok(basemap.credits.length > 0, basemap.id);
  }
});

test('keys go into the tile URL, encoded', () => {
  const basemaps = createBasemaps({ cartoKey: 'a b&c', arcgisToken: 'x/y' });
  assert.ok(basemaps.find((basemap) => basemap.id === 'streets').url.endsWith('?key=a%20b%26c'));
  assert.ok(basemaps.find((basemap) => basemap.id === 'satellite').url.endsWith('?token=x%2Fy'));
});

test('streets credit OpenStreetMap and CARTO', () => {
  const streets = createBasemaps({ cartoKey: 'k' }).find((basemap) => basemap.id === 'streets');
  const text = streets.credits.map((credit) => credit.text).join(' ');
  assert.match(text, /OpenStreetMap/);
  assert.match(text, /CARTO/);
});

test('every style has a preview picture drawn from its own tiles', async () => {
  const { thumbnailUrl } = await import('../app/src/lib/basemaps.ts');
  for (const basemap of createBasemaps({ cartoKey: 'k', arcgisToken: 't' })) {
    const url = thumbnailUrl(basemap);
    assert.ok(!/[{}]/.test(url), `${basemap.id} still has a placeholder`);
  }
});
