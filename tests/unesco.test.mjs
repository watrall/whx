import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeHtmlEntities,
  decodeXml,
  htmlToParagraphs,
  htmlToText,
  categoryToType,
  medoid,
  parseCriteriaCodes,
  parsePois,
  round4,
  parseRows,
  splitStates,
} from '../scripts/unesco-parse.mjs';

test('decodeXml handles numeric and predefined entities', () => {
  assert.equal(decodeXml('caf&#xe9; &lt;p&gt; &amp;amp;'), 'café <p> &amp;');
});

test('htmlToParagraphs splits paragraphs and strips markup', () => {
  const raw = '&lt;p&gt;First &lt;em&gt;one&lt;/em&gt;.&lt;/p&gt;&lt;p&gt;Second&amp;nbsp;one.&lt;/p&gt;';
  assert.deepEqual(htmlToParagraphs(raw), ['First one.', 'Second one.']);
});

test('htmlToParagraphs keeps squared units and ordinals readable', () => {
  const raw =
    '&lt;p&gt;55,000 km&lt;sup&gt;2&lt;/sup&gt; in the 16&lt;sup&gt;th&lt;/sup&gt; century&lt;/p&gt;';
  assert.deepEqual(htmlToParagraphs(raw), ['55,000 km² in the 16th century']);
});

test('htmlToParagraphs decodes typographic entities and reports unknown ones', () => {
  const unknown = [];
  const out = htmlToParagraphs('&lt;p&gt;It&amp;rsquo;s &amp;madeup; here&lt;/p&gt;', (name) =>
    unknown.push(name),
  );
  assert.deepEqual(out, ['It’s &madeup; here']);
  assert.deepEqual(unknown, ['madeup']);
});

test('decodeHtmlEntities leaves unknown entities in place', () => {
  assert.equal(decodeHtmlEntities('a &zzz; b'), 'a &zzz; b');
});

test('htmlToText strips italics from names', () => {
  assert.equal(
    htmlToText('&lt;i&gt;Aflaj&lt;/i&gt; Irrigation Systems of Oman'),
    'Aflaj Irrigation Systems of Oman',
  );
  assert.equal(htmlToText('&lt;I&gt;Sacri Monti&lt;/I&gt; of Piedmont'), 'Sacri Monti of Piedmont');
});

test('an empty description gives no paragraphs', () => {
  assert.deepEqual(htmlToParagraphs(''), []);
});

test('splitStates keeps parenthesised names whole', () => {
  assert.deepEqual(splitStates('Azerbaijan,Iran (Islamic Republic of)'), [
    'Azerbaijan',
    'Iran (Islamic Republic of)',
  ]);
  assert.deepEqual(splitStates('Canada'), ['Canada']);
  assert.deepEqual(splitStates(undefined), []);
});

test('parseRows reads records and keeps geolocations as raw XML', () => {
  const xml =
    '<query><row><id_number>158</id_number><site>Head-Smashed-In</site>' +
    '<geolocations><poi><latitude>1</latitude></poi></geolocations><states>Canada</states></row></query>';
  assert.deepEqual(parseRows(xml), [
    {
      id_number: '158',
      site: 'Head-Smashed-In',
      geolocations: '<poi><latitude>1</latitude></poi>',
      states: 'Canada',
    },
  ]);
});

test('parsePois reads component points and ignores bad ones', () => {
  const xml =
    '<poi><latitude>10.5</latitude><longitude>-20.25</longitude><iso2>xx</iso2></poi>' +
    '<poi><latitude>95</latitude><longitude>0</longitude></poi>' +
    '<poi><latitude>-1</latitude><longitude>2</longitude></poi>';
  assert.deepEqual(parsePois(xml), [
    [10.5, -20.25],
    [-1, 2],
  ]);
  assert.deepEqual(parsePois(''), []);
});

test('medoid picks the component nearest the middle, not the average', () => {
  const points = [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 30],
  ];
  // The average sits near longitude 8; the component closest to it is the one at 2.
  assert.deepEqual(medoid(points), [0, 2]);
  assert.deepEqual(medoid([[5, 5]]), [5, 5]);
  assert.equal(medoid([]), null);
});

test('medoid is safe across the antimeridian', () => {
  const [lat, lon] = medoid([
    [0, 179],
    [0, -179],
    [0, 178],
  ]);
  assert.equal(lat, 0);
  assert.ok(Math.abs(lon) >= 178);
});

test('parseCriteriaCodes handles both formats and orders the result', () => {
  assert.deepEqual(parseCriteriaCodes('(viii)(ix)(x)'), ['viii', 'ix', 'x']);
  assert.deepEqual(parseCriteriaCodes('(iv)|(ii)'), ['ii', 'iv']);
  assert.deepEqual(parseCriteriaCodes(''), []);
});

test('categoryToType maps UNESCO categories', () => {
  assert.equal(categoryToType('Natural'), 'natural');
  assert.equal(categoryToType('Mixed'), 'mixed');
  assert.equal(categoryToType('Cultural'), 'cultural');
});

test('round4 keeps four decimals', () => {
  assert.equal(round4(12.345678), 12.3457);
});
