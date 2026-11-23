import { useRef } from 'react';
import type { PointerEvent } from 'react';

const TAP_DISTANCE = 6;
const SWIPE_DISTANCE = 50;

interface SwipeOptions {
  onSwipe: (direction: 1 | -1) => void;
  onDrag?: (offset: number) => void;
  capture?: boolean;
}

export function useSwipe({ onSwipe, onDrag, capture = false }: SwipeOptions) {
  const startRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    draggedRef.current = false;
    startRef.current = event.clientX;
    if (capture) event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (startRef.current === null) return;
    const offset = event.clientX - startRef.current;
    if (Math.abs(offset) >= TAP_DISTANCE) draggedRef.current = true;
    onDrag?.(offset);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (startRef.current === null) return;
    const offset = event.clientX - startRef.current;
    startRef.current = null;
    if (Math.abs(offset) >= TAP_DISTANCE) draggedRef.current = true;
    onDrag?.(0);
    if (offset <= -SWIPE_DISTANCE) onSwipe(1);
    else if (offset >= SWIPE_DISTANCE) onSwipe(-1);
  };

  const wasDragged = () => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  };

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    wasDragged,
  };
}
