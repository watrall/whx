export function Logo({ className = '' }: { className?: string }) {
  return (
    <h1
      className={`flex items-center gap-2.5 whitespace-nowrap text-title font-bold leading-tight tracking-tight text-ink ${className}`}
    >
      {/* Font Awesome earth icon, in the indigo used for Mixed sites: the one palette colour
          that is not tied to the markers people scan for, so it stands apart from the pins. */}
      <i className="fa-solid fa-earth-americas text-2xl leading-none text-mixed" aria-hidden="true" />
      World Heritage Explorer
    </h1>
  );
}
