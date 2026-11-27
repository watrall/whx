import { useEffect, useRef } from 'react';
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
  /** When this number changes, the chip scrolls into view and pulses once. */
  pulse?: number;
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
  pulse = 0,
  className = '',
}: FilterChipProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const seenPulse = useRef(pulse);
  useEffect(() => {
    const chip = ref.current;
    if (pulse === seenPulse.current || !chip) return;
    seenPulse.current = pulse;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bounce = () => {
      if (still) return;
      chip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], {
        duration: 450,
        easing: 'cubic-bezier(0.25,1,0.5,1)',
      });
    };

    const scroller = chip.parentElement;
    const row = scroller?.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    if (!scroller || !row || (box.left >= row.left && box.right <= row.right)) {
      bounce();
      return;
    }

    // Wait for the row to finish scrolling so the pulse is seen; the timer covers browsers without scrollend.
    const done = () => {
      window.clearTimeout(timer);
      scroller.removeEventListener('scrollend', done);
      bounce();
    };
    const timer = window.setTimeout(done, 600);
    scroller.addEventListener('scrollend', done, { once: true });
    chip.scrollIntoView({ behavior: still ? 'auto' : 'smooth', inline: 'nearest', block: 'nearest' });
    return () => {
      window.clearTimeout(timer);
      scroller.removeEventListener('scrollend', done);
    };
  }, [pulse]);
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
      ref={ref}
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
