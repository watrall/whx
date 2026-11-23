import { Landmark, Leaf } from 'lucide-react';
import type { SiteType } from '../lib/types.ts';
import { TYPE_ICON_SHAPE } from '../lib/utils.ts';

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
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={TYPE_ICON_SHAPE.mixed.viewBox} focusable="false">
          <path d={TYPE_ICON_SHAPE.mixed.path} />
        </svg>
      </span>
    );
  }
  const Icon = ICONS[type];
  return <Icon className={className} aria-hidden="true" />;
}
