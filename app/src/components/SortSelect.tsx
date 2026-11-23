import { ChevronDown } from 'lucide-react';
import type { SortKey } from '../lib/sortSites.ts';

interface SortSelectProps {
  sort: SortKey;
  onChange: (sort: SortKey) => void;
  hasOrigin: boolean;
}

export function SortSelect({ sort, onChange, hasOrigin }: SortSelectProps) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort sites</span>
      <select
        value={sort}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className="focus-ring h-9 appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 text-xs font-medium text-ink"
      >
        <option value="name">Name</option>
        <option value="year">Year</option>
        <option value="country">Country</option>
        {hasOrigin && <option value="distance">Distance</option>}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted" aria-hidden="true" />
    </label>
  );
}
