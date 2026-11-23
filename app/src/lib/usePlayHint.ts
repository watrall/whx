import { useCallback, useEffect, useState } from 'react';
import { readStored, writeStored } from './storage.ts';

const PLAY_HINT_KEY = 'wh-play-hint';
const SHOW_AFTER_MS = 2500;
const HIDE_AFTER_MS = 30000;

export function usePlayHint(suspended: boolean) {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(() => readStored(PLAY_HINT_KEY) === '1');

  const dismiss = useCallback(() => {
    setSeen(true);
    writeStored(PLAY_HINT_KEY, '1');
  }, []);

  useEffect(() => {
    if (suspended || seen) return;
    let show: number | undefined;
    let hide: number | undefined;
    const arm = () => {
      window.clearTimeout(show);
      if (document.visibilityState !== 'visible' || hide !== undefined) return;
      show = window.setTimeout(() => {
        setReady(true);
        writeStored(PLAY_HINT_KEY, '1');
        hide = window.setTimeout(() => setReady(false), HIDE_AFTER_MS);
      }, SHOW_AFTER_MS);
    };
    arm();
    document.addEventListener('visibilitychange', arm);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      document.removeEventListener('visibilitychange', arm);
    };
  }, [suspended, seen]);

  return { ready, seen, dismiss };
}
