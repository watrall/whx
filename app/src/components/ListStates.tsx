import { Info, RotateCcw } from 'lucide-react';

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-line/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-line/60" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-line/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid place-items-center px-6 py-10 text-center" role="alert">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-canvas text-muted">
        <Info className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">Could not load sites</h3>
      <p className="mt-1 max-w-[30ch] text-xs leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
