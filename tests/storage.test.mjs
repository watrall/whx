import test from 'node:test';
import assert from 'node:assert/strict';
import { window } from './dom-setup.mjs';
import { readStored, removeStored, writeStored } from '../app/src/lib/storage.ts';

test('stores, reads and removes a value', () => {
  writeStored('k', 'v');
  assert.equal(readStored('k'), 'v');
  removeStored('k');
  assert.equal(readStored('k'), null);
});

test('never throws when storage is unavailable', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });
  assert.equal(readStored('k'), null);
  assert.doesNotThrow(() => writeStored('k', 'v'));
  assert.doesNotThrow(() => removeStored('k'));
  Object.defineProperty(window, 'localStorage', original);
});
