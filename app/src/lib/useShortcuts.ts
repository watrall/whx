import { useEffect } from 'react';
import type { SiteType } from './types.ts';

interface Shortcuts {
  paused: boolean;
  hasSelection: boolean;
  onEscape: () => void;
  onSearch: () => void;
  onAbout: () => void;
  onToggleType: (type: SiteType) => void;
  onPlayToggle: () => void;
  onStep: (delta: -1 | 1) => void;
}

const TYPE_KEYS: Record<string, SiteType> = { '1': 'cultural', '2': 'natural', '3': 'mixed' };

export function useShortcuts({
  paused,
  hasSelection,
  onEscape,
  onSearch,
  onAbout,
  onToggleType,
  onPlayToggle,
  onStep,
}: Shortcuts) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
      const interactive = target?.closest('button, a, [role="button"], [role="slider"]');

      if (event.key === 'Escape') {
        onEscape();
        return;
      }
      if (paused || typing) return;

      if (event.key === '/') {
        event.preventDefault();
        onSearch();
      } else if (TYPE_KEYS[event.key]) {
        onToggleType(TYPE_KEYS[event.key]);
      } else if (event.key === ' ' && !interactive) {
        event.preventDefault();
        onPlayToggle();
      } else if (event.key === '?') {
        onAbout();
      } else if (hasSelection && !interactive && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        onStep(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paused, hasSelection, onEscape, onSearch, onAbout, onToggleType, onPlayToggle, onStep]);
}
