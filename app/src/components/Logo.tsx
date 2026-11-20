import { Globe2 } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-canvas">
        <Globe2 className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-ink">World Heritage</span>
        <span className="block text-xs font-medium tracking-[0.14em] text-muted">EXPLORER</span>
      </span>
    </div>
  );
}
