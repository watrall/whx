interface DataStatusProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  className: string;
}

const PILL = 'rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs shadow-card backdrop-blur';

export function DataStatus({ loading, error, onRetry, className }: DataStatusProps) {
  if (loading) {
    return (
      <div className={`pointer-events-none font-medium text-muted ${PILL} ${className}`}>Loading sites…</div>
    );
  }
  if (!error) return null;
  return (
    <div className={`flex items-center gap-2 text-muted ${PILL} ${className}`}>
      Data unavailable.
      <button type="button" onClick={onRetry} className="font-medium text-ink underline underline-offset-2">
        Retry
      </button>
    </div>
  );
}
