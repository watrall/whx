import type { YearRange } from './types.ts';

/**
 * The range after clicking a year's bar: just that year, or back to the full range when that
 * year is already the only one selected. A year with no inscriptions changes nothing.
 */
export function rangeAfterYearClick(
  year: number,
  current: YearRange,
  domain: YearRange,
  hasSites: boolean,
): YearRange {
  if (!hasSites) return current;
  if (current[0] === year && current[1] === year) return [domain[0], domain[1]];
  return [year, year];
}

const STAGGER_MIN = 150;
const STAGGER_MAX = 600;
const STAGGER_PER_SITE = 10;
const PLAYBACK_PAUSE = 300;
export const STAGGER_LIMIT = 150;

export function staggerWindow(count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(count * STAGGER_PER_SITE, STAGGER_MIN), STAGGER_MAX);
}

export function playbackHold(count: number): number {
  return staggerWindow(count) + PLAYBACK_PAUSE;
}

export function staggerBatches(count: number): number[] {
  if (count <= 0) return [];
  const steps = Math.min(8, Math.max(1, Math.ceil(count / 4)), count);
  const base = Math.floor(count / steps);
  const extra = count % steps;
  return Array.from({ length: steps }, (_, index) => base + (index < extra ? 1 : 0));
}

export interface PlaybackEntry<T> {
  site: T;
  at: number;
}

export function playbackPool<T extends { year: number | null }>(
  sites: T[],
  start: number,
  domain: YearRange,
): PlaybackEntry<T>[] {
  const pool: PlaybackEntry<T>[] = [];
  for (const site of sites) {
    if (site.year === null) {
      if (start <= domain[0]) pool.push({ site, at: domain[1] });
    } else if (site.year >= start && site.year <= domain[1]) {
      pool.push({ site, at: site.year });
    }
  }
  return pool;
}

export function nearestHandle(x: number, startX: number, endX: number): 'start' | 'end' {
  return Math.abs(x - startX) <= Math.abs(x - endX) ? 'start' : 'end';
}
