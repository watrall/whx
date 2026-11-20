import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanWikitext,
  normalizeName,
  parseDangerList,
  sinceYear,
  unescoIdFromRow,
} from '../scripts/danger-parse.mjs';

test('cleanWikitext removes refs, templates, links and emphasis', () => {
  const raw =
    "[[Syrian civil war]], [[Southern Syria offensive (2024)|captured by rebels]] in '''December''' 2024.<ref>{{cite web |url=https://x}}</ref>";
  assert.equal(cleanWikitext(raw), 'Syrian civil war, captured by rebels in December 2024.');
});

test('cleanWikitext handles self-closing refs and nested templates', () => {
  assert.equal(cleanWikitext('Mining.<ref name="a"/> {{nowrap|{{abbr|UN|x}} text}}'), 'Mining.');
});

test('sinceYear reads an open range and ignores closed ones', () => {
  assert.equal(sinceYear('align=center|1992–'), 1992);
  assert.equal(sinceYear('1996–2007, 2018–'), 2018);
  assert.equal(sinceYear('1996–2007'), null);
  assert.equal(sinceYear('align="center" |2013–'), 2013);
});

test('unescoIdFromRow finds the UNESCO list number', () => {
  assert.equal(unescoIdFromRow('x {{cite |url=https://whc.unesco.org/en/list/573 |title=y}}'), '573');
  assert.equal(unescoIdFromRow('no link here'), null);
});

test('normalizeName ignores case, accents and punctuation', () => {
  assert.equal(normalizeName("Old City of Sana'a"), normalizeName('old city of sana’a'));
  assert.equal(normalizeName('Air et Ténéré'), 'air et tenere');
});

const FIXTURE = `{| class="wikitable"
|-
! Site
|-
! scope="row" | [[Aleppo]]
| [[File:a.jpg|150px]]
| [[Aleppo Governorate]]
| align=center|1986
| align=center|2013–
| Cultural: (iii), (iv)
| [[Syrian civil war]].<ref>{{cite web |url=https://whc.unesco.org/en/list/21}}</ref>
|-
! scope="row" | [[Damascus]]
|
| [[Damascus Governorate]]
| align=center|1979
| Cultural: (i), (ii)
| Same war.<ref>{{cite web |url=https://whc.unesco.org/en/list/20}}</ref>
|-
! scope="row" | Boma
|
| [[South Sudan]]
| align=center|2026
| align=center|2026–
| Natural: (vii)
| <ref>{{cite web |url=https://whc.unesco.org/en/list/1808}}</ref>
|}
`;

test('parseDangerList carries a spanned years cell forward and keeps reasonless rows', () => {
  const { sites, unmatched } = parseDangerList(FIXTURE);
  assert.deepEqual(unmatched, []);
  assert.deepEqual(sites['21'], { since: 2013, reason: 'Syrian civil war.' });
  assert.deepEqual(sites['20'], { since: 2013, reason: 'Same war.' });
  assert.deepEqual(sites['1808'], { since: 2026 });
});

test('parseDangerList falls back to matching by name', () => {
  const noLink = FIXTURE.replace('https://whc.unesco.org/en/list/21', 'https://example.org');
  const { sites } = parseDangerList(noLink, new Map([[normalizeName('Aleppo'), '21']]));
  assert.equal(sites['21'].since, 2013);
});
