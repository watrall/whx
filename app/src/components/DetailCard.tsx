import type { Explorer } from '../lib/useExplorer.ts';
import { SiteDetail } from './SiteDetail.tsx';

export function DetailCard({ explorer, variant }: { explorer: Explorer; variant: 'desktop' | 'mobile' }) {
  const site = explorer.selectedSite;
  if (!site) return null;
  return (
    <SiteDetail
      site={site}
      variant={variant}
      position={explorer.detailPosition}
      onStep={explorer.step}
      nearby={explorer.nearby?.items}
      nearbyMode={explorer.nearby?.mode}
      onSelectNearby={explorer.select}
      saved={explorer.saved.has(site.id)}
      onToggleSaved={() => explorer.toggleSaved(site.id)}
      onFilterCountry={explorer.filterCountry}
      newFromYear={explorer.domain[1] - 1}
      onClose={explorer.closeDetail}
    />
  );
}
