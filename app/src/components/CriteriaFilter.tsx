import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ALL_CRITERIA, CULTURAL_CODES } from '../lib/criteria.ts';
import { formatNumber } from '../lib/utils.ts';

interface CriteriaFilterProps {
  selected: ReadonlySet<string>;
  /** Sites that meet each criterion, given the other active filters. */
  counts: Record<string, number>;
  onToggle: (code: string) => void;
  onClear: () => void;
  /** "popover" floats over the list (desktop rail); "inline" pushes content down (sheet). */
  layout?: 'popover' | 'inline';
  /** "strip" sizes the button and panel for the floating strip. */
  size?: 'rail' | 'strip';
  className?: string;
}

/**
 * Filter by UNESCO selection criterion, with the plain-language labels. A site
 * matches when it meets any selected criterion.
 */
export function CriteriaFilter({
  selected,
  counts,
  onToggle,
  onClear,
  layout = 'popover',
  size = 'rail',
  className = '',
}: CriteriaFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || layout !== 'popover') return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, layout]);

  const summary =
    selected.size === 0
      ? 'Any criterion'
      : [...selected]
          .sort(
            (a, b) =>
              ALL_CRITERIA.findIndex((c) => c.code === a) - ALL_CRITERIA.findIndex((c) => c.code === b),
          )
          .join(', ');

  const group = (title: string, codes: string[]) => (
    <fieldset className="min-w-0">
      <legend className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </legend>
      {ALL_CRITERIA.filter((criterion) => codes.includes(criterion.code)).map((criterion) => (
        <label
          key={criterion.code}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm transition hover:bg-canvas"
          title={criterion.description}
        >
          <input
            type="checkbox"
            checked={selected.has(criterion.code)}
            onChange={() => onToggle(criterion.code)}
            className="focus-ring h-4 w-4 shrink-0 cursor-pointer accent-[oklch(0.22_0.015_60)]"
          />
          <span className="w-8 shrink-0 text-xs font-semibold tabular-nums text-muted">{criterion.code}</span>
          <span className="min-w-0 flex-1 truncate text-ink">{criterion.label}</span>
          <span className="text-xs tabular-nums text-muted">{formatNumber(counts[criterion.code] ?? 0)}</span>
        </label>
      ))}
    </fieldset>
  );

  const panel = (
    <div
      className={
        layout === 'popover'
          ? `absolute top-full z-30 mt-1 max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-float scroll-thin ${
              size === 'strip' ? 'left-0 w-[320px]' : 'inset-x-0'
            }`
          : 'mt-1 rounded-xl border border-line bg-surface p-1'
      }
    >
      {group('Cultural', CULTURAL_CODES)}
      {group('Natural', ['vii', 'viii', 'ix', 'x'])}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="focus-ring m-1 min-h-9 rounded-lg px-3 text-xs font-medium text-ink underline underline-offset-2"
        >
          Clear criteria
        </button>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className={`relative ${size === 'strip' ? 'shrink-0' : ''} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`focus-ring flex min-h-10 items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium transition ${
          size === 'strip' ? 'h-10 shrink-0 shadow-card' : 'w-full'
        } ${
          selected.size > 0
            ? 'border-ink bg-ink text-canvas'
            : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span>Criteria</span>
          {(selected.size > 0 || size !== 'strip') && (
            <span className={`truncate ${selected.size > 0 ? 'text-canvas/80' : 'text-muted'}`}>
              {summary}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && panel}
    </div>
  );
}
