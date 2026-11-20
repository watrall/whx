export type ListScope = 'view' | 'all';

interface ListScopeToggleProps {
  scope: ListScope;
  onChange: (scope: ListScope) => void;
  /** Taller buttons for touch. */
  touch?: boolean;
}

const OPTIONS: { value: ListScope; label: string }[] = [
  { value: 'view', label: 'In view' },
  { value: 'all', label: 'All' },
];

/** Switches the list between the sites on screen and every site matching the filters. */
export function ListScopeToggle({ scope, onChange, touch = false }: ListScopeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Which sites to list"
      className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-canvas p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = scope === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`focus-ring rounded-md px-3 text-xs font-medium transition ${
              touch ? 'h-10' : 'h-8'
            } ${active ? 'bg-ink text-canvas' : 'text-muted hover:bg-surface hover:text-ink'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
