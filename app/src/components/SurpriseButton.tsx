import { Shuffle } from 'lucide-react';

/** A low-key way into the map for people who do not know what to search for. */
export function SurpriseButton({ onSurprise }: { onSurprise: () => void }) {
  return (
    <button
      type="button"
      onClick={onSurprise}
      className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink transition hover:bg-canvas active:scale-[0.98]"
    >
      <Shuffle className="h-4 w-4 text-muted" aria-hidden="true" />
      Surprise me
    </button>
  );
}
