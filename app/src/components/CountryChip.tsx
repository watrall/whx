import { X } from 'lucide-react';

interface CountryChipProps {
  country: string;
  onClear: () => void;
  className?: string;
}

/** Shows the active country filter and removes it. */
export function CountryChip({ country, onClear, className = '' }: CountryChipProps) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Remove country filter: ${country}`}
      className={`focus-ring inline-flex h-10 max-w-full items-center gap-2 rounded-xl border border-ink bg-ink px-3 text-xs font-medium text-canvas shadow-card transition hover:bg-ink/90 ${className}`}
    >
      <span className="truncate">{country}</span>
      <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </button>
  );
}
