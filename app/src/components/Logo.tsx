export function Logo({ className = '' }: { className?: string }) {
  return (
    <h1 className={`text-2xl font-bold leading-[1.05] tracking-tight text-ink ${className}`}>
      <span className="block">World Heritage</span>
      <span className="block">Explorer</span>
    </h1>
  );
}
