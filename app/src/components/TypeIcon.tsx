import { Landmark, Leaf } from 'lucide-react';
import type { SiteType } from '../lib/types.ts';
import { TYPE_ICON } from '../lib/utils.ts';

const ICONS = {
  cultural: Landmark,
  natural: Leaf,
} as const;

export function TypeIcon({ type, className }: { type: SiteType; className?: string }) {
  if (type === 'mixed') {
    return (
      <span
        className={`type-icon inline-flex items-center justify-center ${className ?? ''}`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: TYPE_ICON.mixed }}
      />
    );
  }
  const Icon = ICONS[type];
  return <Icon className={className} aria-hidden="true" />;
}
