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

/** The shape of a phone chip. The pseudo-element widens the tap area to 44px. */
const CHIP_SHAPE =
  'relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium before:absolute before:inset-x-0 before:-inset-y-[6px]';

/** A chip floating on the map. */
export const MOBILE_CHIP = `${CHIP_SHAPE} shadow-card`;

/** A chip inside the tray; add its colours. */
export const TRAY_CHIP = `focus-ring ${CHIP_SHAPE} transition active:scale-95`;

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
      ? MOBILE_CHIP
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
      <span
        className={`flex items-center ${variant === 'mobile' ? 'gap-1.5' : 'gap-2'} ${danger && !active ? '[&_svg]:text-danger' : ''}`}
      >
        {icon}
        {label}
      </span>
      {count !== undefined && (
        <span
          className={`${variant === 'strip' ? 'ml-1 ' : ''}tabular-nums ${active ? 'text-canvas/70' : 'text-muted'}`}
        >
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}
