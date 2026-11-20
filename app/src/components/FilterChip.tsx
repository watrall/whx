import type { ReactNode } from 'react';
import { formatNumber } from '../lib/utils.ts';

interface FilterChipProps {
  label: string;
  icon: ReactNode;
  count?: number;
  active: boolean;
  onClick: () => void;
  variant?: 'desktop' | 'mobile' | 'strip';
  /** "danger" fills with red when active and tints the icon red when off. */
  tone?: 'ink' | 'danger';
  className?: string;
}

/**
 * A single on/off filter that sits beside the type filters. Active chips fill
 * with ink, the same treatment the "All" chip uses, so they read as the
 * interface's own state and not as a data colour.
 */
export function FilterChip({
  label,
  icon,
  count,
  active,
  onClick,
  variant = 'desktop',
  tone: toneName = 'ink',
  className = '',
}: FilterChipProps) {
  const base =
    variant === 'mobile'
      ? 'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium'
      : variant === 'strip'
        ? 'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-medium shadow-card'
        : 'flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium';
  const danger = toneName === 'danger';
  const tone = active
    ? danger
      ? 'border-danger bg-danger text-canvas'
      : 'border-ink bg-ink text-canvas'
    : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`focus-ring transition ${base} ${tone} ${className}`}
    >
      <span className={`flex items-center gap-2 ${danger && !active ? '[&_svg]:text-danger' : ''}`}>
        {icon}
        {label}
      </span>
      {count !== undefined && (
        <span className={`${variant === 'strip' ? 'ml-1 ' : ''}tabular-nums ${active ? 'text-canvas/70' : 'text-muted'}`}>
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}
