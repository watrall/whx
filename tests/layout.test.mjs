import test from 'node:test';
import assert from 'node:assert/strict';
import { window } from './dom-setup.mjs';
import { detailOffset } from '../app/src/lib/useSerialParts.ts';
import { PHONE } from '../app/src/lib/layout.ts';
import { clusterIcon } from '../app/src/lib/utils.ts';

const counts = { cultural: 1, natural: 0, mixed: 0 };
const DESKTOP = '(min-width: 1024px)';

test('phones get smaller clusters than desktop', () => {
  window.__matches = { [DESKTOP]: true };
  const desktop = [1, 10, 100].map((count) => clusterIcon(count, counts).size);
  window.__matches = { [DESKTOP]: false };
  const phone = [1, 10, 100].map((count) => clusterIcon(count, counts).size);
  assert.deepEqual(desktop, [38, 46, 58]);
  assert.deepEqual(phone, [24, 30, 36]);
});

test('only phone clusters carry the small modifier', () => {
  window.__matches = { [DESKTOP]: true };
  assert.ok(!clusterIcon(5, counts).html.includes('wh-cluster--sm'));
  window.__matches = { [DESKTOP]: false };
  assert.ok(clusterIcon(5, counts).html.includes('wh-cluster--sm'));
});

test('detail offset shifts a desktop map sideways and a phone map upward', () => {
  assert.deepEqual(detailOffset(true), [210, 0]);
  window.innerHeight = 844;
  const [x, y] = detailOffset(false);
  const cardTop = 844 * (1 - PHONE.cardMaxVh / 100);
  assert.equal(x, 0);
  assert.equal(y, Math.round(844 / 2 - (PHONE.topInset + cardTop) / 2));
  assert.ok(y > 0);
});
