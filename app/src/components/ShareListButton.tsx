import { Check, Share2 } from 'lucide-react';

interface ShareListButtonProps {
  copied: boolean;
  onShare: () => void;
  variant: 'strip' | 'sheet';
}

const STYLE = {
  strip:
    'inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-medium text-ink shadow-card transition hover:bg-canvas',
  sheet:
    'inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-ink transition hover:underline',
} as const;

export function ShareListButton({ copied, onShare, variant }: ShareListButtonProps) {
  const Icon = copied ? Check : Share2;
  return (
    <button type="button" onClick={onShare} className={`focus-ring ${STYLE[variant]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {copied ? 'Link copied' : 'Share list'}
    </button>
  );
}
