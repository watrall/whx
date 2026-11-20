import { useEffect, useState } from 'react';
import type { Site } from '../lib/types.ts';
import { loadUnescoText } from '../lib/unesco.ts';
import type { UnescoText } from '../lib/unesco.ts';
import { unescoUrl } from '../lib/utils.ts';

const COLLAPSE_OVER = 520;

const LINK = 'underline decoration-line-strong underline-offset-2 hover:text-ink';

/**
 * UNESCO's own description, with the credit its CC BY-SA 3.0 IGO licence requires.
 * A site without one shows nothing here.
 */
export function SiteDescription({ site }: { site: Site }) {
  const [unesco, setUnesco] = useState<UnescoText | null | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadUnescoText().then((result) => {
      if (!cancelled) setUnesco(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const paragraphs = unesco?.text[site.id];

  if (paragraphs && unesco) {
    const total = paragraphs.join(' ');
    const collapsible = total.length > COLLAPSE_OVER;
    const expanded = expandedId === site.id;
    const { attribution } = unesco;
    return (
      <div className="mt-5">
        {collapsible && !expanded ? (
          <p className="line-clamp-6 text-pretty break-words text-sm leading-relaxed text-ink/80">{total}</p>
        ) : (
          <div className="space-y-2.5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-pretty break-words text-sm leading-relaxed text-ink/80">
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {collapsible && (
          <button
            type="button"
            onClick={() => setExpandedId(expanded ? null : site.id)}
            aria-expanded={expanded}
            className="focus-ring mt-1.5 min-h-8 rounded text-xs font-medium text-ink underline underline-offset-2"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        <p className="mt-2 text-xs leading-snug text-muted">
          Description ©{' '}
          <a href={unescoUrl(site)} target="_blank" rel="noreferrer" className={LINK}>
            {attribution.holder}
          </a>
          ,{' '}
          <a href={attribution.licenseUrl} target="_blank" rel="noreferrer" className={LINK}>
            {attribution.license}
          </a>
          . {attribution.note}
        </p>
      </div>
    );
  }

  // The text file is still loading and this site should have an entry.
  if (unesco === undefined) {
    return (
      <div className="mt-5 space-y-2" aria-hidden="true">
        <div className="h-3 w-full animate-pulse rounded bg-line/60" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-line/60" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-line/60" />
      </div>
    );
  }

  return null;
}
