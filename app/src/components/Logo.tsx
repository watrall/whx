import museumIcon from '../assets/museum.png';

interface LogoProps {
  className?: string;
  asHeading?: boolean;
}

/** The museum glyph, masked so it takes the ink token instead of pure black. */
export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 bg-ink ${className}`}
      style={{
        maskImage: `url(${museumIcon})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: `url(${museumIcon})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}

/** The WHX. letters alone, each in its type colour, for tight corners of the map. */
export function MiniWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-baseline whitespace-nowrap text-lg font-bold leading-none tracking-[-0.01em] ${className}`}
    >
      <span className="text-cultural">W</span>
      <span className="text-natural">H</span>
      <span className="text-mixed">X</span>
      <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-cultural" />
    </span>
  );
}

export function Logo({ className = '', asHeading = true }: LogoProps) {
  const Wordmark = asHeading ? 'h1' : 'div';
  return (
    <div className={`flex items-center gap-[9px] whitespace-nowrap ${className}`}>
      <LogoMark className="h-10 w-10" />

      <div className="flex flex-col">
        <Wordmark className="text-[30px] font-bold leading-none tracking-[-0.01em]">
          <span className="text-cultural">W</span>
          <span className="text-natural">H</span>
          <span className="text-mixed">X</span>
          <span
            className="ml-1 inline-block h-[5px] w-[5px] rounded-full bg-cultural align-baseline"
            aria-hidden="true"
          />
        </Wordmark>
        <p className="mt-[3.9px] text-xs font-semibold uppercase leading-none tracking-[0.18em] text-muted max-[380px]:text-[11px] max-[380px]:tracking-[0.08em]">
          World Heritage Explorer
        </p>
      </div>
    </div>
  );
}
