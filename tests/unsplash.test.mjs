import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distinctiveWords,
  isRelevant,
  isUsableSize,
  normalize,
  pickUnsplash,
  searchTerm,
  toEntry,
} from '../scripts/unsplash.mjs';

const photo = (id, extra = {}) => ({
  id,
  width: 4000,
  height: 2500,
  likes: 1,
  description: null,
  alt_description: null,
  tags: [],
  user: { name: 'Ana Souza', links: { html: 'https://unsplash.com/@ana' } },
  urls: { raw: 'https://images.unsplash.com/photo-1?ixid=abc' },
  links: { html: `https://unsplash.com/photos/${id}` },
  ...extra,
});

test('normalize drops accents and punctuation', () => {
  assert.equal(normalize('Chavín de Huántar!'), 'chavin de huantar');
});

test('searchTerm drops subtitles and distinctiveWords drops generic words', () => {
  assert.equal(searchTerm('Frontiers of the Roman Empire: The Danube Limes'), 'Frontiers of the Roman Empire');
  assert.deepEqual(distinctiveWords('Historic Sanctuary of Machu Picchu'), ['sanctuary', 'machu', 'picchu']);
  assert.deepEqual(distinctiveWords('The Old Town'), []);
});

test('isRelevant needs most of the name in what Unsplash says about the photo', () => {
  const machu = photo('a', { description: 'Sunrise over Machu Picchu' });
  assert.equal(isRelevant(machu, 'Historic Sanctuary of Machu Picchu'), true);
  assert.equal(isRelevant(machu, 'Historic Centre of Cusco'), false);
  assert.equal(isRelevant(photo('b', { alt_description: 'a mountain' }), 'Machu Picchu'), false);
  assert.equal(isRelevant(photo('c', { tags: [{ title: 'cusco' }] }), 'Historic Centre of Cusco'), true);
  assert.equal(isRelevant(machu, 'The Old Town'), false);
});

test('isUsableSize wants a large landscape photo', () => {
  assert.equal(isUsableSize(photo('a')), true);
  assert.equal(isUsableSize(photo('a', { width: 1500, height: 1000 })), false);
  assert.equal(isUsableSize(photo('a', { width: 2000, height: 3000 })), false);
  assert.equal(isUsableSize(photo('a', { width: 6000, height: 1500 })), false);
});

test('toEntry carries the credit links with a utm_source', () => {
  const entry = toEntry(photo('a'));
  assert.equal(entry.by, 'Ana Souza');
  assert.match(entry.byUrl, /^https:\/\/unsplash\.com\/@ana\?utm_source=whx/);
  assert.match(entry.link, /\/photos\/a\?utm_source=whx/);
  assert.match(entry.url, /ixid=abc/);
});

test('pickUnsplash takes the most liked relevant photos, within the limit', () => {
  const results = [
    photo('low', { description: 'Machu Picchu', likes: 1 }),
    photo('high', { description: 'Machu Picchu', likes: 50 }),
    photo('wrong', { description: 'A beach', likes: 99 }),
    photo('small', { description: 'Machu Picchu', likes: 70, width: 800, height: 600 }),
    photo('used', { description: 'Machu Picchu', likes: 60 }),
  ];
  const picked = pickUnsplash(results, 'Machu Picchu', 2, ['used']);
  assert.deepEqual(picked.map((entry) => entry.id), ['high', 'low']);
});
