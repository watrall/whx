/** Graticule mark: a globe reduced to meridians, with one terracotta site. */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="13" stroke="oklch(var(--ink))" strokeWidth="1.6" />
      <ellipse cx="16" cy="16" rx="5.5" ry="13" stroke="oklch(var(--ink))" strokeWidth="1.2" />
      <path d="M3.5 12.5h25M3.5 19.5h25" stroke="oklch(var(--ink))" strokeWidth="1.2" />
      <circle cx="21.5" cy="12.5" r="3" fill="oklch(var(--type-cultural))" stroke="oklch(var(--paper-raised))" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="leading-none">
        <span className="block font-serif text-xl font-medium tracking-tight text-ink">
          World Heritage
        </span>
        <span className="mt-1 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Explorer
        </span>
      </span>
    </div>
  );
}
