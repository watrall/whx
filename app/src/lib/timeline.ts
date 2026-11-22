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

/** Shortest and longest time, in ms at 1×, over which one year's sites are spread out. */
const STAGGER_MIN = 150;
const STAGGER_MAX = 600;
const STAGGER_PER_SITE = 10;
/** A beat of stillness after a year has fully appeared, before the next one starts. */
const PLAYBACK_PAUSE = 300;
/** More new sites than this at once means the viewer jumped, so they appear without a stagger. */
export const STAGGER_LIMIT = 150;

/** How long a year's sites take to appear: busy years get longer, quiet ones stay snappy. */
export function staggerWindow(count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(count * STAGGER_PER_SITE, STAGGER_MIN), STAGGER_MAX);
}

/** How long playback rests on a year before moving to the next one, in ms at 1×. */
export function playbackHold(count: number): number {
  return staggerWindow(count) + PLAYBACK_PAUSE;
}

/** Splits `count` new sites into a few near-equal batches that appear one after another. */
export function staggerBatches(count: number): number[] {
  if (count <= 0) return [];
  const steps = Math.min(8, Math.max(1, Math.ceil(count / 4)), count);
  const base = Math.floor(count / steps);
  const extra = count % steps;
  return Array.from({ length: steps }, (_, index) => base + (index < extra ? 1 : 0));
}

export interface PlaybackEntry<T> {
  site: T;
  /** The year this site appears during playback. */
  at: number;
}

/**
 * The sites playback will reveal, each with the year it appears. Sites with no year only show
 * when the whole range is in view, so they arrive with the final year rather than all at once
 * after playback ends.
 */
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
