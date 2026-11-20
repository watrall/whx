export function Attribution({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-none text-muted ${className}`}>
      ©{' '}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="underline decoration-line underline-offset-2 hover:text-ink"
      >
        OpenStreetMap
      </a>{' '}
      contributors
    </p>
  );
}
