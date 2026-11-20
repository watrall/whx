import { useEffect, useState } from 'react';
import type { Site } from '../lib/types.ts';
import { loadUnescoText, unescoNumber } from '../lib/unesco.ts';
import type { UnescoText } from '../lib/unesco.ts';
import { isUsableDescription, unescoUrl } from '../lib/utils.ts';

/** Wikidata descriptions are lowercase fragments; start them like a sentence. */
function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const COLLAPSE_OVER = 520;

const LINK = 'underline decoration-line-strong underline-offset-2 hover:text-ink';

/**
 * UNESCO's own description when we have it, with the credit its CC BY-SA 3.0
 * IGO licence requires. Falls back to Wikidata's description only when that
 * says something useful, and to nothing otherwise.
 */
export function SiteDescription({ site }: { site: Site }) {
  const number = unescoNumber(site.unescoId);
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

  const paragraphs = number ? unesco?.text[number] : undefined;

  if (paragraphs && unesco) {
    const total = paragraphs.join(' ');
    const collapsible = total.length > COLLAPSE_OVER;
    const expanded = expandedId === site.id;
    const { attribution } = unesco;
    return (
      <div className="mt-4">
        {collapsible && !expanded ? (
          <p className="line-clamp-6 break-words text-sm leading-relaxed text-ink/80">{total}</p>
        ) : (
          <div className="space-y-2.5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="break-words text-sm leading-relaxed text-ink/80">
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
          <a href={unescoUrl(site) ?? attribution.source} target="_blank" rel="noreferrer" className={LINK}>
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
  if (number && unesco === undefined) {
    return (
      <div className="mt-4 space-y-2" aria-hidden="true">
        <div className="h-3 w-full animate-pulse rounded bg-line/60" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-line/60" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-line/60" />
      </div>
    );
  }

  if (site.description && isUsableDescription(site.description, site.name)) {
    return (
      <p className="mt-4 break-words text-sm leading-relaxed text-ink/80">
        {sentenceCase(site.description)}
      </p>
    );
  }

  return null;
}
