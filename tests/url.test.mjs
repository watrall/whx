import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../app/src/lib/slug.ts';
import { buildUrl, parseLocation } from '../app/src/lib/urlState.ts';

const base = {
  site: null,
  siteName: null,
  query: '',
  types: new Set(),
  years: [1978, 2026],
  domain: [1978, 2026],
  danger: false,
  list: null,
  criteria: new Set(),
  country: null,
};

const at = (target) => {
  const { pathname, search, hash } = new URL(target, 'https://x.test');
  return parseLocation({ pathname, search, hash });
};

test('a pristine view has the plain root URL', () => {
  assert.equal(buildUrl(base), '/');
});

test('an open site goes in the path with a readable slug', () => {
  assert.equal(buildUrl({ ...base, site: '274', siteName: 'Petra' }), '/site/274-petra');
});

test('filters go in the query string beside the site path', () => {
  const url = buildUrl({
    ...base,
    site: '87',
    siteName: 'Chartres Cathedral',
    types: new Set(['cultural']),
    years: [1980, 1999],
    country: 'France',
  });
  assert.equal(url, '/site/87-chartres-cathedral?types=cultural&years=1980-1999&country=France');
  const parsed = at(url);
  assert.equal(parsed.site, '87');
  assert.deepEqual(parsed.types, ['cultural']);
  assert.deepEqual(parsed.years, [1980, 1999]);
  assert.equal(parsed.country, 'France');
});

test('the number alone opens a site, whatever the slug says', () => {
  for (const path of ['/site/274', '/site/274-petra', '/site/274-wrong-name', '/site/274-petra/']) {
    assert.equal(at(path).site, '274', path);
  }
  assert.equal(at('/site/Q1226-old').site, 'Q1226');
});

test('paths that are not a site are ignored', () => {
  for (const path of ['/', '/site/', '/site/abc', '/site/274x', '/other/274', '/site/274/extra']) {
    assert.equal(at(path).site, null, path);
  }
});

test('old hash links still load', () => {
  const parsed = at('/#site=274&types=natural&years=1990-2000&crit=vii');
  assert.equal(parsed.site, '274');
  assert.deepEqual(parsed.types, ['natural']);
  assert.deepEqual(parsed.years, [1990, 2000]);
  assert.deepEqual(parsed.criteria, ['vii']);
});

test('the query string wins over a leftover hash', () => {
  assert.deepEqual(at('/?types=mixed#types=natural').types, ['mixed']);
});

test('bad values fall back to the default view', () => {
  const parsed = at('/?types=zzz&years=2000-1990&crit=zz&q=');
  assert.deepEqual(parsed.types, []);
  assert.equal(parsed.years, null);
  assert.deepEqual(parsed.criteria, []);
  assert.equal(at('/#site=abc').site, null);
});

test('slugify drops accents, apostrophes and punctuation', () => {
  assert.equal(slugify('Kraków’s Historic Centre'), 'krakows-historic-centre');
  assert.equal(slugify('Rock-Hewn Churches, Lalibela'), 'rock-hewn-churches-lalibela');
  assert.equal(slugify('Pimachiowin Aki'), 'pimachiowin-aki');
});

test('slugify keeps the whole name however long it is', () => {
  assert.equal(
    slugify('Mount Qingcheng and the Dujiangyan Irrigation System'),
    'mount-qingcheng-and-the-dujiangyan-irrigation-system',
  );
});

test('slugify returns nothing for a name with no Latin letters', () => {
  assert.equal(slugify('文化遺産'), '');
  assert.equal(buildUrl({ ...base, site: '5', siteName: '文化遺産' }), '/site/5');
});
