import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGalleryLeads,
  applyPhotoOverrides,
  buildPhotos,
  commonsFileUrl,
  normalizeCommonsImage,
  unescoNumber,
} from '../scripts/photos.mjs';

const binding = (qid, unescoId, image) => ({
  item: { value: `http://www.wikidata.org/entity/${qid}` },
  unescoId: { value: unescoId },
  ...(image ? { image: { value: image } } : {}),
});
const img = (name) => `http://commons.wikimedia.org/wiki/Special:FilePath/${name}`;

test('normalizeCommonsImage upgrades to https and drops size parameters', () => {
  assert.equal(
    normalizeCommonsImage('http://commons.wikimedia.org/wiki/Special:FilePath/A%20b.jpg?width=900'),
    'https://commons.wikimedia.org/wiki/Special:FilePath/A%20b.jpg',
  );
});

test('normalizeCommonsImage rejects other hosts and non-strings', () => {
  assert.equal(normalizeCommonsImage('https://evil.example/wiki/Special:FilePath/a.jpg'), null);
  assert.equal(normalizeCommonsImage('https://commons.wikimedia.org/other/a.jpg'), null);
  assert.equal(normalizeCommonsImage(undefined), null);
});

test('unescoNumber reads the leading digits', () => {
  assert.equal(unescoNumber('710bis'), '710');
  assert.equal(unescoNumber('669bis-007'), '669');
  assert.equal(unescoNumber('abc'), null);
});

test('the property itself wins over its components for the item and the photo', () => {
  const photos = buildPhotos([
    binding('Q2', '669bis-007', img('Lugo.jpg')),
    binding('Q1', '669bis', img('Camino.jpg')),
  ]);
  assert.deepEqual(photos['669'], { qid: 'Q1', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Camino.jpg' });
});

test('a component photo is used when the property has none, but the item stays the property', () => {
  const photos = buildPhotos([binding('Q1', '669bis'), binding('Q2', '669bis-007', img('Lugo.jpg'))]);
  assert.equal(photos['669'].qid, 'Q1');
  assert.match(photos['669'].image, /Lugo\.jpg$/);
});

test('a plain number outranks an extension suffix', () => {
  const photos = buildPhotos([binding('Q9', '710bis', img('B.jpg')), binding('Q8', '710', img('A.jpg'))]);
  assert.equal(photos['710'].qid, 'Q8');
});

test('records without a UNESCO number are skipped', () => {
  assert.deepEqual(buildPhotos([{ item: { value: 'x/Q1' } }]), {});
});

test('applyPhotoOverrides swaps the image and keeps the Wikidata item', () => {
  const photos = { 1325: { qid: 'Q863815', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Render.jpg' } };
  const result = applyPhotoOverrides(photos, { 1325: 'Phoenix Islands Protected Area-114879.jpg' });
  assert.deepEqual(result[1325], {
    qid: 'Q863815',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Phoenix%20Islands%20Protected%20Area-114879.jpg',
  });
  assert.equal(photos[1325].image.endsWith('Render.jpg'), true);
});

test('applyPhotoOverrides ignores unknown sites and missing overrides', () => {
  const photos = { 1: { qid: 'Q1' } };
  assert.deepEqual(applyPhotoOverrides(photos, { 999: 'A.jpg' }), photos);
  assert.deepEqual(applyPhotoOverrides(photos, undefined), photos);
});

test('applyGalleryLeads leads with the first extra where the main photo is poor or missing', () => {
  const photos = {
    1: { qid: 'Q1', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Map.png' },
    2: { qid: 'Q2' },
    3: { qid: 'Q3', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fine.jpg' },
  };
  const gallery = {
    extras: { 1: ['Better one.jpg'], 2: ['Only.jpg'], 3: ['Extra.jpg'] },
    demoted: { 1: 'Map.png' },
  };
  const result = applyGalleryLeads(photos, gallery);
  assert.match(result[1].image, /Better%20one\.jpg$/);
  assert.match(result[2].image, /Only\.jpg$/);
  assert.equal(result[3].image, photos[3].image);
  assert.equal(applyGalleryLeads(photos, null)[1].image, photos[1].image);
});

test('commonsFileUrl encodes a file name into a FilePath URL', () => {
  assert.equal(
    commonsFileUrl('Phoenix Islands (1).jpg'),
    'https://commons.wikimedia.org/wiki/Special:FilePath/Phoenix%20Islands%20(1).jpg',
  );
});
