import { useId, useRef, useState } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';

export type SheetSnap = 'peek' | 'mid' | 'full';

interface MobileSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  header: ReactNode;
  peek?: ReactNode;
  children: ReactNode;
  className?: string;
}

const PEEK_VISIBLE = 96;
const SNAP_ORDER: SheetSnap[] = ['peek', 'mid', 'full'];

export function MobileSheet({
  snap,
  onSnapChange,
  header,
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
  const [dragging, setDragging] = useState(false);

  const snapBases = () => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight * 0.92;
    return {
      peek: Math.max(0, height - PEEK_VISIBLE),
      mid: Math.max(0, height - window.innerHeight * 0.46),
      full: 0,
    };
  };

  const snapTransform = () => {
    if (dragY !== null) return `translateY(${dragY}px)`;
    if (snap === 'peek') return 'translateY(calc(92dvh - 96px))';
    if (snap === 'mid') return 'translateY(46dvh)';
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
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragStartRef.current === null) return;
    const bases = snapBases();
    const delta = event.clientY - dragStartRef.current;
    dragDistanceRef.current = Math.abs(delta);
    const next = Math.min(Math.max(dragBaseRef.current + delta, 0), bases.peek);
    setDragY(next);
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
    const candidates: { snap: SheetSnap; distance: number }[] = [
      { snap: 'peek', distance: Math.abs(current - bases.peek) },
      { snap: 'mid', distance: Math.abs(current - bases.mid) },
      { snap: 'full', distance: Math.abs(current - bases.full) },
    ];
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
      onSnapChange('full');
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onSnapChange('peek');
    }
  };

  return (
    <div
      ref={sheetRef}
      id={sheetId}
      role="region"
      aria-label="Site browser"
      className={`fixed inset-x-0 bottom-0 z-[800] flex h-[92dvh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-float ${
        dragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]'
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
        aria-label="Expand or collapse site list"
        aria-expanded={snap !== 'peek'}
        aria-controls={sheetId}
        title="Drag or tap to expand"
        className="focus-ring flex h-11 shrink-0 touch-none items-start justify-center rounded-t-2xl pt-2"
      >
        <span className="sheet-handle" aria-hidden="true" />
      </button>

      <div className="shrink-0 px-4 pb-2">{header}</div>
      {peek && <div className="shrink-0 px-4 pb-2">{peek}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-thin pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {children}
      </div>
    </div>
  );
}
