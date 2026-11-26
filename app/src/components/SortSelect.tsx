import { ChevronDown } from 'lucide-react';
import type { SortKey } from '../lib/sortSites.ts';

interface SortSelectProps {
  sort: SortKey;
  onChange: (sort: SortKey) => void;
  hasOrigin: boolean;
  /** A rounder, taller control to sit among the phone tray's other controls. */
  touch?: boolean;
}

export function SortSelect({ sort, onChange, hasOrigin, touch = false }: SortSelectProps) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort sites</span>
      <select
        value={sort}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className={`focus-ring appearance-none border border-line bg-surface font-medium text-ink ${
          touch ? 'h-10 rounded-full pl-3.5 pr-8 text-sm' : 'h-9 rounded-md pl-2.5 pr-7 text-xs'
        }`}
      >
        <option value="name">Name</option>
        <option value="year">Year</option>
        <option value="country">Country</option>
        {hasOrigin && <option value="distance">Distance</option>}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute h-3 w-3 text-muted ${touch ? 'right-3' : 'right-1.5'}`}
        aria-hidden="true"
      />
    </label>
  );
}
