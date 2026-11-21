import { Fragment } from 'react';
import type { Credit } from '../lib/basemaps.ts';

export function Attribution({ credits, className = '' }: { credits: Credit[]; className?: string }) {
  return (
    <p className={`text-xs leading-none text-muted ${className}`}>
      ©{' '}
      {credits.map((credit, index) => (
        <Fragment key={credit.text}>
          {index > 0 && ' · '}
          {credit.href ? (
            <a
              href={credit.href}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line underline-offset-2 hover:text-ink"
            >
              {credit.text}
            </a>
          ) : (
            credit.text
          )}
        </Fragment>
      ))}
    </p>
  );
}
