import test from 'node:test';
import assert from 'node:assert/strict';
import {
  articleImageNames,
  cleanText,
  countLanguages,
  creditFrom,
  fileNameFromImage,
  groupKey,
  hamming,
  isAnimalPhoto,
  isDuplicate,
  isUsablePhoto,
  pickExtras,
  pruneCredits,
  scorePhoto,
} from '../scripts/gallery.mjs';

const photo = (title, extra = {}) => ({
  title,
  mime: 'image/jpeg',
  width: 3000,
  height: 2000,
  categories: 'Landscapes',
  ...extra,
});

test('fileNameFromImage decodes a FilePath URL', () => {
  assert.equal(
    fileNameFromImage('https://commons.wikimedia.org/wiki/Special:FilePath/Gal%C3%A1pagos_Islands%20A.jpg'),
    'Galápagos Islands A.jpg',
  );
  assert.equal(fileNameFromImage('not a url'), null);
});

test('cleanText strips markup and decodes entities', () => {
  assert.equal(cleanText('<a href="x">Ron &amp; Co</a> &#169; 2004'), 'Ron & Co © 2004');
  assert.equal(cleanText(undefined), '');
});

test('creditFrom drops placeholder and runaway authors', () => {
  const meta = (artist) => ({ Artist: { value: artist }, LicenseShortName: { value: 'CC BY 4.0' } });
  assert.deepEqual(creditFrom(meta('<b>Ana</b>')), { by: 'Ana', license: 'CC BY 4.0' });
  assert.equal(creditFrom(meta('Unknown author')).by, '');
  assert.equal(creditFrom(meta('x'.repeat(200))).by, '');
});

test('isUsablePhoto wants a large landscape JPEG that is not a map', () => {
  assert.equal(isUsablePhoto(photo('Temple.jpg')), true);
  assert.equal(isUsablePhoto(photo('Temple.png', { mime: 'image/png' })), false);
  assert.equal(isUsablePhoto(photo('Small.jpg', { width: 800, height: 600 })), false);
  assert.equal(isUsablePhoto(photo('Tall.jpg', { width: 2000, height: 3000 })), false);
  assert.equal(isUsablePhoto(photo('Panorama.jpg', { width: 9000, height: 2000 })), false);
  assert.equal(isUsablePhoto(photo('Site map.jpg')), false);
  assert.equal(isUsablePhoto(photo('Temple.jpg', { categories: 'Maps of Peru' })), false);
});

test('scorePhoto ranks featured above quality above plain, and rewards use and size', () => {
  const plain = scorePhoto(photo('a.jpg'));
  assert.ok(scorePhoto(photo('a.jpg', { categories: 'Quality images' })) > plain);
  assert.ok(
    scorePhoto(photo('a.jpg', { categories: 'Featured pictures on Wikimedia Commons' })) >
      scorePhoto(photo('a.jpg', { categories: 'Quality images' })),
  );
  assert.ok(scorePhoto(photo('a.jpg', { usage: 20 })) > plain);
  assert.ok(scorePhoto(photo('a.jpg', { width: 6000, height: 4000 })) > plain);
});

test('groupKey treats numbered shots of one scene as the same', () => {
  assert.equal(groupKey('Kanton Day 3 (37).jpg'), groupKey('Kanton Day 3 (38).jpg'));
  assert.notEqual(groupKey('Kanton Day 3.jpg'), groupKey('Orona Day 1.jpg'));
});

test('pickExtras takes the best distinct photos and skips the main one', () => {
  const files = [
    photo('Main.jpg'),
    photo('Great.jpg', { categories: 'Featured pictures on Wikimedia Commons' }),
    photo('Scene (1).jpg'),
    photo('Scene (2).jpg'),
    photo('Other.jpg', { usage: 5 }),
    photo('Map of the site.jpg'),
  ];
  const picked = pickExtras(files, ['Main.jpg'], 3);
  assert.equal(picked[0], 'Great.jpg');
  assert.equal(picked.length, 3);
  assert.equal(picked.includes('Main.jpg'), false);
  assert.equal(picked.includes('Map of the site.jpg'), false);
  assert.equal(picked.filter((title) => title.startsWith('Scene')).length, 1);
});

test('hamming counts differing bits between two 16-digit hashes', () => {
  assert.equal(hamming('0000000000000000', '0000000000000000'), 0);
  assert.equal(hamming('0000000000000000', 'ffffffffffffffff'), 64);
  assert.equal(hamming('00000000000000ff', '0000000000000000'), 8);
});

test('isDuplicate treats near hashes as the same photo and far ones as different', () => {
  const kept = ['0000000000000000'];
  assert.equal(isDuplicate('00000000000003ff', kept), true);
  assert.equal(isDuplicate('0000000000ffffff', kept), false);
  assert.equal(isDuplicate('00000000000003ff', []), false);
});

test('pruneCredits keeps only the credits of files still in use', () => {
  const credits = { 'A.jpg': { by: 'Ana' }, 'B.jpg': { by: 'Ben' }, 'C.jpg': { by: 'Cy' } };
  assert.deepEqual(pruneCredits(credits, ['A.jpg', 'C.jpg', 'Z.jpg']), {
    'A.jpg': { by: 'Ana' },
    'C.jpg': { by: 'Cy' },
  });
});

test('isAnimalPhoto spots animal categories', () => {
  assert.equal(isAnimalPhoto({ categories: 'Farnese Gardens (Rome)|Aves heads in right lateral aspect' }), true);
  assert.equal(isAnimalPhoto({ categories: 'Dogs in Delhi' }), true);
  assert.equal(isAnimalPhoto({ categories: 'Colosseum|Roman amphitheatres' }), false);
  assert.equal(isAnimalPhoto({}), false);
});

test('pickExtras skips animal photos unless they are allowed', () => {
  const files = [photo('Gull.jpg', { categories: 'Birds of Italy' }), photo('Forum.jpg')];
  assert.deepEqual(pickExtras(files, [], 5, { allowAnimals: false }), ['Forum.jpg']);
  assert.deepEqual(pickExtras(files, [], 5).sort(), ['Forum.jpg', 'Gull.jpg']);
});

test('articleImageNames lists the image files of a Wikipedia media list once each', () => {
  const mediaList = {
    items: [
      { type: 'image', title: 'File:Roman_Forum.jpg' },
      { type: 'video', title: 'File:Clip.webm' },
      { type: 'image', title: 'File:Roman_Forum.jpg' },
      { type: 'image', title: 'File:Colosseum at dusk.jpg' },
      { type: 'image' },
    ],
  };
  assert.deepEqual(articleImageNames(mediaList), ['Roman Forum.jpg', 'Colosseum at dusk.jpg']);
  assert.deepEqual(articleImageNames(null), []);
});

test('countLanguages counts how many articles use each photo', () => {
  const english = { items: [{ type: 'image', title: 'File:A.jpg' }, { type: 'image', title: 'File:B.jpg' }] };
  const french = { items: [{ type: 'image', title: 'File:A.jpg' }, { type: 'image', title: 'File:A.jpg' }] };
  const counts = countLanguages([english, french]);
  assert.equal(counts.get('A.jpg'), 2);
  assert.equal(counts.get('B.jpg'), 1);
});

test('a photo used by more language editions ranks higher, up to a cap', () => {
  assert.ok(scorePhoto(photo('a.jpg', { languages: 8 })) > scorePhoto(photo('a.jpg', { languages: 2 })));
  assert.equal(scorePhoto(photo('a.jpg', { languages: 50 })), scorePhoto(photo('a.jpg', { languages: 20 })));
});
