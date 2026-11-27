import { formatDistance, distanceKm } from '../lib/geo.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { formatNumber, pluralize } from '../lib/utils.ts';
import { EmptyState } from './EmptyState.tsx';
import { ErrorState, SkeletonList } from './ListStates.tsx';
import { SiteList } from './SiteList.tsx';

export function ListSummary({ explorer }: { explorer: Explorer }) {
  const countries = pluralize(explorer.countries, 'country', 'countries');
  if (explorer.listScope === 'view') {
    return (
      <>
        <span className="font-semibold text-ink">{formatNumber(explorer.listSites.length)}</span> in view of{' '}
        {pluralize(explorer.filtered.length, 'site')} · {countries}
      </>
    );
  }
  return (
    <>
      <span className="font-semibold text-ink">{formatNumber(explorer.filtered.length)}</span>{' '}
      {explorer.filtered.length === 1 ? 'site' : 'sites'} · {countries}
    </>
  );
}

export function ListBody({ explorer }: { explorer: Explorer }) {
  const { origin } = explorer;
  if (explorer.loading) return <SkeletonList />;
  if (explorer.error) return <ErrorState message={explorer.error} onRetry={explorer.reload} />;
  if (explorer.filtered.length === 0) {
    return (
      <EmptyState
        title="No sites match"
        description="Nothing fits this search, type and year range together."
        actionLabel="Reset filters"
        onAction={explorer.reset}
      />
    );
  }
  if (explorer.listSites.length === 0) {
    return (
      <EmptyState
        title="No sites in this part of the map"
        description="There are matches elsewhere. Zoom out, or list all of them."
        actionLabel="List all results"
        onAction={() => explorer.setListScope('all')}
      />
    );
  }
  return (
    <SiteList
      key={explorer.listScope}
      sites={explorer.listSites}
      followHighlight={explorer.listScope === 'view'}
      selectedId={explorer.selectedSite?.id ?? null}
      highlightedId={explorer.highlightedId}
      onSelect={explorer.select}
      onHover={explorer.hover}
      rowHeight={explorer.isDesktop ? 72 : 56}
      extraMeta={
        explorer.sort === 'distance' && origin
          ? (site) => `${formatDistance(distanceKm(origin, site))} away`
          : undefined
      }
      className="h-full"
    />
  );
}
