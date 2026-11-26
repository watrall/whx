import { Shuffle } from 'lucide-react';
import { TRAY_CHIP } from './FilterChip.tsx';

/** A low-key way into the map for people who do not know what to search for. */
export function SurpriseButton({ onSurprise }: { onSurprise: () => void }) {
  return (
    <button
      type="button"
      onClick={onSurprise}
      className={`${TRAY_CHIP} border-line bg-surface text-ink hover:bg-canvas`}
    >
      <Shuffle className="h-4 w-4 text-muted" aria-hidden="true" />
      Surprise me
    </button>
  );
}
