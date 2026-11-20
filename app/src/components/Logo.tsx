export function Logo({ className = '' }: { className?: string }) {
  return (
    <h1
      className={`whitespace-nowrap text-2xl font-bold leading-tight tracking-tight text-ink ${className}`}
    >
      World Heritage Explorer
    </h1>
  );
}
