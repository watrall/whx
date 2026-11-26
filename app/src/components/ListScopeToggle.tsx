import { formatNumber } from '../lib/utils.ts';

export type ListScope = 'view' | 'all';

interface ListScopeToggleProps {
  scope: ListScope;
  onChange: (scope: ListScope) => void;
  /** A pill sized for touch, with a count after each short label. */
  counts?: Record<ListScope, number>;
}

const OPTIONS: { value: ListScope; label: string; short: string }[] = [
  { value: 'view', label: 'In view', short: 'In view' },
  { value: 'all', label: 'All sites', short: 'All' },
];

/** Switches the list between the sites on screen and every site matching the filters. */
export function ListScopeToggle({ scope, onChange, counts }: ListScopeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Which sites to list"
      className={`inline-flex items-center gap-0.5 border border-line bg-canvas p-0.5 ${
        counts ? 'h-10 rounded-full' : 'rounded-lg'
      }`}
    >
      {OPTIONS.map((option) => {
        const active = scope === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`focus-ring font-medium transition ${
              counts ? 'h-full whitespace-nowrap rounded-full px-2.5 text-sm' : 'h-8 rounded-md px-3 text-xs'
            } ${active ? 'bg-ink text-canvas' : 'text-muted hover:bg-surface hover:text-ink'}`}
          >
            {counts ? option.short : option.label}
            {counts && <span className="ml-1 max-[380px]:hidden">{formatNumber(counts[option.value])}</span>}
          </button>
        );
      })}
    </div>
  );
}
