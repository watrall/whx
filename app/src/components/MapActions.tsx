import { LocateFixed, Shuffle } from 'lucide-react';
import { MapTooltip } from './MapTooltip.tsx';
import { MAP_CONTROL } from './MapView.tsx';

interface MapActionsProps {
  onNearMe: () => void;
  onSurprise: () => void;
  notice: string | null;
}

const BUTTON = `group relative focus-ring grid place-items-center border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${MAP_CONTROL.sm.button}`;

export function MapActions({ onNearMe, onSurprise, notice }: MapActionsProps) {
  return (
    <>
      <button type="button" onClick={onNearMe} aria-label="Near me" className={BUTTON}>
        <LocateFixed className={MAP_CONTROL.sm.icon} aria-hidden="true" />
        <MapTooltip placement="right">Near me</MapTooltip>
      </button>
      <button type="button" onClick={onSurprise} aria-label="Surprise me" className={BUTTON}>
        <Shuffle className={MAP_CONTROL.sm.icon} aria-hidden="true" />
        <MapTooltip placement="right">Surprise me</MapTooltip>
      </button>
      <p
        role="status"
        className="absolute bottom-0 left-10 w-max max-w-[240px] rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted shadow-card empty:hidden"
      >
        {notice ?? ''}
      </p>
    </>
  );
}
