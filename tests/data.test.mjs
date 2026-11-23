import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGallery, buildSites } from '../app/src/lib/data.ts';
import { canonicalIds, findSite } from '../app/src/lib/ids.ts';
import { countryAliases } from '../app/src/lib/countryAliases.ts';

const unesco = {
  sites: {
    20: {
      name: 'Ancient City of Damascus',
      countries: ['Syrian Arab Republic'],
      year: 1979,
      type: 'cultural',
      criteria: ['i', 'ii', 'iii', 'iv', 'vi'],
      danger: true,
      lat: 33.5108,
      lon: 36.3097,
    },
    1133: {
      name: 'Ancient and Primeval Beech Forests',
      countries: ['Albania', 'Austria'],
      year: 2007,
      type: 'natural',
      criteria: ['ix'],
      danger: false,
      lat: 45.5,
      lon: 14.7,
      parts: 93,
    },
  },
};
const photos = {
  photos: {
    20: { qid: 'Q3678596', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Damascus.jpg' },
  },
};

test('buildSites reads UNESCO records and joins the Wikidata photo by UNESCO number', () => {
  const sites = buildSites(unesco, photos);
  assert.equal(sites.length, 2);
  const damascus = sites.find((site) => site.id === '20');
  assert.equal(damascus.name, 'Ancient City of Damascus');
  assert.equal(damascus.qid, 'Q3678596');
  assert.match(damascus.image, /Damascus\.jpg$/);
  assert.equal(damascus.danger, true);
  assert.equal(damascus.country, 'Syrian Arab Republic');
  assert.deepEqual(damascus.criteriaCodes, ['i', 'ii', 'iii', 'iv', 'vi']);
  assert.equal(damascus.parts, 1);
});

test('serial sites keep their part count, and sites without a photo have none', () => {
  const beech = buildSites(unesco, photos).find((site) => site.id === '1133');
  assert.equal(beech.parts, 93);
  assert.equal(beech.image, null);
  assert.equal(beech.qid, null);
  assert.deepEqual(beech.countries, ['Albania', 'Austria']);
});

test('buildSites works without the photo list', () => {
  assert.equal(buildSites(unesco, null).length, 2);
});

test('buildSites skips records that are malformed', () => {
  const bad = {
    sites: {
      1: { name: '', type: 'cultural', lat: 1, lon: 1 },
      2: { name: 'No coordinates', type: 'cultural' },
      3: { name: 'Off the globe', type: 'cultural', lat: 91, lon: 0 },
      4: { name: 'Unknown type', type: 'ancient', lat: 1, lon: 1 },
      abc: { name: 'Bad id', type: 'cultural', lat: 1, lon: 1 },
      5: { name: 'Fine', type: 'mixed', lat: 1, lon: 1, countries: ['X'], criteria: [], year: 2000 },
    },
  };
  assert.deepEqual(buildSites(bad, null).map((site) => site.id), ['5']);
});

test('buildSites rejects data in the wrong shape', () => {
  assert.throws(() => buildSites({}, null));
  assert.throws(() => buildSites(null, null));
});

test('old Wikidata IDs from links and saves map to UNESCO numbers', () => {
  const sites = buildSites(unesco, photos);
  assert.deepEqual([...canonicalIds(['Q3678596', '1133', 'Q999'], sites)].sort(), ['1133', '20']);
  assert.equal(findSite('Q3678596', sites).id, '20');
  assert.equal(findSite('1133', sites).id, '1133');
  assert.equal(findSite(null, sites), undefined);
});

test('country aliases add the names visitors search with', () => {
  assert.match(countryAliases(['Türkiye']), /Turkey/);
  assert.match(countryAliases(['Russian Federation', 'Türkiye']), /Russia/);
  assert.equal(countryAliases(['Peru']), '');
});

test('buildSites adds gallery photos after the main one, with credits', () => {
  const unesco20 = { sites: { 20: unesco.sites[20] } };
  const photos = { photos: { 20: { qid: 'Q1', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Main.jpg' } } };
  const gallery = {
    extras: { 20: ['Second shot.jpg'] },
    credits: { 'Main.jpg': { by: 'Ana', license: 'CC BY 4.0' }, 'Second shot.jpg': { by: '', license: 'CC0' } },
  };
  const [built] = buildSites(unesco20, photos, gallery);
  assert.deepEqual(built.photos.map((entry) => entry.by), ['Ana', null]);
  assert.deepEqual(built.photos.map((entry) => entry.license), ['CC BY 4.0', 'CC0']);
  assert.match(built.photos[1].url, /Second%20shot\.jpg$/);
  assert.equal(built.image, built.photos[0].url);
});

test('a demoted original goes to the end; a site with no main photo leads with an extra', () => {
  const unesco20 = { sites: { 20: unesco.sites[20] } };
  // photos.json already leads with the better photo for a demoted site.
  const photos = { photos: { 20: { qid: 'Q1', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Good.jpg' } } };
  const gallery = { extras: { 20: ['Good.jpg', 'Second.jpg'] }, credits: {}, demoted: { 20: 'Map.png' } };
  const [built] = buildSites(unesco20, photos, gallery);
  assert.deepEqual(
    built.photos.map((entry) => entry.url.split('/').pop()),
    ['Good.jpg', 'Second.jpg', 'Map.png'],
  );
  const [bare] = buildSites(unesco20, { photos: {} }, { extras: { 20: ['Only.jpg'] } });
  assert.match(bare.image, /Only\.jpg$/);
});

test('applyGallery adds photos to sites that were built without the gallery', () => {
  const unesco20 = { sites: { 20: unesco.sites[20] } };
  const photos = { photos: { 20: { qid: 'Q1', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Main.jpg' } } };
  const [plain] = buildSites(unesco20, photos);
  assert.equal(plain.photos.length, 1);
  const [full] = applyGallery([plain], { extras: { 20: ['Two.jpg'] }, credits: { 'Two.jpg': { by: 'Ana', license: 'CC0' } } });
  assert.equal(full.photos.length, 2);
  assert.equal(full.photos[1].by, 'Ana');
  assert.equal(full.image, plain.image);
});

test('Unsplash photos follow the Commons ones and carry their credit links', () => {
  const unesco20 = { sites: { 20: unesco.sites[20] } };
  const photos = { photos: { 20: { qid: 'Q1', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Main.jpg' } } };
  const gallery = {
    extras: { 20: [] },
    unsplash: {
      20: [{ id: 'u1', url: 'https://images.unsplash.com/photo-1?ixid=a', by: 'Ana', byUrl: 'https://unsplash.com/@ana', link: 'https://unsplash.com/photos/u1' }],
    },
  };
  const [built] = buildSites(unesco20, photos, gallery);
  assert.deepEqual(built.photos.map((entry) => entry.source), ['commons', 'unsplash']);
  assert.equal(built.photos[1].by, 'Ana');
  assert.equal(built.photos[1].byUrl, 'https://unsplash.com/@ana');
  assert.equal(built.photos[1].page, 'https://unsplash.com/photos/u1');
});
