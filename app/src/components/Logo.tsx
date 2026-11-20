import museumIcon from '../assets/museum.png';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[9px] whitespace-nowrap ${className}`}>
      {/* Flaticon museum glyph, masked so it takes the ink token instead of pure black. */}
      <span
        aria-hidden="true"
        className="h-10 w-10 shrink-0 bg-ink"
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

      <div className="flex flex-col">
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.01em]">
          <span className="text-cultural">W</span>
          <span className="text-natural">H</span>
          <span className="text-mixed">X</span>
          <span
            className="ml-1 inline-block h-[5px] w-[5px] rounded-full bg-cultural align-baseline"
            aria-hidden="true"
          />
        </h1>
        <p className="mt-[3.9px] text-xs font-semibold uppercase leading-none tracking-[0.18em] text-muted">
          World Heritage Explorer
        </p>
      </div>
    </div>
  );
}
