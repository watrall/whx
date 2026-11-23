import test from 'node:test';
import assert from 'node:assert/strict';
import { window } from './dom-setup.mjs';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '../app/src/lib/useDebouncedValue.ts';
import { useMediaQuery } from '../app/src/lib/useMediaQuery.ts';
import { useSavedSites } from '../app/src/lib/useSavedSites.ts';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('useDebouncedValue waits for the value to settle', async () => {
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 40), {
    initialProps: { value: 'a' },
  });
  rerender({ value: 'b' });
  rerender({ value: 'c' });
  assert.equal(result.current, 'a');
  await act(() => wait(80));
  assert.equal(result.current, 'c');
});

test('useMediaQuery reads the current match', () => {
  window.__matches = { '(min-width: 1024px)': true };
  const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
  assert.equal(result.current, true);
  window.__matches = {};
});

test('useSavedSites toggles, persists and ignores bad stored data', () => {
  window.localStorage.setItem('wh-saved-sites', JSON.stringify(['12', 'nope', 7, 'Q42']));
  const { result } = renderHook(() => useSavedSites());
  assert.deepEqual([...result.current.saved].sort(), ['12', 'Q42']);
  act(() => result.current.toggle('99'));
  assert.ok(result.current.saved.has('99'));
  assert.ok(JSON.parse(window.localStorage.getItem('wh-saved-sites')).includes('99'));
  act(() => result.current.toggle('99'));
  assert.ok(!result.current.saved.has('99'));
});
