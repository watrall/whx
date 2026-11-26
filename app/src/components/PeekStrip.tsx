import { useMemo } from 'react';
import { pickPreviews } from '../lib/previewPicks.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { SiteImage } from './SiteImage.tsx';

/** How many sites the collapsed tray previews; the strip scrolls past the screen edge. */
const STRIP_LENGTH = 12;

/** One seed per page load, so the strip is the same however often the tray remounts, and new on each visit. */
const SEED = Math.floor(Math.random() * 2 ** 32);

/** The collapsed tray's strip of site photos, a different set each visit, there to invite browsing. */
export function PeekStrip({ e }: { e: Explorer }) {
  const sites = useMemo(() => pickPreviews(e.listSites, SEED, STRIP_LENGTH), [e.listSites]);
  if (sites.length === 0) {
    return (
      <p className="flex h-14 items-center px-4 text-sm text-muted">
        {e.listSites.length === 0
          ? 'No sites in view. Zoom out or change a filter.'
          : 'No photos for the sites in view. Tap Browse for the list.'}
      </p>
    );
  }
  return (
    <ul className="no-scrollbar flex h-14 scroll-px-4 gap-2 overflow-x-auto px-4">
      {sites.map((site) => (
        <li key={site.id} className="shrink-0">
          <button
            type="button"
            onClick={() => e.select(site)}
            className="focus-ring relative block h-14 w-[88px] overflow-hidden rounded-lg border border-line bg-canvas transition active:scale-[0.97]"
          >
            <SiteImage site={site} width={176} className="h-full w-full" />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/70 to-transparent px-1.5 pb-1 pt-3.5 text-left text-xs font-semibold leading-tight text-canvas">
              {site.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
