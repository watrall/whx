import { useId, useRef, useState } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';
import { PHONE } from '../lib/layout.ts';

export type SheetSnap = 'peek' | 'mid' | 'full';

interface MobileSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Always shown under the handle, collapsed or open. */
  pinned: ReactNode;
  /** Fills the space under `pinned` while the sheet is collapsed, and fades out as it opens. */
  peek: ReactNode;
  children: ReactNode;
  className?: string;
}

function safeBottomInset(): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;bottom:0;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return value;
}
const SNAP_ORDER: SheetSnap[] = ['peek', 'mid', 'full'];

/** How far, in pixels, the tray has to rise for the collapsed content to give way to the list. */
const CROSSFADE_PX = 120;
/** How far each layer drifts, in pixels, while it fades. */
const DRIFT_PX = 8;
/** The collapsed content fades this many times faster than the list fades in. */
const PEEK_FADE_RATE = 2.5;

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function MobileSheet({
  snap,
  onSnapChange,
  pinned,
  peek,
  children,
  className = '',
}: MobileSheetProps) {
  const sheetId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const dragBaseRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const didDragRef = useRef(false);
  const [dragY, setDragY] = useState<number | null>(null);
  // 0 with the tray collapsed, 1 once it is open; follows the finger while dragging.
  const [dragProgress, setDragProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const snapBases = () => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight * 0.92;
    return {
      peek: Math.max(0, height - (PHONE.peek + safeBottomInset())),
      mid: Math.max(0, height - window.innerHeight * 0.64),
      full: 0,
    };
  };

  const snapTransform = () => {
    if (dragY !== null) return `translateY(${dragY}px)`;
    if (snap === 'peek')
      return 'translateY(calc(92dvh - var(--sheet-peek) - env(safe-area-inset-bottom, 0px)))';
    if (snap === 'mid') return 'translateY(28dvh)';
    return 'translateY(0px)';
  };

  const cycleSnap = () => {
    const index = SNAP_ORDER.indexOf(snap);
    onSnapChange(SNAP_ORDER[(index + 1) % SNAP_ORDER.length]);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const bases = snapBases();
    dragStartRef.current = event.clientY;
    dragBaseRef.current = bases[snap];
    dragDistanceRef.current = 0;
    didDragRef.current = false;
    setDragging(true);
    setDragY(bases[snap]);
    setDragProgress(snap === 'peek' ? 0 : 1);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragStartRef.current === null) return;
    const bases = snapBases();
    const delta = event.clientY - dragStartRef.current;
    dragDistanceRef.current = Math.abs(delta);
    const next = Math.min(Math.max(dragBaseRef.current + delta, 0), bases.peek);
    setDragY(next);
    setDragProgress(clamp01((bases.peek - next) / CROSSFADE_PX));
    if (dragDistanceRef.current > 4) didDragRef.current = true;
  };

  const finishDrag = () => {
    if (dragStartRef.current === null) return;
    const bases = snapBases();
    const current = dragY ?? bases[snap];
    dragStartRef.current = null;
    setDragging(false);
    setDragY(null);
    if (!didDragRef.current) return;
    const candidates = SNAP_ORDER.map((candidate) => ({
      snap: candidate,
      distance: Math.abs(current - bases[candidate]),
    }));
    candidates.sort((a, b) => a.distance - b.distance);
    onSnapChange(candidates[0].snap);
  };

  const onPointerUp = () => {
    finishDrag();
  };

  const onPointerCancel = () => {
    dragStartRef.current = null;
    setDragging(false);
    setDragY(null);
  };

  const onClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    cycleSnap();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const index = SNAP_ORDER.indexOf(snap);
      onSnapChange(SNAP_ORDER[Math.min(index + 1, SNAP_ORDER.length - 1)]);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const index = SNAP_ORDER.indexOf(snap);
      onSnapChange(SNAP_ORDER[Math.max(index - 1, 0)]);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onSnapChange('peek');
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onSnapChange(SNAP_ORDER[SNAP_ORDER.length - 1]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onSnapChange('peek');
    }
  };

  const progress = dragging ? dragProgress : snap === 'peek' ? 0 : 1;
  const listActive = progress >= 0.5;
  const fade = dragging ? 'none' : 'opacity 300ms var(--ease-sheet), transform 300ms var(--ease-sheet)';

  return (
    <div
      ref={sheetRef}
      id={sheetId}
      role="region"
      aria-label="Site browser"
      className={`fixed inset-x-0 bottom-0 z-sheet flex h-[92dvh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-float ${
        dragging ? '' : 'transition-transform duration-300 ease-sheet'
      } ${className}`}
      style={{ transform: snapTransform() }}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onKeyDown={onKeyDown}
        aria-label="Expand or collapse the tray"
        aria-expanded={snap !== 'peek'}
        aria-controls={sheetId}
        title="Drag or tap to expand"
        className="focus-ring flex h-7 shrink-0 touch-none items-start justify-center rounded-t-2xl pt-2.5"
      >
        <span className="sheet-handle" aria-hidden="true" />
      </button>

      <div className="shrink-0">{pinned}</div>
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-line"
          style={{ opacity: progress, transition: fade }}
        />
        <div
          inert={listActive}
          className="absolute inset-x-0 top-0"
          style={{
            opacity: clamp01(1 - progress * PEEK_FADE_RATE),
            transform: `translateY(${progress * DRIFT_PX}px)`,
            transition: fade,
          }}
        >
          {peek}
        </div>
        <div
          inert={!listActive}
          className="absolute inset-0 flex flex-col overflow-y-auto overscroll-contain scroll-thin pb-[calc(env(safe-area-inset-bottom)+16px)]"
          style={{
            opacity: progress,
            transform: `translateY(${(1 - progress) * DRIFT_PX}px)`,
            transition: fade,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
