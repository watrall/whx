import { useCallback, useEffect, useState } from 'react';
import type { YearRange } from './types.ts';
import { playbackHold } from './timeline.ts';

interface PlaybackOptions {
  yearRange: YearRange;
  setYearRange: (range: YearRange) => void;
  domain: YearRange;
  activeYears: number[];
  addedInYear: number;
  onStart: () => void;
}

export function usePlayback({
  yearRange,
  setYearRange,
  domain,
  activeYears,
  addedInYear,
  onStart,
}: PlaybackOptions) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!playing || yearRange[1] >= domain[1]) return;
    const timer = window.setTimeout(
      () => {
        const next = Math.min(activeYears.find((year) => year > yearRange[1]) ?? domain[1], domain[1]);
        setYearRange([yearRange[0], next]);
        if (next >= domain[1]) setPlaying(false);
      },
      playbackHold(addedInYear) / speed,
    );
    return () => window.clearTimeout(timer);
  }, [playing, yearRange, setYearRange, domain, activeYears, speed, addedInYear]);

  const changeRange = useCallback(
    (range: YearRange) => {
      setYearRange(range);
      if (range[1] >= domain[1]) setPlaying(false);
    },
    [setYearRange, domain],
  );

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (yearRange[1] >= domain[1]) setYearRange([domain[0], domain[0]]);
    onStart();
    setPlaying(true);
  }, [playing, yearRange, domain, setYearRange, onStart]);

  const stop = useCallback(() => setPlaying(false), []);

  const cycleSpeed = useCallback(() => setSpeed((value) => (value === 1 ? 2 : value === 2 ? 4 : 1)), []);

  return { playing, stop, speed, cycleSpeed, toggle, changeRange };
}
