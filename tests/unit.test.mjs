import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts.js', import.meta.url), 'utf8');

function makeElement() {
  return {
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    textContent: '',
    innerHTML: '',
    offsetWidth: 0,
    parentElement: null,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    },
    getAttribute() { return null; },
    setAttribute() {},
    removeAttribute() {},
    toggleAttribute() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    focus() {},
    click() {}
  };
}

const documentStub = {
  documentElement: { style: {} },
  body: makeElement(),
  getElementById() { return makeElement(); },
  querySelector() { return makeElement(); },
  querySelectorAll() { return []; },
  createElement() { return makeElement(); },
  addEventListener() {},
  removeEventListener() {}
};

const windowStub = {
  location: { href: 'http://localhost/' },
  addEventListener() {},
  removeEventListener() {},
  getComputedStyle() {
    return { getPropertyValue() { return '16px'; } };
  },
  requestAnimationFrame(callback) { return callback(); },
  cancelAnimationFrame() {}
};

const sandbox = {
  document: documentStub,
  window: windowStub,
  Intl,
  URL,
  URLSearchParams,
  AbortController,
  console,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: windowStub.requestAnimationFrame,
  cancelAnimationFrame: windowStub.cancelAnimationFrame,
  getComputedStyle: windowStub.getComputedStyle,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node-test' },
  fetch: async () => { throw new Error('fetch disabled in unit tests'); }
};

sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: 'scripts.js' });

test('normalizeUnescoId collapses extensions and sub-site suffixes', () => {
  assert.equal(sandbox.normalizeUnescoId('123bis'), '123');
  assert.equal(sandbox.normalizeUnescoId('123ter'), '123');
  assert.equal(sandbox.normalizeUnescoId('123quater'), '123');
  assert.equal(sandbox.normalizeUnescoId('123rev'), '123');
  assert.equal(sandbox.normalizeUnescoId('123bis-001'), '123');
  assert.equal(sandbox.normalizeUnescoId('430-001'), '430');
  assert.equal(sandbox.normalizeUnescoId(' 123 '), '123');
  assert.equal(sandbox.normalizeUnescoId(''), '');
  assert.equal(sandbox.normalizeUnescoId(null), '');
});

test('parseInscriptionYear parses numeric years and rejects empty values', () => {
  assert.equal(sandbox.parseInscriptionYear('1981'), 1981);
  assert.equal(sandbox.parseInscriptionYear('2026'), 2026);
  assert.equal(sandbox.parseInscriptionYear(1978), 1978);
  assert.equal(sandbox.parseInscriptionYear(''), null);
  assert.equal(sandbox.parseInscriptionYear(null), null);
});

test('resolveSiteType prioritizes explicit type and criteria', () => {
  assert.equal(sandbox.resolveSiteType({ type: 'Natural' }, []), 'natural');
  assert.equal(sandbox.resolveSiteType({}, ['i', 'ii']), 'cultural');
  assert.equal(sandbox.resolveSiteType({}, ['vii', 'viii']), 'natural');
  assert.equal(sandbox.resolveSiteType({}, ['i', 'vii']), 'mixed');
});

test('normalizeSearchValue lowercases and removes accents', () => {
  assert.equal(sandbox.normalizeSearchValue('Śródmieście'), 'srodmiescie');
  assert.equal(sandbox.normalizeSearchValue('  Yellowstone  '), '  yellowstone  ');
  assert.equal(sandbox.normalizeSearchValue(null), '');
});

test('escapeHtml escapes markup and quotes', () => {
  assert.equal(
    sandbox.escapeHtml('<script>&"\'</script>'),
    '&lt;script&gt;&amp;&quot;&#039;&lt;/script&gt;'
  );
});

test('safeExternalUrl allows only http and https URLs', () => {
  assert.equal(sandbox.safeExternalUrl('https://example.com'), 'https://example.com/');
  assert.equal(sandbox.safeExternalUrl('http://example.com'), 'http://example.com/');
  assert.equal(sandbox.safeExternalUrl('javascript:alert(1)'), '');
  assert.equal(sandbox.safeExternalUrl(''), '');
  assert.equal(sandbox.safeExternalUrl(null), '');
});

test('normalizeBindings extracts coordinates, IDs, images, and criteria', () => {
  const [site] = sandbox.normalizeBindings([{
    item: { value: 'http://www.wikidata.org/entity/Q123' },
    itemLabel: { value: 'Test Site' },
    coordinate: { value: 'Point(10 20)' },
    inscriptionYear: { value: '1981' },
    unescoId: { value: '123bis' },
    image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Test.jpg' },
    criteria: { value: 'i|ii' },
    officialUrl: { value: 'https://example.com' }
  }]);

  assert.equal(site.site, 'http://www.wikidata.org/entity/Q123');
  assert.equal(site.label, 'Test Site');
  assert.equal(site.coord.lat, 20);
  assert.equal(site.coord.lon, 10);
  assert.equal(site.latitude, 20);
  assert.equal(site.longitude, 10);
  assert.equal(site.inscriptionYear, '1981');
  assert.equal(site.unescoId, '123bis');
  assert.equal(site.images.length, 1);
  assert.equal(site.images[0], 'Test.jpg');
  assert.equal(site.criteria.length, 2);
  assert.equal(site.criteria[0], 'i');
  assert.equal(site.criteria[1], 'ii');
  assert.equal(site.unescoUrl, 'https://example.com');
});
