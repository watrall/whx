import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { loadDangerNotes, withPeriod } from '../lib/danger.ts';
import type { DangerData } from '../lib/danger.ts';
import { unescoNumber } from '../lib/unesco.ts';
import type { Site } from '../lib/types.ts';

const LINK = 'underline decoration-danger/40 underline-offset-2 hover:decoration-danger-ink';

/**
 * Says why a site is on the List of World Heritage in Danger. UNESCO's data gives
 * only the flag, so the reason and start year come from Wikipedia's list, credited
 * under its CC BY-SA licence. With no reason on record (recent additions often have none
 * yet) it states the status and stops there.
 */
export function DangerNote({ site }: { site: Site }) {
  const [data, setData] = useState<DangerData | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadDangerNotes().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!site.danger) return null;

  const number = unescoNumber(site.unescoId);
  const note = number ? data?.sites[number] : undefined;
  const headingId = `danger-${site.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-4 rounded-xl border border-danger/25 bg-danger-tint p-3"
    >
      <h3
        id={headingId}
        className="flex items-center gap-2 text-sm font-semibold leading-snug text-danger-ink"
      >
        <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
        {note?.since ? `On the danger list since ${note.since}` : "On UNESCO's danger list"}
      </h3>
      {note?.reason ? (
        <>
          <p className="mt-1.5 text-pretty text-sm leading-snug text-ink">{withPeriod(note.reason)}</p>
          {data && (
            <p className="mt-2 text-xs leading-snug text-muted">
              Reason from{' '}
              <a href={data.attribution.source} target="_blank" rel="noreferrer" className={LINK}>
                Wikipedia
              </a>
              ,{' '}
              <a href={data.attribution.licenseUrl} target="_blank" rel="noreferrer" className={LINK}>
                {data.attribution.license}
              </a>
              .
            </p>
          )}
        </>
      ) : data === undefined && number ? (
        <div className="mt-2 space-y-1.5" aria-hidden="true">
          <div className="h-3 w-full animate-pulse rounded bg-danger/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-danger/10" />
        </div>
      ) : null}
    </section>
  );
}
