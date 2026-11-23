import { MapPinOff, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ title, description, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <div className={`grid place-items-center px-6 py-10 text-center ${className}`} role="status">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-canvas text-muted">
        <MapPinOff className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-[28ch] text-xs leading-relaxed text-muted">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="focus-ring mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
