import type { Explorer } from '../lib/useExplorer.ts';
import { SiteDetail } from './SiteDetail.tsx';

export function DetailCard({ e, variant }: { e: Explorer; variant: 'desktop' | 'mobile' }) {
  const site = e.selectedSite;
  if (!site) return null;
  return (
    <SiteDetail
      site={site}
      variant={variant}
      position={e.detailPosition}
      onStep={e.step}
      nearby={e.nearby?.items}
      nearbyMode={e.nearby?.mode}
      onSelectNearby={e.select}
      saved={e.saved.has(site.id)}
      onToggleSaved={() => e.toggleSaved(site.id)}
      onFilterCountry={e.filterCountry}
      newFromYear={e.domain[1] - 1}
      onClose={e.closeDetail}
    />
  );
}
