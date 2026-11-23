const PLACEMENT = {
  above: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  /** For a control at the right edge of the window, so the tooltip is not cut off. */
  aboveEnd: 'bottom-full right-0 mb-1.5',
  belowEnd: 'top-full right-0 mt-1.5',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
} as const;

export type TooltipPlacement = keyof typeof PLACEMENT;

/** The name of a map control, shown on hover and keyboard focus. Put it inside a `group` button. */
export function MapTooltip({
  children,
  placement = 'above',
}: {
  children: string;
  placement?: TooltipPlacement;
}) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-[700] whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-canvas opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${PLACEMENT[placement]}`}
    >
      {children}
    </span>
  );
}
