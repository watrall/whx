export function Logo({ className = '' }: { className?: string }) {
  return (
    <h1
      className={`text-lg font-semibold leading-tight tracking-tight text-ink ${className}`}
    >
      World Heritage Explorer
    </h1>
  );
}
